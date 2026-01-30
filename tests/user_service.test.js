const userService = require('../services/user_service')
const getPool = require('../db/pool')
const auth = require('../utils/auth')
const jwt = require('../utils/jwt')

jest.mock('../db/pool')
jest.mock('../utils/auth')
jest.mock('../utils/jwt')

const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    return res
}

describe('user_service', () => {
    const pool = { query: jest.fn() }

    beforeEach(() => {
        getPool.mockResolvedValue(pool)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    // =================== isValidUser ===================
    describe('isValidUser', () => {
        const { isValidUser } = require('../services/user_service')

        it('valid user returns true', () => {
            expect(isValidUser({ name: 'John', email: 'a@b.com', age: 20, role: 'user' })).toBe(true)
        })

        it('invalid name returns false', () => {
            expect(isValidUser({ name: '', email: 'a@b.com', age: 20 })).toBe(false)
        })

        it('invalid email returns false', () => {
            expect(isValidUser({ name: 'John', email: 'abc', age: 20 })).toBe(false)
        })

        it('invalid age returns false', () => {
            expect(isValidUser({ name: 'John', email: 'a@b.com', age: -5 })).toBe(false)
        })

        it('invalid role returns false', () => {
            expect(isValidUser({ name: 'John', email: 'a@b.com', age: 20, role: 'manager' })).toBe(false)
        })
    })

    // =================== signup ===================
    describe('signup', () => {
        it('should return 201 on successful signup', async () => {
            auth.hashPassword.mockResolvedValue('hashed')
            pool.query.mockResolvedValue([{}])
            const req = { body: { name: 'John', email: 'a@b.com', password: 'pass', age: 25 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.signup(req, res, next)
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({ status: 'success' })
        })

        it('should return 400 if missing fields', async () => {
            const req = { body: { name: 'John' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.signup(req, res, next)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' })
        })

        it('should call next on db error', async () => {
            auth.hashPassword.mockResolvedValue('hashed')
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = { body: { name: 'John', email: 'a@b.com', password: 'pass', age: 25 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.signup(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })

    // =================== login ===================
    describe('login', () => {
        it('should return token on successful login', async () => {
            pool.query.mockResolvedValue([[{ id: 1, password: 'hashed', role: 'user' }]])
            auth.comparePassword.mockResolvedValue(true)
            jwt.signToken.mockReturnValue('token123')

            const req = { body: { email: 'a@b.com', password: 'pass' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.login(req, res, next)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({ status: 'success', token: 'token123' })
        })

        it('should return 401 if user not found', async () => {
            pool.query.mockResolvedValue([[]])
            const req = { body: { email: 'a@b.com', password: 'pass' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.login(req, res, next)
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
        })

        it('should return 401 if password invalid', async () => {
            pool.query.mockResolvedValue([[{ id: 1, password: 'hashed', role: 'user' }]])
            auth.comparePassword.mockResolvedValue(false)
            const req = { body: { email: 'a@b.com', password: 'wrong' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.login(req, res, next)
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
        })

        it('should call next on db error', async () => {
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = { body: { email: 'a@b.com', password: 'pass' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.login(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })

    // =================== getUsers ===================
    describe('getUsers', () => {
        it('should return users', async () => {
            const rows = [{ id: 1, name: 'John', email: 'a@b.com', age: 25, role: 'user' }]
            pool.query.mockResolvedValue([rows])
            const req = {}
            const res = mockRes()
            const next = jest.fn()
            await userService.getUsers(req, res, next)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({ status: 'success', results: 1, data: rows })
        })

        it('should call next on db error', async () => {
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = {}
            const res = mockRes()
            const next = jest.fn()
            await userService.getUsers(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })

    // =================== getUserById ===================
    describe('getUserById', () => {
        it('should return user if found', async () => {
            const row = { id: 1, name: 'John', email: 'a@b.com', age: 25, role: 'user' }
            pool.query.mockResolvedValue([[row]])
            const req = { params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.getUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({ status: 'success', data: row })
        })

        it('should return 404 if not found', async () => {
            pool.query.mockResolvedValue([[]])
            const req = { params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.getUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
        })

        it('should call next on db error', async () => {
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = { params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.getUserById(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })

    // =================== createUser ===================
    describe('createUser', () => {
        it('should create user with valid input', async () => {
            pool.query.mockResolvedValue([{ insertId: 1 }])
            const req = { body: { name: 'John', email: 'a@b.com', age: 25, role: 'admin' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.createUser(req, res, next)
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({ id: 1 })
        })

        it('should return 400 if input invalid', async () => {
            const req = { body: { name: '', email: 'a@b.com', age: 25, role: 'admin' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.createUser(req, res, next)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input data' })
        })

        it('should call next on db error', async () => {
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = { body: { name: 'John', email: 'a@b.com', age: 25, role: 'admin' } }
            const res = mockRes()
            const next = jest.fn()
            await userService.createUser(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })

    // =================== updateUserById ===================
    describe('updateUserById', () => {
        it('should update user successfully', async () => {
            pool.query.mockResolvedValue([{ affectedRows: 1 }])
            const req = { body: { name: 'John', email: 'a@b.com', age: 25, role: 'admin' }, params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.updateUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({ status: 'success' })
        })

        it('updateUserById with undefined role', async () => {
            pool.query.mockResolvedValue([{ affectedRows: 1 }])
            const req = { body: { name: 'John', email: 'a@b.com', age: 25 }, params: { id: 1 } } // no role
            const res = mockRes()
            const next = jest.fn()
            await userService.updateUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({ status: 'success' })
        })

        it('should return 404 if user not found', async () => {
            pool.query.mockResolvedValue([{ affectedRows: 0 }])
            const req = { body: { name: 'John', email: 'a@b.com', age: 25, role: 'admin' }, params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.updateUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
        })

        it('should return 400 if input invalid', async () => {
            const req = { body: { name: '', email: 'a@b.com', age: 25, role: 'admin' }, params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.updateUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input data' })
        })

        it('should call next on db error', async () => {
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = { body: { name: 'John', email: 'a@b.com', age: 25, role: 'admin' }, params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.updateUserById(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })

    // =================== deleteUserById ===================
    describe('deleteUserById', () => {
        it('should delete user successfully', async () => {
            pool.query.mockResolvedValue([{ affectedRows: 1 }])
            const req = { params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.deleteUserById(req, res, next)
            expect(res.send).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(204)
        })

        it('should return 404 if user not found', async () => {
            pool.query.mockResolvedValue([{ affectedRows: 0 }])
            const req = { params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.deleteUserById(req, res, next)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
        })

        it('should call next on db error', async () => {
            pool.query.mockRejectedValue(new Error('DB error'))
            const req = { params: { id: 1 } }
            const res = mockRes()
            const next = jest.fn()
            await userService.deleteUserById(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })
})
