const { rateLimit } = require('express-rate-limit')

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 270,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: false,
        message: 'Terlalu banyak permintaan, silakan coba lagi beberapa saat lagi'
    }
})

module.exports = { apiLimiter }

