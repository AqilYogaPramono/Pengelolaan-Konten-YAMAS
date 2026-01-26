const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
require('dotenv').config()
const session = require('express-session')
const flash = require('express-flash')
const cors = require('cors')

const indexRouter = require('./routes/index')
const authRouter = require('./routes/auth')
const APIRouter = require('./routes/API')

const manajerDashboard = require('./routes/manajer/dashboard')
const manajer = require('./routes/manajer/ubah-kata-sandi')

const manajerHalamanUtama = require('./routes/konten-manajer/halaman-utama')
const manajerJabatan = require('./routes/konten-manajer/personel/jabatan')
const manajerAnggota = require('./routes/konten-manajer/personel/anggota')
const manajerPengumuman = require('./routes/konten-manajer/pengumuman')
const manajerMagang = require('./routes/konten-manajer/magang')
const manajerKunjungan = require('./routes/konten-manajer/kunjungan')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        secure: false, //ubah ke true jika sudah di hosting 
        maxAge: 600000000
    }
}))

app.use(flash())

app.use(cors({
    origin: true,
    credentials: true
}))

app.options('*', cors())

app.use('/', indexRouter)
app.use('/', authRouter)

app.use('/API', APIRouter)

app.use('/manajer/dashboard', manajerDashboard)
app.use('/manajer/ubah-kata-sandi', manajer)

app.use('/manajer/halaman-utama', manajerHalamanUtama)
app.use('/manajer/jabatan', manajerJabatan)
app.use('/manajer/anggota', manajerAnggota)
app.use('/manajer/pengumuman', manajerPengumuman)
app.use('/manajer/magang', manajerMagang)
app.use('/manajer/kunjungan', manajerKunjungan)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app
