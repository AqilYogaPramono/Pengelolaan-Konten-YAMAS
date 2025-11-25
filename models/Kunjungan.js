const connection = require('../configs/database')

class Kunjungan {
    static async countKunjungan() {
        try {
            const [rows] = await connection.query(`SELECT count(id) as count_kunjungan FROM kunjungan`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getAll() {
        try {
            const [rows] = await connection.query(`SELECT * FROM kunjungan ORDER BY id DESC`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getKunjungan(limit, offset) {
        try {
            const [rows] = await connection.query(`SELECT * FROM kunjungan ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getCountKunjungan() {
        try {
            const [rows] = await connection.query(`SELECT COUNT(id) AS total_kunjungan FROM kunjungan`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async searchByJudul(keyword) {
        try {
            const likeKeyword = `%${keyword}%`
            const [rows] = await connection.query(`SELECT * FROM kunjungan WHERE judul LIKE ? ORDER BY id DESC`, [likeKeyword])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getById(id) {
        try {
            const [rows] = await connection.query(`SELECT * FROM kunjungan WHERE id = ?`, [id])
            return rows[0]
        } catch (err) {
            throw err
        }
    }

    static async store(data) {
        try {
            const [result] = await connection.query(`INSERT INTO kunjungan SET ?`, [data])
            return result
        } catch (err) {
            throw err
        }
    }

    static async update(data, id) {
        try {
            const [result] = await connection.query(`UPDATE kunjungan SET ? WHERE id = ?`, [data, id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async delete(id) {
        try {
            const [result] = await connection.query(`DELETE FROM kunjungan WHERE id = ?`, [id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async addPhotos(idKunjungan, photos = []) {
        if (!photos.length) return
        const insertQuery = `INSERT INTO foto_kunjungan (foto, id_kunjungan) VALUES (?, ?)`

        try {
            for (const foto of photos) {
                await connection.query(insertQuery, [foto, idKunjungan])
            }
        } catch (err) {
            throw err
        }
    }

    static async getPhotos(idKunjungan) {
        try {
            const [rows] = await connection.query(`SELECT * FROM foto_kunjungan WHERE id_kunjungan = ? ORDER BY id DESC`, [idKunjungan])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getPhotosByIds(ids = []) {
        if (!ids.length) return []
        try {
            const [rows] = await connection.query(`SELECT * FROM foto_kunjungan WHERE id IN (?)`, [ids])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async deletePhotosByIds(ids = []) {
        if (!ids.length) return
        try {
            await connection.query(`DELETE FROM foto_kunjungan WHERE id IN (?)`, [ids])
        } catch (err) {
            throw err
        }
    }

    static async getFirstPhoto(idKunjungan) {
        try {
            const [rows] = await connection.query(
                `SELECT foto FROM foto_kunjungan WHERE id_kunjungan = ? ORDER BY id ASC LIMIT 1`,
                [idKunjungan]
            )
            return rows[0].foto
        } catch (err) {
            throw err
        }
    }

    static async getAllWithFirstPhoto() {
        try {
            const kunjungan = await this.getAll()
            const result = await Promise.all(kunjungan.map(async (item) => {
                const foto = await this.getFirstPhoto(item.id)
                return {
                    id: item.id,
                    judul: item.judul,
                    foto: foto,
                    waktu_kunjungan: item.waktu_kunjungan
                }
            }))
            return result
        } catch (err) {
            throw err
        }
    }

    static async getDetailWithPhotos(id) {
        try {
            const kunjungan = await this.getById(id)
            const foto = await this.getPhotos(id)
            return {
                ...kunjungan,
                foto: foto.map(item => item.foto)
            }
        } catch (err) {
            throw err
        }
    }
}

module.exports = Kunjungan