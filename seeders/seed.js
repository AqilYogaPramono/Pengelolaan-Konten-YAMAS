const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const connection = require('../configs/database')

const initialJabatan = require('./data/jabatan.json')
const initialHalamanUtama = require('./data/halaman_utama.json')
const initialAnggota = require('./data/anggota.json')
const initialPengumuman = require('./data/pengumuman.json')
const initialMagang = require('./data/magang.json')
const initialFotoKegiatanMagang = require('./data/foto_kegiatan_magang.json')
const initialKunjungan = require('./data/kunjungan.json')
const initialFotoKunjungan = require('./data/foto_kunjungan.json')

const requiredTables = [
    'jabatan',
    'halaman_utama',
    'anggota',
    'pengumuman',
    'magang',
    'foto_kegiatan_magang',
    'kunjungan',
    'foto_kunjungan'
]

const assetFolders = ['anggota', 'halaman-utama', 'kunjungan', 'magang', 'pengumuman']

async function validateTables(conn) {
    const [rows] = await conn.query('SHOW TABLES')
    const existingTables = rows.map(row => Object.values(row)[0])
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))

    if (missingTables.length > 0) {
        console.error(`Tabel belum dibuat: ${missingTables.join(', ')}. Silakan buat tabel terlebih dahulu sebelum menjalankan seeder.`)
        process.exit(1)
    }
}

async function truncateTables(conn) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0')
    await conn.query('TRUNCATE TABLE foto_kunjungan')
    await conn.query('TRUNCATE TABLE kunjungan')
    await conn.query('TRUNCATE TABLE foto_kegiatan_magang')
    await conn.query('TRUNCATE TABLE magang')
    await conn.query('TRUNCATE TABLE pengumuman')
    await conn.query('TRUNCATE TABLE anggota')
    await conn.query('TRUNCATE TABLE halaman_utama')
    await conn.query('TRUNCATE TABLE jabatan')
    await conn.query('SET FOREIGN_KEY_CHECKS = 1')
}

function syncAssets() {
    for (const folder of assetFolders) {
        const sourceDir = path.resolve(__dirname, 'assets', folder)
        const targetDir = path.resolve(__dirname, '../public/images', folder)

        if (!fs.existsSync(sourceDir)) continue
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        const files = fs.readdirSync(sourceDir).filter(file => file !== '.gitignore')
        for (const file of files) {
            fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file))
        }
    }
}

function clearAssets() {
    for (const folder of assetFolders) {
        const targetDir = path.resolve(__dirname, '../public/images', folder)
        if (!fs.existsSync(targetDir)) continue

        const files = fs.readdirSync(targetDir).filter(file => file !== '.gitignore')
        for (const file of files) {
            const filePath = path.join(targetDir, file)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        }
    }
}

