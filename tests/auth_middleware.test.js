const { protect, restrictTo } = require('../middlewares/auth')
const jwt = require('jsonwebtoken')

jest.mock('jsonwebtoken')

describe('auth middleware', () => {
    it('should call next if token is valid', () => {
        const req = { headers: { authorization: 'Bearer token123' } }
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        const next = jest.fn()
        jwt.verify.mockReturnValue({ id: 1, role: 'user' })

        protect(req, res, next)
        expect(req.user).toEqual({ id: 1, role: 'user' })
        expect(next).toHaveBeenCalled()
    })

    it('should return 401 if token missing', () => {
        const req = { headers: {} }
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        const next = jest.fn()

        protect(req, res, next)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' })
    })

    it('restrictTo should call next if role allowed', () => {
        const req = { user: { role: 'admin' } }
        const res = {}
        const next = jest.fn()
        restrictTo('admin')(req, res, next)
        expect(next).toHaveBeenCalled()
    })

    it('restrictTo should return 403 if role not allowed', () => {
        const req = { user: { role: 'user' } }
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        const next = jest.fn()
        restrictTo('admin')(req, res, next)
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' })
    })
})
