const express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const sharp = require('sharp')

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

const deleteStoredCover = (filename) => {
    if (!filename) return
    const filePath = path.join(__dirname, '../../public/images/kunjungan', filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
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

const processUploadedCover = async (file) => {
    if (!file) return null
    let finalName = file.filename
    if (file.path) {
        const converted = await convertImageFile(file.path)
        if (converted && converted.outputPath) {
            finalName = path.basename(converted.outputPath)
        }
    }
    return finalName
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
        const flashedKeyword = req.flash('keyword')[0]

        if (flashedKeyword) {
            const kunjungan = await Kunjungan.searchByJudul(flashedKeyword)
            return res.render('konten-manajer/kunjungan/index', {
                kunjungan,
                pegawai,
                page: 1,
                totalHalaman: 1,
                keyword: flashedKeyword
            })
        }

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

router.post('/search', authManajer, async (req, res) => {
    try {
        const { judul } = req.body
        req.flash('keyword', judul || '')
        res.redirect('/manajer/kunjungan')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/kunjungan')
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

router.post('/create', authManajer, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'foto' }]), async (req, res) => {
    const coverFile = req.files?.cover?.[0] || null
    const files = req.files?.foto || []

        try {
            const { judul, deskripsi, waktu_kunjungan } = req.body
            const data = { judul, deskripsi, waktu_kunjungan }

            if (!judul || !deskripsi || !waktu_kunjungan || !coverFile || files.length === 0) {
                deleteUploadedFiles(files)
                if (coverFile) deleteUploadedFiles([coverFile])
                req.flash('error', 'Semua field wajib diisi')
                req.flash('data', data)
                return res.redirect('/manajer/kunjungan/buat')
            }

            const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

            if (!allowedFormats.includes(coverFile.mimetype)) {
                deleteUploadedFiles(files)
                deleteUploadedFiles([coverFile])
                req.flash('error', 'Cover harus berupa gambar (jpg, jpeg, png, webp)')
                req.flash('data', data)
                return res.redirect('/manajer/kunjungan/buat')
            }

            if (files.some(file => !allowedFormats.includes(file.mimetype))) {
                deleteUploadedFiles(files)
                deleteUploadedFiles([coverFile])
                req.flash('error', 'Semua foto harus berupa gambar (jpg, jpeg, png, webp)')
                req.flash('data', data)
                return res.redirect('/manajer/kunjungan/buat')
            }

            const isValidDimensions = await checkImageDimensions(coverFile.path)
            if (!isValidDimensions) {
                deleteUploadedFiles(files)
                deleteUploadedFiles([coverFile])
                req.flash('error', 'Dimensi gambar cover harus 3240x1272 pixel')
                req.flash('data', data)
                return res.redirect('/manajer/kunjungan/buat')
            }

            const processedCover = await processUploadedCover(coverFile)
            data.cover = processedCover

            const result = await Kunjungan.store(data)
            const kunjunganId = result.insertId

            const processedPhotos = await processUploadedPhotos(files)
            await Kunjungan.addPhotos(kunjunganId, processedPhotos)

            req.flash('success', 'Data kunjungan berhasil ditambahkan')
            res.redirect('/manajer/kunjungan')
        } catch (err) {
            console.error(err)
            deleteUploadedFiles(req.files?.foto || [])
            if (req.files?.cover?.[0]) deleteUploadedFiles([req.files.cover[0]])
            req.flash('error', 'Internal Server Error')
            res.redirect('/manajer/kunjungan')
        }
    }
)

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

router.post('/update/:id', authManajer, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'foto' }]), async (req, res) => {
    const coverFile = req.files?.cover?.[0] || null
    const files = req.files?.foto || []

        try {
            const { id } = req.params
            const kunjungan = await Kunjungan.getById(id)

            if (!kunjungan) {
                deleteUploadedFiles(files)
                if (coverFile) deleteUploadedFiles([coverFile])
                req.flash('error', 'Data tidak ditemukan')
                return res.redirect('/manajer/kunjungan')
            }

            const { judul, deskripsi, waktu_kunjungan } = req.body

            if (!judul || !deskripsi || !waktu_kunjungan) {
                deleteUploadedFiles(files)
                if (coverFile) deleteUploadedFiles([coverFile])
                req.flash('error', 'Semua field wajib diisi')
                return res.redirect(`/manajer/kunjungan/edit/${id}`)
            }

            const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

            if (coverFile && !allowedFormats.includes(coverFile.mimetype)) {
                deleteUploadedFiles(files)
                deleteUploadedFiles([coverFile])
                req.flash('error', 'Cover harus berupa gambar (jpg, jpeg, png, webp)')
                return res.redirect(`/manajer/kunjungan/edit/${id}`)
            }

            if (files.some(file => !allowedFormats.includes(file.mimetype))) {
                deleteUploadedFiles(files)
                if (coverFile) deleteUploadedFiles([coverFile])
                req.flash('error', 'Semua foto harus berupa gambar (jpg, jpeg, png, webp)')
                return res.redirect(`/manajer/kunjungan/edit/${id}`)
            }

            if (coverFile && coverFile.path) {
                const isValidDimensions = await checkImageDimensions(coverFile.path)
                if (!isValidDimensions) {
                    deleteUploadedFiles(files)
                    deleteUploadedFiles([coverFile])
                    req.flash('error', 'Dimensi gambar cover harus 3240x1272 pixel')
                    return res.redirect(`/manajer/kunjungan/edit/${id}`)
                }
            }

            let hapusFoto = req.body.hapus_foto || []
            if (!Array.isArray(hapusFoto)) hapusFoto = [hapusFoto]
            hapusFoto = hapusFoto.filter(Boolean)

            const fotoLama = await Kunjungan.getPhotosByKunjunganId(id)
            const sisaFotoLama = fotoLama.filter(f => !hapusFoto.includes(String(f.id)))

            if (sisaFotoLama.length === 0 && files.length === 0) {
                deleteUploadedFiles(files)
                if (coverFile) deleteUploadedFiles([coverFile])
                req.flash('error', 'Minimal harus ada 1 foto')
                return res.redirect(`/manajer/kunjungan/edit/${id}`)
            }

            const updateData = { judul, deskripsi, waktu_kunjungan }

            if (coverFile) {
                if (kunjungan.cover) {
                    deleteStoredCover(kunjungan.cover)
                }
                const processedCover = await processUploadedCover(coverFile)
                updateData.cover = processedCover
            }

            await Kunjungan.update(updateData, id)

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
            deleteUploadedFiles(req.files?.foto || [])
            if (req.files?.cover?.[0]) deleteUploadedFiles([req.files.cover[0]])
            req.flash('error', 'Internal Server Error')
            res.redirect('/manajer/kunjungan')
        }
    }
)

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

        if (kunjungan.cover) {
            deleteStoredCover(kunjungan.cover)
        }

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