const onlyDomain = (req, res, next) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN

    if (req.headers.origin !== allowedOrigin) {
        return res.status(403).json({
            status: false,
            message: 'Akses Ditolak'
        })
    }

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    next()
}

module.exports = { onlyDomain }
