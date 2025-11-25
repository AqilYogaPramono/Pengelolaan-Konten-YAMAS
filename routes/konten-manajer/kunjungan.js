const express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')

const Pegawai = require('../../models/Pegawai')
const Kunjungan = require('../../models/Kunjungan')
const { convertImageFile } = require('../../middlewares/convertImage')
const { authManajer } = require('../../middlewares/auth')

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/images/kunjungan'))
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
        const filePath = path.join(__dirname, '../../public/images/kunjungan', fileName)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    })
}

const deleteStoredPhoto = (filename) => {
    if (!filename) return
    const filePath = path.join(__dirname, '../../public/images/kunjungan', filename)
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

        const kunjungan = await Kunjungan.getKunjungan(limit, offset)
        const countResult = await Kunjungan.getCountKunjungan()
        const totalKunjungan = countResult[0].total_kunjungan
        const totalHalaman = Math.ceil(totalKunjungan / limit)

        res.render('konten-manajer/kunjungan/index', { kunjungan, pegawai, page, totalHalaman })
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
        const kunjungan = await Kunjungan.getById(id)

        if (!kunjungan) {
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/kunjungan')
        }

        const foto = await Kunjungan.getPhotos(id)

        res.render('konten-manajer/kunjungan/detail', { kunjungan, pegawai, foto })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
    }
})

router.get('/buat', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        res.render('konten-manajer/kunjungan/buat', {
            pegawai,
            data: req.flash('data')[0]
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
    }
})

router.post('/create', authManajer, upload.array('foto', 10), async (req, res) => {
    const files = req.files || []
    try {
        const { judul, deskripsi, waktu_kunjungan } = req.body
        const data = { judul, deskripsi, waktu_kunjungan }

        if (!judul || !deskripsi || !waktu_kunjungan) {
            deleteUploadedFiles(files)
            req.flash('error', 'Semua field wajib diisi')
            req.flash('data', data)
            return res.redirect('/manajer/kunjungan/buat')
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (files.some(file => !allowedFormats.includes(file.mimetype))) {
            deleteUploadedFiles(files)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', data)
            return res.redirect('/manajer/kunjungan/buat')
        }

        const result = await Kunjungan.store(data)
        const kunjunganId = result.insertId

        if (files.length) {
            const processedPhotos = await processUploadedPhotos(files)
            await Kunjungan.addPhotos(kunjunganId, processedPhotos)
        }

        req.flash('success', 'Data kunjungan berhasil ditambahkan')
        res.redirect('/manajer/kunjungan')
    } catch (err) {
        console.error(err)
        deleteUploadedFiles(req.files)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
    }
})

router.get('/edit/:id', authManajer, async (req, res) => {
    try {
        const { id } = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        const kunjungan = await Kunjungan.getById(id)
        if (!kunjungan) {
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/kunjungan')
        }

        const foto = await Kunjungan.getPhotos(id)

        res.render('konten-manajer/kunjungan/edit', {
            pegawai,
            kunjungan,
            foto
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
    }
})

router.post('/update/:id', authManajer, upload.array('foto', 10), async (req, res) => {
    const files = req.files || []
    try {
        const { id } = req.params
        const kunjungan = await Kunjungan.getById(id)

        if (!kunjungan) {
            deleteUploadedFiles(files)
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/kunjungan')
        }

        const { judul, deskripsi, waktu_kunjungan } = req.body

        if (!judul || !deskripsi || !waktu_kunjungan) {
            deleteUploadedFiles(files)
            req.flash('error', 'Semua field wajib diisi')
            return res.redirect(`/manajer/kunjungan/edit/${id}`)
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (files.some(file => !allowedFormats.includes(file.mimetype))) {
            deleteUploadedFiles(files)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            return res.redirect(`/manajer/kunjungan/edit/${id}`)
        }

        await Kunjungan.update({ judul, deskripsi, waktu_kunjungan }, id)

        let hapusFoto = req.body.hapus_foto || []
        if (!Array.isArray(hapusFoto)) hapusFoto = [hapusFoto]
        hapusFoto = hapusFoto.filter(Boolean)

        if (hapusFoto.length) {
            const existingPhotos = await Kunjungan.getPhotosByIds(hapusFoto)
            existingPhotos.forEach(photo => deleteStoredPhoto(photo.foto))
            await Kunjungan.deletePhotosByIds(hapusFoto)
        }

        if (files.length) {
            const processedPhotos = await processUploadedPhotos(files)
            await Kunjungan.addPhotos(id, processedPhotos)
        }

        req.flash('success', 'Data kunjungan berhasil diperbarui')
        res.redirect(`/manajer/kunjungan/detail/${id}`)
    } catch (err) {
        console.error(err)
        deleteUploadedFiles(req.files)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
    }
})

router.post('/hapus/:id', authManajer, async (req, res) => {
    try {
        const { id } = req.params
        const kunjungan = await Kunjungan.getById(id)

        if (!kunjungan) {
            req.flash('error', 'Data tidak ditemukan')
            return res.redirect('/manajer/kunjungan')
        }

        const foto = await Kunjungan.getPhotos(id)
        foto.forEach(item => deleteStoredPhoto(item.foto))

        await Kunjungan.delete(id)
        req.flash('success', 'Data kunjungan berhasil dihapus')
        res.redirect('/manajer/kunjungan')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
    }
})

module.exports = router