const mysql = require('mysql2/promise')

const MAX_RETRY = 3
const RETRY_DELAY = 1000
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

let pool

const connectWithRetry = async () => {
    if (pool) return pool

    for (let i = 1; i <= MAX_RETRY; i++) {
        try {
            pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10
            })

            const conn = await pool.getConnection()
            conn.release()

            console.log('MySQL connected')
            return pool
        } catch (err) {
            console.error(`DB connection failed (${i}/${MAX_RETRY})`)
            if (i === MAX_RETRY) throw err
            await sleep(RETRY_DELAY)
        }
    }
}

module.exports = connectWithRetry
