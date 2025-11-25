const express = require('express')
const bcrypt = require('bcryptjs')

const Pegawai = require('../models/Pegawai')

const router = express.Router()

router.get('/masuk', async (req, res) => {
    try {
        res.render('auths/login', { data: req.flash('data')[0] })
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/masuk')
    }
})

router.post('/log', async (req, res) => {
    try {
        const { nomor_pegawai, kata_sandi } = req.body
        const data = { nomor_pegawai, kata_sandi }

        if (!nomor_pegawai) {
            req.flash('error', 'Nomor Pegawai diperlukan')
            req.flash('data', data)
            return res.redirect('/masuk')
        }

        if (!kata_sandi) {
            req.flash('error', 'Kata Sandi diperlukan')
            req.flash('data', data)
            return res.redirect('/masuk')
        }

        const pegawai = await Pegawai.login(data)

        if (!pegawai) {
            req.flash('error', 'Nomor Pegawai yang anda masukkan salah')
            req.flash('data', data)
            return res.redirect('/masuk')
        }

        const aplikasiKontenManajemen = pegawai.aplikasi.find(
            app => app.nama_aplikasi == 'konten-manajemen'
        )

        if (!aplikasiKontenManajemen || aplikasiKontenManajemen.hak_akses != 'manajer') {
            req.flash('error', 'Akun Anda tidak memiliki akses untuk login ke aplikasi ini')
            req.flash('data', data)
            return res.redirect('/masuk')
        }

        const now = new Date()
        const mulai = pegawai.periode_mulai ? new Date(pegawai.periode_mulai) : null
        const berakhir = pegawai.periode_berakhir ? new Date(pegawai.periode_berakhir) : null

        if (mulai !== null && berakhir !== null) {
            if (!(now >= mulai && now <= berakhir)) {
                req.flash('error', 'Akun Anda tidak aktif pada periode ini')
                req.flash('data', data)
                return res.redirect('/masuk')
            }
        }

        if (pegawai.status_akun != 'Aktif') {
            req.flash('error', 'Akun anda belum aktif, silahkan hubungi Admin')
            req.flash('data', data)
            return res.redirect('/masuk')
        }

        if (!await bcrypt.compare(kata_sandi, pegawai.kata_sandi)) {
            req.flash('error', 'Kata sandi yang anda masukkan salah')
            req.flash('data', data)
            return res.redirect('/masuk')
        }

        req.session.pegawaiId = pegawai.id

        req.flash('success', 'Anda berhasil masuk')
        res.redirect('/manajer/dashboard')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/masuk')
    }
})

router.get('/logout', async(req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        if (req.session.pegawaiId) return res.redirect('/admin/dashboard')
    }
})

module.exports = router