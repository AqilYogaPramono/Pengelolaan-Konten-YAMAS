const express = require('express')

const Pegawai = require('../../../models/Pegawai')
const Anggota = require('../../../models/Anggota')
const Jabatan = require('../../../models/Jabatan')
const { authManajer } = require('../../../middlewares/auth')
const { convertImageFile } = require('../../../middlewares/convertImage')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const sharp = require('sharp')

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../public/images/anggota'))
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random()*1e9)
        cb(null, unique + path.extname(file.originalname))
    }
})

const upload = multer({ storage })

const deleteUploadedFile = (file) => {
    if (file) {
        const filePath = path.join(__dirname, '../../public/images/anggota', file.filename)
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
        const filePath = path.join(__dirname, '../../public/images/anggota', oldPhoto)
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

const isThreeByFourPhoto = async (filePath, tolerance = 0.02) => {
    try {
        const metadata = await sharp(filePath).metadata()
        if (!metadata.width || !metadata.height) return false
        const ratio = metadata.width / metadata.height
        const expected = 3 / 4
        return Math.abs(ratio - expected) <= tolerance
    } catch (err) {
        console.error('Error checking anggota photo ratio:', err)
        return false
    }
}

router.get('/', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const jabatan = await Jabatan.getAll()
        const selectedJabatan = req.flash('selectedJabatan')[0]
        let anggota = await Anggota.getAll()
        if (selectedJabatan) anggota = await Anggota.getByJabatan(selectedJabatan)

        res.render('konten-manajer/personel/anggota/index', {pegawai, anggota, jabatan, selectedJabatan})
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/dashboard')
    }
})

router.post('/filter', authManajer, async (req, res) => {
    try {
        const { jabatan_id } = req.body
        req.flash('selectedJabatan', jabatan_id)
        res.redirect('/manajer/anggota')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/anggota')
    }
})

router.get('/buat', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const jabatan = await Jabatan.getAll()

        res.render('konten-manajer/personel/anggota/buat', {
            pegawai,
            jabatan,
            data: req.flash('data')[0]
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/anggota')
    }
})

router.post('/create', authManajer, upload.single('foto'), async (req, res) => {
    try {
        const { nama, id_jabatan } = req.body
        const foto = req.file ? req.file.filename : null
        const data = { nama, foto, id_jabatan }

        if (!nama) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Nama wajib diisi')
            req.flash('data', data)
            return res.redirect('/manajer/anggota/buat')
        }

        if (!foto) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Foto wajib diisi')
            req.flash('data', data)
            return res.redirect('/manajer/anggota/buat')
        }

        if (!id_jabatan) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Jabatan wajib diisi')
            req.flash('data', data)
            return res.redirect('/manajer/anggota/buat')
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (req.file && !allowedFormats.includes(req.file.mimetype)) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            req.flash('data', req.body)
            return res.redirect('/manajer/anggota/buat')
        }

        if (req.file && req.file.path) {
            const isValidSize = await isThreeByFourPhoto(req.file.path)
            if (!isValidSize) {
                deleteUploadedFile(req.file)
                req.flash('error', 'Foto harus berukuran 3x4')
                req.flash('data', req.body)
                return res.redirect('/manajer/anggota/buat')
            }
        }

        if (req.file && req.file.path) {
            const result = await convertImageFile(req.file.path)
            if (result && result.outputPath) {
                data.foto = path.basename(result.outputPath)
            }
        }

        await Anggota.store(data)
        req.flash('success', 'Anggota berhasil dibuat')
        res.redirect('/manajer/anggota')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/anggota')
    }
})

router.get('/edit/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const anggota = await Anggota.getById(id)
        const jabatan = await Jabatan.getAll()

        res.render('konten-manajer/personel/anggota/edit', {
            pegawai,
            anggota,
            jabatan
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/anggota')
    }
})

router.post('/update/:id', authManajer, upload.single('foto'), async (req, res) => {
    try {
        const {id} = req.params
        const anggota = await Anggota.getById(id)

        const { nama, id_jabatan } = req.body
        const foto = req.file ? req.file.filename : anggota.foto
        const data = { nama, foto, id_jabatan }

        if (!nama) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Nama wajib diisi')
            return res.redirect(`/manajer/anggota/edit/${id}`)
        }

        if (!id_jabatan) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Jabatan wajib diisi')
            return res.redirect(`/manajer/anggota/edit/${id}`)
        }

        const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (req.file && !allowedFormats.includes(req.file.mimetype)) {
            deleteUploadedFile(req.file)
            req.flash('error', 'Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan')
            return res.redirect(`/manajer/anggota/edit/${id}`)
        }

        if (req.file && req.file.path) {
            const isValidSize = await isThreeByFourPhoto(req.file.path)
            if (!isValidSize) {
                deleteUploadedFile(req.file)
                req.flash('error', 'Foto harus berukuran 3x4')
                return res.redirect(`/manajer/anggota/edit/${id}`)
            }
        }

        if (req.file && req.file.path) {
            const result = await convertImageFile(req.file.path)
            if (result && result.outputPath) {
                data.foto = path.basename(result.outputPath)
            }
        }

        if (req.file && anggota.foto) deleteOldPhoto(anggota.foto)

        await Anggota.update(data, id)
        req.flash('success', 'Anggota berhasil diperbarui')
        res.redirect('/manajer/anggota')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/anggota')
    }
})

router.post('/hapus/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params

        const anggota = await Anggota.getById(id)
        if (anggota && anggota.foto) {
            deleteOldPhoto(anggota.foto)
        }

        await Anggota.delete(id)
        req.flash('success', 'Anggota berhasil dihapus')
        res.redirect('/manajer/anggota')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/anggota')
    }
})

module.exports = router
