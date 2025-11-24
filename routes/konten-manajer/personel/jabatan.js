const express = require('express')

const Pegawai = require('../../../models/Pegawai')
const Jabatan = require('../../../models/Jabatan')
const { authManajer } = require('../../../middlewares/auth')

const router = express.Router()

router.get('/', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const jabatan = await Jabatan.getAll()

        res.render('konten-manajer/personel/jabatan/index', {pegawai, jabatan})
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/dashboard')
    }
})

router.get('/buat', authManajer, async (req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)

        res.render('konten-manajer/personel/jabatan/buat', {
            pegawai,
            data: req.flash('data')[0]
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/jabatan')
    }
})

router.post('/create', authManajer, async (req, res) => {
    try {
        const { nama_jabatan } = req.body
        const data = { nama_jabatan }

        if (!nama_jabatan) {
            req.flash('error', 'Nama Jabatan wajib diisi')
            req.flash('data', data)
            return res.redirect('/manajer/jabatan/buat')
        }

        if (await Jabatan.checkStore(data)) {
            req.flash('error', 'Nama Jabatan sudah dibuat')
            req.flash('data', data)
            return res.redirect('/manajer/jabatan/buat')
        }

        await Jabatan.store(data)
        req.flash('success', 'Jabatan berhasil dibuat')
        res.redirect('/manajer/jabatan')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/jabatan')
    }
})

router.get('/edit/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const jabatan = await Jabatan.getById(id)

        res.render('konten-manajer/personel/jabatan/edit', {
            pegawai,
            jabatan,
        })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/jabatan')
    }
})

router.post('/update/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params
        const { nama_jabatan } = req.body
        const data = { nama_jabatan }

        if (!nama_jabatan) {
            req.flash('error', 'Nama Jabatan wajib diisi')
            req.flash('data', data)
            return res.redirect(`/manajer/jabatan/edit/${id}`)
        }

        if (await Jabatan.checkUpdate(data, id)) {
            req.flash('error', 'Nama Jabatan sudah dibuat')
            req.flash('data', data)
            return res.redirect(`/manajer/jabatan/edit/${id}`)
        }

        await Jabatan.update(data, id)
        req.flash('success', 'Nama Jabatan berhasil diperbarui')
        res.redirect('/manajer/jabatan')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/jabatan')
    }
})

router.post('/hapus/:id', authManajer, async (req, res) => {
    try {
        const {id} = req.params

        if (await Jabatan.checkUsed(id)) {
            req.flash('error', 'Jabatan sedang digunakan')
            return res.redirect('/manajer/jabatan')
        }

        await Jabatan.delete(id)
        req.flash('success', 'Jabatan berhasil dihapus')
        res.redirect('/manajer/jabatan')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal Server Error')
        res.redirect('/manajer/jabatan')
    }
})

module.exports = router