const express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')

const Pegawai = require('../../models/Pegawai')
const Magang = require('../../models/Magang')
const { convertImageFile } = require('../../middlewares/convertImage')
const { authManajer } = require('../../middlewares/auth')

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/images/magang'))
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, unique + path.extname(file.originalname))
    }
})

const upload = multer({ storage })

const deleteUploadedFiles = (files = []) => {
    files.forEach(file => {
        const fileName = typeof file === 'string' ? file : file.filename
        if (!fileName) return
        const filePath = path.join(__dirname, '../../public/images/magang', fileName)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    })
}

const deleteStoredPhoto = (filename) => {
    if (!filename) return
    const filePath = path.join(__dirname, '../../public/images/magang', filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

const processUploadedPhotos = async (files = []) => {
    const results = []
    for (const file of files) {
        let finalName = file.filename
        if (file.path) {
            const converted = await convertImageFile(file.path)
            if (converted && converted.outputPath) {
                finalName = path.basename(converted.outputPath)
            }
        }
        results.push(finalName)
    }
    return results
}

router.get('/', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const page = parseInt(req.query.page) || 1
        const limit = 20
        const offset = (page - 1) * limit

        const magang = await Magang.getMagang(limit, offset)
        const countResult = await Magang.getCountMagang()
        const totalMagang = countResult[0].total_magang
        const totalHalaman = Math.ceil(totalMagang / limit)

        res.render('konten-manajer/magang/index', { magang, pegawai, page, totalHalaman })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/dashboard')
    }
})

router.get('/detail/:id', authManajer, async (req, res) => {
    try {
        const { id } = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const magang = await Magang.getById(id)

        if (!magang) {
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/magang')
        }

        const foto = await Magang.getPhotos(id)

        res.render('konten-manajer/magang/detail', { magang, pegawai, foto })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/magang')
    }
})

router.get('/buat', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        res.render('konten-manajer/magang/buat', {
            pegawai,
            data: req.flash('data')[0]
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/magang')
    }
})

router.post('/create', authManajer, upload.array('foto', 10), async (req, res) => {
    const files = req.files || []
    try {
        const { judul, deskripsi_tugas, periode_mulai, periode_berakhir } = req.body
        const data = { judul, deskripsi_tugas, periode_mulai, periode_berakhir }

        if (!judul || !deskripsi_tugas || !periode_mulai || !periode_berakhir) {
            deleteUploadedFiles(files)
            req.flash('error', 'Semua field wajib diisi')
            req.flash('data', data)
            return res.redirect('/manajer/magang/buat')
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (files.some(file => !allowedFormats.includes(file.mimetype))) {
            deleteUploadedFiles(files)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', data)
            return res.redirect('/manajer/magang/buat')
        }

        const result = await Magang.store(data)
        const magangId = result.insertId

        if (files.length) {
            const processedPhotos = await processUploadedPhotos(files)
            await Magang.addPhotos(magangId, processedPhotos)
        }

        req.flash('success', 'Data magang berhasil ditambahkan')
        res.redirect('/manajer/magang')
    } catch (err) {
        console.error(err)
        deleteUploadedFiles(req.files)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/magang')
    }
})

router.get('/edit/:id', authManajer, async (req, res) => {
    try {
        const { id } = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        const magang = await Magang.getById(id)
        if (!magang) {
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/magang')
        }

        const foto = await Magang.getPhotos(id)

        res.render('konten-manajer/magang/edit', {
            pegawai,
            magang,
            foto
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/magang')
    }
})

router.post('/update/:id', authManajer, upload.array('foto', 10), async (req, res) => {
    const files = req.files || []
    try {
        const { id } = req.params
        const magang = await Magang.getById(id)

        if (!magang) {
            deleteUploadedFiles(files)
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/magang')
        }

        const { judul, deskripsi_tugas, periode_mulai, periode_berakhir } = req.body

        if (!judul || !deskripsi_tugas || !periode_mulai || !periode_berakhir) {
            deleteUploadedFiles(files)
            req.flash('error', 'Semua field wajib diisi')
            return res.redirect(`/manajer/magang/edit/${id}`)
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (files.some(file => !allowedFormats.includes(file.mimetype))) {
            deleteUploadedFiles(files)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            return res.redirect(`/manajer/magang/edit/${id}`)
        }

        await Magang.update({ judul, deskripsi_tugas, periode_mulai, periode_berakhir }, id)

        let hapusFoto = req.body.hapus_foto || []
        if (!Array.isArray(hapusFoto)) hapusFoto = [hapusFoto]
        hapusFoto = hapusFoto.filter(Boolean)

        if (hapusFoto.length) {
            const existingPhotos = await Magang.getPhotosByIds(hapusFoto)
            existingPhotos.forEach(photo => deleteStoredPhoto(photo.foto))
            await Magang.deletePhotosByIds(hapusFoto)
        }

        if (files.length) {
            const processedPhotos = await processUploadedPhotos(files)
            await Magang.addPhotos(id, processedPhotos)
        }

        req.flash('success', 'Data magang berhasil diperbarui')
        res.redirect(`/manajer/magang/detail/${id}`)
    } catch (err) {
        console.error(err)
        deleteUploadedFiles(req.files)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/magang')
    }
})

router.post('/hapus/:id', authManajer, async (req, res) => {
    try {
        const { id } = req.params
        const magang = await Magang.getById(id)

        if (!magang) {
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/magang')
        }

        const foto = await Magang.getPhotos(id)
        foto.forEach(item => deleteStoredPhoto(item.foto))

        await Magang.delete(id)
        req.flash('success', 'Data magang berhasil dihapus')
        res.redirect('/manajer/magang')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/magang')
    }
})

module.exports = router