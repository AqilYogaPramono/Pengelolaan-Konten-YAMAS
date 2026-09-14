const mysql = require('mysql2')

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 1,
    idleTimeout: 30000,
    enableKeepAlive: true,
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
