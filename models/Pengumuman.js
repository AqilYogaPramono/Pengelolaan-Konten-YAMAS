const connection = require('../configs/database')

class Pengumuman {
    static async getAll() {
        try {
            const [rows] = await connection.query(`SELECT * FROM pengumuman order by dibuat_pada desc`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getPengumuman(limit, offset) {
        try {
            const [rows] = await connection.query(`SELECT * FROM pengumuman ORDER BY dibuat_pada DESC LIMIT ? OFFSET ?`, [limit, offset])
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getCountPengumuman() {
        try {
            const [rows] = await connection.query(`SELECT COUNT(id) AS total_pengumuman FROM pengumuman`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getPengumuman() {
        try {
            const [rows] = await connection.query(`SELECT id, judul, foto, dibuat_pada FROM pengumuman order by dibuat_pada desc`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async store(data) {
        try {
            const [result] = await connection.query(`INSERT INTO pengumuman SET ?`, [data])
            return result
        } catch (err) {
            throw err
        }
    }

    static async update(data, id) {
        try {
            const [result] = await connection.query(`UPDATE pengumuman SET ? WHERE id = ?`, [data, id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async getById(id) {
        try {
            const [rows] = await connection.query(`SELECT * FROM pengumuman WHERE id = ?`, [id])
            return rows[0]
        } catch (err) {
            throw err
        }
    }

    static async delete(id) {
        try {
            const [result] = await connection.query(`DELETE FROM pengumuman WHERE id = ?`, [id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async getForAPI() {
        try {
            const pengumuman = await this.getPengumuman()
            return pengumuman.map(item => ({
                id: item.id,
                foto: item.foto,
                judul: item.judul
            }))
        } catch (err) {
            throw err
        }
    }

    static async getDetailForAPI(id) {
        try {
            const pengumuman = await this.getById(id)
            if (!pengumuman) return null
            
            return {
                id: pengumuman.id,
                foto: pengumuman.foto,
                judul: pengumuman.judul,
                isi: pengumuman.isi
            }
        } catch (err) {
            throw err
        }
    }
}

module.exports = Pengumuman