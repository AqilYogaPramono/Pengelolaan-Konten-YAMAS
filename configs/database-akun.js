const mysql = require('mysql2')

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER_AKUN,
    password: process.env.DB_PASS_AKUN,
    database: process.env.DB_NAME_AKUN,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

(async () => {
    try {
        const conn = await pool.getConnection()
        console.log('MySQL connected successfully!')
        conn.release()
    } catch (err) {
        console.error('MySQL connection failed:', err)
    }
})()

module.exports = pool