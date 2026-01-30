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
    })

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
    })
})
