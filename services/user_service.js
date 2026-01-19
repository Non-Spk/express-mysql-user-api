const pool = require('./../db/pool')

const isValidUser = ({ name, email, age }) => {
    return (
        typeof name === 'string' &&
        name.trim() !== '' &&
        typeof email === 'string' &&
        email.includes('@') &&
        Number.isInteger(age) &&
        age > 0
    )
}

// GET /users (filter + pagination + sorting)
exports.getUsers = async (req, res) => {
    try {
        const { name, email, age, page = 1, limit = 10, sortBy = 'id', order = 'asc' } = req.query

        const allowSort = ['name', 'email', 'age', 'id']
        if (!allowSort.includes(sortBy)) {
            return res.status(400).json({ message: 'Invalid sort field' })
        }

        const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

        let where = []
        let params = []

        if (name) {
            where.push('name LIKE ?')
            params.push(`%${name}%`)
        }
        if (email) {
            where.push('email LIKE ?')
            params.push(`%${email}%`)
        }
        if (age) {
            where.push('age = ?')
            params.push(age)
        }

        const offset = (page - 1) * limit

        let sql = `SELECT * FROM users`
        if (where.length) sql += ` WHERE ${where.join(' AND ')}`
        sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`

        params.push(Number(limit), Number(offset))

        const [rows] = await pool.query(sql, params)

        res.status(200).json({
            status: 'success',
            results: rows.length,
            data: rows
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// GET /users/:id
exports.getUserById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id])

        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ status: 'success', data: rows[0] })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// POST /users
exports.createUser = async (req, res) => {
    try {
        if (!isValidUser(req.body)) {
            return res.status(400).json({ message: 'Invalid input data' })
        }

        const { name, email, age } = req.body
        const [result] = await pool.query(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            [name, email, age]
        )

        res.status(201).json({
            status: 'success',
            id: result.insertId
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// PUT /users/:id
exports.updateUserById = async (req, res) => {
    try {
        if (!isValidUser(req.body)) {
            return res.status(400).json({ message: 'Invalid input data' })
        }

        const { name, email, age } = req.body
        const [result] = await pool.query(
            'UPDATE users SET name=?, email=?, age=? WHERE id=?',
            [name, email, age, req.params.id]
        )

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ status: 'success' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// DELETE /users/:id
exports.deleteUserById = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(204).send()
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// POST /users/bulk-users
exports.bulkCreateUsers = async (req, res) => {
    try {
        const users = req.body

        if (!Array.isArray(users) || users.some(u => !isValidUser(u))) {
            return res.status(400).json({ message: 'Invalid input data' })
        }

        const values = users.map(u => [u.name, u.email, u.age])

        await pool.query(
            'INSERT INTO users (name, email, age) VALUES ?',
            [values]
        )

        res.status(201).json({ status: 'success', inserted: users.length })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
