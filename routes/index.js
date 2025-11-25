const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    try {
        res.render('index')
    } catch (err) {
        console.error(err)
        res.status(500).render('error', { message: 'Internal Server Error' })
    }
})

module.exports = router

