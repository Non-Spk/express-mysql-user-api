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

// GET /users
exports.getUsers = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users')
        res.status(200).json({
            status: 'success',
            results: rows.length,
            data: rows
        })
    } catch (err) {
        err.statusCode = 500
        err.message = 'Database query failed'
        next(err)
    }
}

// GET /users/:id
exports.getUserById = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [req.params.id]
        )

        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ status: 'success', data: rows[0] })
    } catch (err) {
        err.statusCode = 500
        err.message = 'Database query failed'
        next(err)
    }
}

// POST /users
exports.createUser = async (req, res, next) => {
    try {
        if (!isValidUser(req.body)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid input data'
            })
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
        err.statusCode = 500
        err.message = 'Database insert failed'
        next(err)
    }
}

// PUT /users/:id
exports.updateUserById = async (req, res, next) => {
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
        err.statusCode = 500
        err.message = 'Database update failed'
        next(err)
    }
}

// DELETE /users/:id
exports.deleteUserById = async (req, res, next) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM users WHERE id = ?',
            [req.params.id]
        )

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(204).send()
    } catch (err) {
        err.statusCode = 500
        err.message = 'Database delete failed'
        next(err)
    }
}

// POST /users/bulk-users
exports.bulkCreateUsers = async (req, res, next) => {
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

        res.status(201).json({
            status: 'success',
            inserted: users.length
        })
    } catch (err) {
        err.statusCode = 500
        err.message = 'Bulk insert failed'
        next(err)
    }
}
