const express = require('express')

const Pegawai = require('../../models/Pegawai')
const HalamanUtama = require('../../models/HalamanUtama')
const Kunjungan = require('../../models/Kunjungan')
const Magang = require('../../models/Magang')
const { authManajer } = require('../../middlewares/auth')

const router = express.Router()

router.get('/', authManajer, async(req, res) => {
    try {
        const pegawai = await Pegawai.getNama(req.session.pegawaiId)
        const countPhotoLandingpage = await HalamanUtama.countPhoto()
        const countKunjungan = await Kunjungan.countKunjungan()
        const countMagang = await Magang.countMagang()

        res.render('konten-manajer/dashboard', {pegawai, countPhotoLandingpage: countPhotoLandingpage[0].count_photo_landingpage, countKunjungan: countKunjungan[0].count_kunjungan, countMagang: countMagang[0].count_magang})
    } catch (err) {
        console.error(err)
        req.flash('error', 'Internal server error')
        res.redirect('/')
    }
})

module.exports = router