async function runSeed() {
    let conn
    const isClear = process.argv.includes('--clear')

    try {
        conn = await connection.getConnection()

        await validateTables(conn)

        if (isClear) {
            await truncateTables(conn)
            clearAssets()
            console.log('Seluruh data tabel dan berkas gambar berhasil dibersihkan.')
            process.exit(0)
        }

        syncAssets()

        await conn.beginTransaction()

        for (const item of initialJabatan) {
            const [existing] = await conn.query('SELECT id FROM jabatan WHERE nama_jabatan = ? LIMIT 1', [item.nama_jabatan])
            if (existing.length === 0) {
                await conn.query('INSERT INTO jabatan (nama_jabatan) VALUES (?)', [item.nama_jabatan])
            }
        }

        for (const item of initialHalamanUtama) {
            const [existing] = await conn.query('SELECT id FROM halaman_utama WHERE urutan = ? LIMIT 1', [item.urutan])
            if (existing.length === 0) {
                await conn.query('INSERT INTO halaman_utama (foto, urutan) VALUES (?, ?)', [item.foto, item.urutan])
            }
        }

        for (const item of initialAnggota) {
            const [jabatanRows] = await conn.query('SELECT id FROM jabatan WHERE nama_jabatan = ? LIMIT 1', [item.nama_jabatan])
            const idJabatan = jabatanRows.length > 0 ? jabatanRows[0].id : null

            const [existing] = await conn.query('SELECT id FROM anggota WHERE nama = ? LIMIT 1', [item.nama])
            if (existing.length === 0) {
                await conn.query('INSERT INTO anggota (nama, foto, id_jabatan) VALUES (?, ?, ?)', [
                    item.nama,
                    item.foto,
                    idJabatan
                ])
            }
        }

        for (const item of initialPengumuman) {
            const [existing] = await conn.query('SELECT id FROM pengumuman WHERE judul = ? LIMIT 1', [item.judul])
            if (existing.length === 0) {
                await conn.query('INSERT INTO pengumuman (judul, foto, isi, dibuat_pada) VALUES (?, ?, ?, ?)', [
                    item.judul,
                    item.foto,
                    item.isi,
                    item.dibuat_pada
                ])
            }
        }

        for (const item of initialMagang) {
            const [existing] = await conn.query('SELECT id FROM magang WHERE judul = ? LIMIT 1', [item.judul])
            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO magang (judul, deskripsi_tugas, cover, periode_mulai, periode_berakhir) VALUES (?, ?, ?, ?, ?)',
                    [item.judul, item.deskripsi_tugas, item.cover, item.periode_mulai, item.periode_berakhir]
                )
            }
        }

        for (const item of initialFotoKegiatanMagang) {
            const [magangRows] = await conn.query('SELECT id FROM magang WHERE judul = ? LIMIT 1', [item.judul_magang])
            if (magangRows.length > 0) {
                const idMagang = magangRows[0].id
                const fotoList = Array.isArray(item.foto) ? item.foto : [item.foto]
                for (const foto of fotoList) {
                    const [existing] = await conn.query(
                        'SELECT id FROM foto_kegiatan_magang WHERE id_magang = ? AND foto = ? LIMIT 1',
                        [idMagang, foto]
                    )
                    if (existing.length === 0) {
                        await conn.query('INSERT INTO foto_kegiatan_magang (id_magang, foto) VALUES (?, ?)', [idMagang, foto])
                    }
                }
            }
        }

        for (const item of initialKunjungan) {
            const [existing] = await conn.query('SELECT id FROM kunjungan WHERE judul = ? LIMIT 1', [item.judul])
            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO kunjungan (judul, cover, deskripsi, waktu_kunjungan) VALUES (?, ?, ?, ?)',
                    [item.judul, item.cover, item.deskripsi, item.waktu_kunjungan]
                )
            }
        }

        for (const item of initialFotoKunjungan) {
            const [kunjunganRows] = await conn.query('SELECT id FROM kunjungan WHERE judul = ? LIMIT 1', [item.judul_kunjungan])
            if (kunjunganRows.length > 0) {
                const idKunjungan = kunjunganRows[0].id
                const fotoList = Array.isArray(item.foto) ? item.foto : [item.foto]
                for (const foto of fotoList) {
                    const [existing] = await conn.query(
                        'SELECT id FROM foto_kunjungan WHERE id_kunjungan = ? AND foto = ? LIMIT 1',
                        [idKunjungan, foto]
                    )
                    if (existing.length === 0) {
                        await conn.query('INSERT INTO foto_kunjungan (id_kunjungan, foto) VALUES (?, ?)', [idKunjungan, foto])
                    }
                }
            }
        }

        await conn.commit()
        console.log('Seeding selesai dengan sukses.')
        process.exit(0)
    } catch (error) {
        if (conn) {
            await conn.rollback()
        }
        console.error('Seeding gagal:', error)
        process.exit(1)
    } finally {
        if (conn) {
            conn.release()
        }
    }
}

runSeed()

