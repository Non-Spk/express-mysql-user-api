const getPool = require('../db/pool')
const { hashPassword, comparePassword } = require('../utils/auth')
const { signToken } = require('../utils/jwt')

const isValidUser = ({ name, email, age, role }) => {
    return (
        typeof name === 'string' &&
        name.trim() !== '' &&
        typeof email === 'string' &&
        email.includes('@') &&
        Number.isInteger(age) &&
        age > 0 &&
        (!role || ['user', 'admin'].includes(role.toLowerCase()))
    )
}

/* ================= AUTH ================= */
exports.signup = async (req, res, next) => {
    try {
        const pool = await getPool()
        const { name, email, password, age, role } = req.body

        if (!name || !email || !password || !age) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        const userRole = role && ['user', 'admin'].includes(role.toLowerCase())
            ? role.toLowerCase()
            : 'user'

        const hashedPassword = await hashPassword(password)

        await pool.query(
            'INSERT INTO users (name, email, password, age, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, age, userRole]
        )

        res.status(201).json({ status: 'success' })
    } catch (err) {
        next(err)
    }
}

exports.login = async (req, res, next) => {
    try {
        const pool = await getPool()
        const { email, password } = req.body

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        )

        if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' })

        const user = rows[0]
        const isMatch = await comparePassword(password, user.password)
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

        const token = signToken({
            id: user.id,
            role: user.role
        })

        res.status(200).json({ status: 'success', token })
    } catch (err) {
        next(err)
    }
}

/* ================= USERS ================= */
exports.getUsers = async (req, res, next) => {
    try {
        const pool = await getPool()
        const [rows] = await pool.query('SELECT id, name, email, age, role FROM users')
        res.status(200).json({ status: 'success', results: rows.length, data: rows })
    } catch (err) {
        next(err)
    }
}

exports.getUserById = async (req, res, next) => {
    try {
        const pool = await getPool()
        const [rows] = await pool.query(
            'SELECT id, name, email, age, role FROM users WHERE id = ?',
            [req.params.id]
        )
        if (!rows.length) return res.status(404).json({ message: 'User not found' })
        res.status(200).json({ status: 'success', data: rows[0] })
    } catch (err) {
        next(err)
    }
}

exports.createUser = async (req, res, next) => {
    try {
        const pool = await getPool()
        const { name, email, age, role } = req.body

        if (!isValidUser({ name, email, age, role })) {
            return res.status(400).json({ message: 'Invalid input data' })
        }

        const userRole = role && ['user', 'admin'].includes(role.toLowerCase())
            ? role.toLowerCase()
            : 'user'

        const [result] = await pool.query(
            'INSERT INTO users (name, email, age, role) VALUES (?, ?, ?, ?)',
            [name, email, age, userRole]
        )

        res.status(201).json({ id: result.insertId })
    } catch (err) {
        next(err)
    }
}

exports.updateUserById = async (req, res, next) => {
    try {
        const pool = await getPool()
        const { name, email, age, role } = req.body

        if (!isValidUser({ name, email, age, role })) {
            return res.status(400).json({ message: 'Invalid input data' })
        }

        const userRole = role && ['user', 'admin'].includes(role.toLowerCase())
            ? role.toLowerCase()
            : undefined

        const queryParts = ['name=?', 'email=?', 'age=?']
        const values = [name, email, age]
        if (userRole) {
            queryParts.push('role=?')
            values.push(userRole)
        }
        values.push(req.params.id)

        const [result] = await pool.query(
            `UPDATE users SET ${queryParts.join(', ')} WHERE id=?`,
            values
        )

        if (!result.affectedRows) return res.status(404).json({ message: 'User not found' })
        res.status(200).json({ status: 'success' })
    } catch (err) {
        next(err)
    }
}

exports.deleteUserById = async (req, res, next) => {
    try {
        const pool = await getPool()
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])
        if (!result.affectedRows) return res.status(404).json({ message: 'User not found' })
        res.status(204).send()
    } catch (err) {
        next(err)
    }
}

exports.isValidUser = isValidUser