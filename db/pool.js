const mysql = require('mysql2/promise')

if (!process.env.DB_NAME || !process.env.DB_USER) {
    console.error('Missing required database environment variables')
    process.exit(1)
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

    ; (async () => {
        try {
            const conn = await pool.getConnection()
            console.log('MySQL connected')
            conn.release()
        } catch (err) {
            console.error('MySQL connection failed:', err.message)
            process.exit(1)
        }
    })()

module.exports = pool
