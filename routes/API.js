const express = require('express')

const Pengumuman = require('../models/Pengumuman')
const HalamanUtama = require('../models/HalamanUtama')
const Anggota = require('../models/Anggota')
const Magang = require('../models/Magang')
const Kunjungan = require('../models/Kunjungan')

const router = express.Router()

router.get('/halaman-utama', async(req, res) => {
    try {
        const halaman_utama = await HalamanUtama.getAll()
        res.status(200).json({ halaman_utama })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/pembimbing', async(req, res) => {
    try {
        const pembimbing = await Anggota.getByNamaJabatan('pembimbing')
        res.status(200).json({ pembimbing })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/pengawas', async(req, res) => {
    try {
        const pengawas = await Anggota.getByNamaJabatan('pengawas')
        res.status(200).json({ pengawas })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/pengurus', async(req, res) => {
    try {
        const pengurus = await Anggota.getByNamaJabatan('pengurus')
        res.status(200).json({ pengurus })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/pengumuman', async(req, res) => {
    try {
        const pengumuman = await Pengumuman.getForAPI()
        res.status(200).json({ pengumuman })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/pengumuman/:id', async(req, res) => {
    try {
        const {id} = req.params
        const pengumuman = await Pengumuman.getDetailForAPI(id)
            
        res.status(200).json({ pengumuman })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/magang', async(req, res) => {
    try {
        const magang = await Magang.getAllWithFirstPhoto()
        res.status(200).json({ magang })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/magang/:id', async(req, res) => {
    try {
        const {id} = req.params
        const magang = await Magang.getDetailWithPhotos(id)
        
        if (!magang) {
            return res.status(404).json({message: 'Data tidak ditemukan'})
        }
        
        res.status(200).json({ magang })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/kunjungan', async(req, res) => {
    try {
        const kunjungan = await Kunjungan.getAllWithFirstPhoto()
        res.status(200).json({ kunjungan })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/kunjungan/:id', async(req, res) => {
    try {
        const {id} = req.params
        const kunjungan = await Kunjungan.getDetailWithPhotos(id)
        
        res.status(200).json({ kunjungan })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

module.exports = router