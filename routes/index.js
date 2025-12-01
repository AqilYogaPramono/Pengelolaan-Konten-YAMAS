const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    try {
        res.render('index')
    } catch (err) {
        console.error(err)
    }
})

module.exports = router

