const express = require('express')

const Pengumuman = require('../../models/Pengumuman')
const Pegawai = require('../../models/Pegawai')
const { authManajer } = require('../../middlewares/auth')
const { convertImageFile } = require('../../middlewares/convertImage')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const sharp = require('sharp')

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/images/pengumuman'))
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random()*1e9)
        cb(null, unique + path.extname(file.originalname))
    }
})

const upload = multer({ storage })

const deleteUploadedFile = (file) => {
    if (file) {
        const filePath = path.join(__dirname, '../../public/images/pengumuman', file.filename)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
}

const deleteOldPhoto = (oldPhoto) => {
    if (oldPhoto) {
        const filePath = path.join(__dirname, '../../public/images/pengumuman', oldPhoto)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
}

const checkImageDimensions = async (filePath, requiredWidth = 3240, requiredHeight = 1272) => {
    try {
        const metadata = await sharp(filePath).metadata()
        return metadata.width === requiredWidth && metadata.height === requiredHeight
    } catch (err) {
        console.error('Error checking pengumuman image dimensions:', err)
        return false
    }
}

router.get('/', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const page = parseInt(req.query.page) || 1
        const limit = 20
        const offset = (page - 1) * limit
        const flashedKeyword = req.flash('keyword')[0]

        if (flashedKeyword) {
            const pengumuman = await Pengumuman.searchByJudul(flashedKeyword)
            return res.render('konten-manajer/pengumuman/index', {
                pengumuman,
                pegawai,
                page: 1,
                totalHalaman: 1,
                keyword: flashedKeyword
            })
        }

        const pengumuman = await Pengumuman.getPengumuman(limit, offset)
        const countResult = await Pengumuman.getCountPengumuman()
        const totalPengumuman = countResult[0].total_pengumuman
        const totalHalaman = Math.ceil(totalPengumuman / limit)

        res.render('konten-manajer/pengumuman/index', { pengumuman, pegawai, page, totalHalaman })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/dashboard')
    }
})

router.get('/buat', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        res.render('konten-manajer/pengumuman/buat', {
            pegawai,
            data: req.flash('data')[0]
        })

    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

router.post('/create', authManajer, upload.single('foto'), async (req, res) => {
    try {
        const { judul, isi } = req.body
        const foto = req.file ? req.file.filename : null
        const data = {judul, isi, foto}

        if (!judul) {
            deleteUploadedFile(req.file)

            req.flash("error", "Judul pengumuman tidak boleh kosong")
            req.flash('data', data)
            return res.redirect('/manajer/pengumuman/buat')
        }

        if (!isi) {
            deleteUploadedFile(req.file)

            req.flash("error", "Isi pengumuman tidak boleh kosong")
            req.flash('data', data)
            return res.redirect('/manajer/pengumuman/buat')
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (req.file && !allowedFormats.includes(req.file.mimetype)) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', req.body)
            return res.redirect('/manajer/pengumuman/buat')
        }

        if (req.file && req.file.path) {
            const isValidDimensions = await checkImageDimensions(req.file.path)
            if (!isValidDimensions) {
                deleteUploadedFile(req.file)
                req.flash('error', 'Dimensi gambar harus 3240x1272 pixel')
                req.flash('data', req.body)
                return res.redirect('/manajer/pengumuman/buat')
            }
        }

        if (req.file && req.file.path) {
            const result = await convertImageFile(req.file.path)
            if (result && result.outputPath) {
                data.foto = path.basename(result.outputPath)
            }
        }

        await Pengumuman.store(data)
        req.flash('success', 'Data Berhasil Ditambahkan')
        res.redirect('/manajer/pengumuman')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

router.post('/search', authManajer, async (req, res) => {
    try {
        const { judul } = req.body
        req.flash('keyword', judul || '')
        res.redirect('/manajer/pengumuman')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

router.get('/detail/:id', authManajer, async (req, res) => {
    try {
        const { id } = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const pengumuman = await Pengumuman.getById(id)

        if (!pengumuman) {
            req.flash('error', 'Data pengumuman tidak ditemukan')
            return res.redirect('/manajer/pengumuman')
        }

        res.render('konten-manajer/pengumuman/detail', { pegawai, pengumuman })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

router.get('/edit/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        const pengumuman = await Pengumuman.getById(id)

        res.render('konten-manajer/pengumuman/edit', {
            pegawai,
            pengumuman
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

router.post('/update/:id', authManajer, upload.single('foto'), async (req, res) => {
    try {
        const {id} = req.params

        const pengumuman = await Pengumuman.getById(id)

        const {judul, isi} = req.body
        const foto = req.file ? req.file.filename : pengumuman.foto
        const data = {judul, isi, foto}

        if (!judul) {
            deleteUploadedFile(req.file)

            req.flash("error", "Judul pengumuman tidak boleh kosong")
            return res.redirect(`/manajer/pengumuman/edit/${id}`)
        }

        if (!isi) {
            deleteUploadedFile(req.file)

            req.flash("error", "Isi pengumuman tidak boleh kosong")
            return res.redirect(`/manajer/pengumuman/edit/${id}`)
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (req.file && !allowedFormats.includes(req.file.mimetype)) {
            deleteUploadedFile(req.file)

            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', req.body)
            return res.redirect(`/manajer/pengumuman/edit/${id}`)
        }

        if (req.file && req.file.path) {
            const isValidDimensions = await checkImageDimensions(req.file.path)
            if (!isValidDimensions) {
                deleteUploadedFile(req.file)
                req.flash('error', 'Dimensi gambar harus 3240x1272 pixel')
                return res.redirect(`/manajer/pengumuman/edit/${id}`)
            }
        }

        if (req.file && req.file.path) {
            const result = await convertImageFile(req.file.path)
            if (result && result.outputPath) {
                data.foto = path.basename(result.outputPath)
            }
        }

        if (req.file && pengumuman.foto) deleteOldPhoto(pengumuman.foto)

        await Pengumuman.update(data, id)
        req.flash('success', 'Data berhasil diperbarui')
        res.redirect('/manajer/pengumuman')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

router.post('/hapus/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params

        const data = await Pengumuman.getById(id)
        if (data && data.foto) {
            deleteOldPhoto(data.foto)
        }

        await Pengumuman.delete(id)
        req.flash('success', 'Data berhasil dihapus')
        res.redirect('/manajer/pengumuman')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/pengumuman')
    }
})

module.exports = router
