const express = require('express')

const HalamanUtama = require('../../models/HalamanUtama')
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
        cb(null, path.join(__dirname, '../../public/images/halaman-utama'))
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random()*1e9)
        cb(null, unique + path.extname(file.originalname))
    }
})

const upload = multer({ storage })

const deleteUploadedFile = (file) => {
    if (file) {
        const filePath = path.join(__dirname, '../../public/images/halaman-utama', file.filename)
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath)
            } catch (err) {
                if (err.code !== 'EBUSY' && err.code !== 'ENOENT') {
                    console.error('Error deleting uploaded file:', err)
                }
            }
        }
    }
}

const deleteOldPhoto = (oldPhoto) => {
    if (oldPhoto) {
        const filePath = path.join(__dirname, '../../public/images/halaman-utama', oldPhoto)
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath)
            } catch (err) {
                if (err.code !== 'EBUSY' && err.code !== 'ENOENT') {
                    console.error('Error deleting old photo:', err)
                }
            }
        }
    }
}

const checkImageDimensions = async (filePath, requiredWidth = 3240, requiredHeight = 1272) => {
    try {
        const metadata = await sharp(filePath).metadata()
        return metadata.width === requiredWidth && metadata.height === requiredHeight
    } catch (err) {
        console.error('Error checking image dimensions:', err)
        return false
    }
}

router.get('/', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const halamanUtama = await HalamanUtama.getAll()
        const count = await HalamanUtama.getCount()

        res.render('konten-manajer/halaman-utama/index', { halamanUtama, pegawai, count })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/dashboard')
    }
})

router.get('/buat', authManajer, async (req, res) => {
    try {
        const count = await HalamanUtama.getCount()
        if (count >= 8) {
            req.flash('error', 'Maksimal hanya 8 foto yang dapat diupload')
            return res.redirect('/manajer/halaman-utama')
        }

        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const usedUrutan = await HalamanUtama.getUsedUrutan()
        const availableUrutan = []
        for (let i = 1; i <= 8; i++) {
            if (!usedUrutan.includes(i)) {
                availableUrutan.push(i)
            }
        }

        res.render('konten-manajer/halaman-utama/buat', {
            pegawai,
            availableUrutan,
            data: req.flash('data')[0]
        })

    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/halaman-utama')
    }
})

router.post('/create', authManajer, upload.single('foto'), async (req, res) => {
    try {
        const count = await HalamanUtama.getCount()
        if (count >= 8) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Maksimal hanya 8 foto yang dapat diupload')
            return res.redirect('/manajer/halaman-utama')
        }

        const { urutan } = req.body
        const foto = req.file ? req.file.filename : null
        const data = {foto, urutan: parseInt(urutan)}

        if (!foto) {
            deleteUploadedFile(req.file)

            req.flash("error", "Foto tidak boleh kosong")
            req.flash('data', data)
            return res.redirect('/manajer/halaman-utama/buat')
        }

        if (!urutan) {
            deleteUploadedFile(req.file)

            req.flash("error", "Urutan tidak boleh kosong")
            req.flash('data', data)
            return res.redirect('/manajer/halaman-utama/buat')
        }

        const usedUrutan = await HalamanUtama.getUsedUrutan()
        if (usedUrutan.includes(parseInt(urutan))) {
            deleteUploadedFile(req.file)

            req.flash("error", "Urutan sudah digunakan")
            req.flash('data', data)
            return res.redirect('/manajer/halaman-utama/buat')
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (req.file && !allowedFormats.includes(req.file.mimetype)) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', req.body)
            return res.redirect('/manajer/halaman-utama/buat')
        }

        if (req.file && req.file.path) {
            const isValidDimensions = await checkImageDimensions(req.file.path)
            if (!isValidDimensions) {
                deleteUploadedFile(req.file)
                req.flash('error', 'Dimensi gambar harus 3240x1272 pixel')
                req.flash('data', req.body)
                return res.redirect('/manajer/halaman-utama/buat')
            }
        }

        if (req.file && req.file.path) {
            const result = await convertImageFile(req.file.path)
            if (result && result.outputPath) {
                data.foto = path.basename(result.outputPath)
            }
        }

        await HalamanUtama.store(data)
        req.flash('success', 'Data Berhasil Ditambahkan')
        res.redirect('/manajer/halaman-utama')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/halaman-utama')
    }
})

router.get('/edit/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        const halamanUtama = await HalamanUtama.getById(id)
        const usedUrutan = await HalamanUtama.getUsedUrutan()
        const currentUrutan = halamanUtama.urutan
        const availableUrutan = []
        for (let i = 1; i <= 8; i++) {
            if (!usedUrutan.includes(i) || i == currentUrutan) {
                availableUrutan.push(i)
            }
        }

        res.render('konten-manajer/halaman-utama/edit', {
            pegawai,
            halamanUtama,
            availableUrutan
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/halaman-utama')
    }
})

router.post('/update/:id', authManajer, upload.single('foto'), async (req, res) => {
    try {
        const {id} = req.params

        const halamanUtama = await HalamanUtama.getById(id)

        const {urutan} = req.body
        const foto = req.file ? req.file.filename : halamanUtama.foto
        const data = {foto, urutan: parseInt(urutan)}

        if (!foto) {
            deleteUploadedFile(req.file)

            req.flash("error", "Foto tidak boleh kosong")
            return res.redirect(`/manajer/halaman-utama/edit/${id}`)
        }

        if (!urutan) {
            deleteUploadedFile(req.file)

            req.flash("error", "Urutan tidak boleh kosong")
            return res.redirect(`/manajer/halaman-utama/edit/${id}`)
        }

        const usedUrutan = await HalamanUtama.getUsedUrutan()
        if (parseInt(urutan) != halamanUtama.urutan && usedUrutan.includes(parseInt(urutan))) {
            deleteUploadedFile(req.file)

            req.flash("error", "Urutan sudah digunakan")
            return res.redirect(`/manajer/halaman-utama/edit/${id}`)
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (req.file && !allowedFormats.includes(req.file.mimetype)) {
            deleteUploadedFile(req.file)

            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', req.body)
            return res.redirect(`/manajer/halaman-utama/edit/${id}`)
        }

        if (req.file && req.file.path) {
            const isValidDimensions = await checkImageDimensions(req.file.path)
            if (!isValidDimensions) {
                deleteUploadedFile(req.file)
                req.flash('error', 'Dimensi gambar harus 3240x1272 pixel')
                return res.redirect(`/manajer/halaman-utama/edit/${id}`)
            }
        }

        if (req.file && req.file.path) {
            const oldPhoto = halamanUtama.foto
            const result = await convertImageFile(req.file.path)
            if (result && result.outputPath) {
                data.foto = path.basename(result.outputPath)
                if (oldPhoto && oldPhoto !== data.foto) {
                    deleteOldPhoto(oldPhoto)
                }
            }
        }

        await HalamanUtama.update(data, id)
        req.flash('success', 'Data berhasil diperbarui')
        res.redirect('/manajer/halaman-utama')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/halaman-utama')
    }
})

router.post('/hapus/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params

        const data = await HalamanUtama.getById(id)
        if (data && data.foto) {
            deleteOldPhoto(data.foto)
        }

        await HalamanUtama.delete(id)
        req.flash('success', 'Data berhasil dihapus')
        res.redirect('/manajer/halaman-utama')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/manajer/halaman-utama')
    }
})

module.exports = router
