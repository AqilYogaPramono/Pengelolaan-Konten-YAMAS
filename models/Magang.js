const connection = require('../configs/database')

class Magang {
    static async countMagang() {
        try {
            const [rows] = await connection.query(`SELECT COUNT(id) AS count_magang FROM magang`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getAll() {
        try {
            const [rows] = await connection.query(`SELECT * FROM magang ORDER BY id DESC`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getMagang(limit, offset) {
        try {
            const [rows] = await connection.query(`SELECT * FROM magang ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getCountMagang() {
        try {
            const [rows] = await connection.query(`SELECT COUNT(id) AS total_magang FROM magang`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getById(id) {
        try {
            const [rows] = await connection.query(`SELECT * FROM magang WHERE id = ?`, [id])
            return rows[0]
        } catch (err) {
            throw err
        }
    }

    static async store(data) {
        try {
            const [result] = await connection.query(`INSERT INTO magang SET ?`, [data])
            return result
        } catch (err) {
            throw err
        }
    }

    static async update(data, id) {
        try {
            const [result] = await connection.query(`UPDATE magang SET ? WHERE id = ?`, [data, id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async delete(id) {
        try {
            const [result] = await connection.query(`DELETE FROM magang WHERE id = ?`, [id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async addPhotos(idMagang, photos = []) {
        if (!photos.length) return
        const insertQuery = `INSERT INTO foto_kegiatan_magang (foto, id_magang) VALUES (?, ?)`

        try {
            for (const foto of photos) {
                await connection.query(insertQuery, [foto, idMagang])
            }
        } catch (err) {
            throw err
        }
    }

    static async getPhotos(idMagang) {
        try {
            const [rows] = await connection.query(`SELECT * FROM foto_kegiatan_magang WHERE id_magang = ? ORDER BY id DESC`, [idMagang])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getPhotosByIds(ids = []) {
        if (!ids.length) return []
        try {
            const [rows] = await connection.query(`SELECT * FROM foto_kegiatan_magang WHERE id IN (?)`, [ids])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async deletePhotosByIds(ids = []) {
        if (!ids.length) return
        try {
            await connection.query(`DELETE FROM foto_kegiatan_magang WHERE id IN (?)`, [ids])
        } catch (err) {
            throw err
        }
    }

    static async getFirstPhoto(idMagang) {
        try {
            const [rows] = await connection.query(
                `SELECT foto FROM foto_kegiatan_magang WHERE id_magang = ? ORDER BY id ASC LIMIT 1`,
                [idMagang]
            )
            return rows[0].foto
        } catch (err) {
            throw err
        }
    }

    static async getAllWithFirstPhoto() {
        try {
            const magang = await this.getAll()
            const result = await Promise.all(magang.map(async (item) => {
                const foto = await this.getFirstPhoto(item.id)
                return {
                    id: item.id,
                    judul: item.judul,
                    foto: foto
                }
            }))
            return result
        } catch (err) {
            throw err
        }
    }

    static async getDetailWithPhotos(id) {
        try {
            const magang = await this.getById(id)
            if (!magang) return null
            
            const foto = await this.getPhotos(id)
            return {
                ...magang,
                foto: foto.map(item => item.foto)
            }
        } catch (err) {
            throw err
        }
    }
}

module.exports = Magang