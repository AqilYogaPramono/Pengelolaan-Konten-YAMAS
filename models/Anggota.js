const connection = require('../configs/database')

class Anggota {
    static async getAll() {
        try {
            const [rows] = await connection.query(`SELECT a.*, j.nama_jabatan FROM anggota a LEFT JOIN jabatan j ON a.id_jabatan = j.id ORDER BY a.id DESC`)
            return rows
        } catch (err) {
            throw err
        }
    }

    static async getByJabatan(jabatanId) {
        try {
            const [rows] = await connection.query(
                `SELECT a.*, j.nama_jabatan FROM anggota a LEFT JOIN jabatan j ON a.id_jabatan = j.id WHERE a.id_jabatan = ? ORDER BY a.id DESC`,
                [jabatanId]
            )
            return rows
        } catch (err) {
            throw err
        }
    }

    static async store(data) {
        try {
            const [result] = await connection.query(`INSERT INTO anggota SET ?`, [data])
            return result
        } catch (err) {
            throw err
        }
    }

    static async update(data, id) {
        try {
            const [result] = await connection.query(`UPDATE anggota SET ? WHERE id = ?`, [data, id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async getById(id) {
        try {
            const [rows] = await connection.query(`SELECT * FROM anggota WHERE id = ?`, [id])
            return rows[0]
        } catch (err) {
            throw err
        }
    }

    static async delete(id) {
        try {
            const [result] = await connection.query(`DELETE FROM anggota WHERE id = ?`, [id])
            return result
        } catch (err) {
            throw err
        }
    }

    static async getByNamaJabatan(namaJabatan) {
        try {
            const [rows] = await connection.query(`SELECT a.*, j.nama_jabatan FROM anggota a LEFT JOIN jabatan j ON a.id_jabatan = j.id WHERE j.nama_jabatan LIKE ? ORDER BY a.id DESC`,[`%${namaJabatan}%`])
            return rows
        } catch (err) {
            throw err
        }
    }
}

module.exports = Anggota
