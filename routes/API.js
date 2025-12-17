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

router.get('/pembina', async(req, res) => {
    try {
        const pembina = await Anggota.getByNamaJabatan('pembina')
        res.status(200).json({ pembina })
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
        const page = parseInt(req.query.page) || 1
        const limit = 15
        const offset = (page - 1) * limit
        
        const pengumuman = await Pengumuman.getForAPI(limit, offset)
        const countResult = await Pengumuman.getCountPengumuman()
        const totalPengumuman = countResult[0].total_pengumuman
        const totalHalaman = Math.ceil(totalPengumuman / limit)
        
        res.status(200).json({ 
            pengumuman,
            pagination: {
                page,
                limit,
                totalPengumuman,
                totalHalaman
            }
        })
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

router.post('/pengumuman/search', async(req, res) => {
    try {
        const { keyword } = req.body
        
        if (!keyword || !keyword.trim()) {
            return res.status(400).json({message: 'Keyword tidak boleh kosong'})
        }

        const pengumuman = await Pengumuman.searchByJudulForAPI(keyword.trim())
        res.status(200).json({ pengumuman })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/magang', async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 15
        const offset = (page - 1) * limit

        const magang = await Magang.getPaginatedWithFirstPhoto(limit, offset)
        const countResult = await Magang.getCountMagang()
        const totalMagang = countResult[0].total_magang
        const totalHalaman = Math.ceil(totalMagang / limit)

        res.status(200).json({
            magang,
            pagination: {
                page,
                limit,
                totalMagang,
                totalHalaman
            }
        })
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

router.post('/magang/search', async(req, res) => {
    try {
        const { keyword } = req.body

        if (!keyword || !keyword.trim()) {
            return res.status(400).json({message: 'Keyword tidak boleh kosong'})
        }

        const magang = await Magang.searchByJudulWithPhoto(keyword.trim())
        res.status(200).json({ magang })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/kunjungan', async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 15
        const offset = (page - 1) * limit

        const kunjungan = await Kunjungan.getPaginatedWithFirstPhoto(limit, offset)
        const countResult = await Kunjungan.getCountKunjungan()
        const totalKunjungan = countResult[0].total_kunjungan
        const totalHalaman = Math.ceil(totalKunjungan / limit)

        res.status(200).json({
            kunjungan,
            pagination: {
                page,
                limit,
                totalKunjungan,
                totalHalaman
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get('/kunjungan/:id', async(req, res) => {
    try {
        const {id} = req.params
        const kunjungan = await Kunjungan.getDetailWithPhotos(id)
        
        if (!kunjungan) {
            return res.status(404).json({message: 'Data tidak ditemukan'})
        }
        
        res.status(200).json({ kunjungan })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.post('/kunjungan/search', async(req, res) => {
    try {
        const { keyword } = req.body

        if (!keyword || !keyword.trim()) {
            return res.status(400).json({message: 'Keyword tidak boleh kosong'})
        }

        const kunjungan = await Kunjungan.searchByJudulWithPhoto(keyword.trim())
        res.status(200).json({ kunjungan })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

module.exports = router