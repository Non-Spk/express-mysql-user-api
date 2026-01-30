const { protect, restrictTo } = require('../middlewares/auth')
const jwt = require('jsonwebtoken')

jest.mock('jsonwebtoken')

describe('auth middleware', () => {
    let res, next

    beforeEach(() => {
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('protect', () => {
        it('should call next if token valid', () => {
            const req = { headers: { authorization: 'Bearer validtoken' } }
            jwt.verify.mockReturnValue({ id: 1, role: 'user' })

            protect(req, res, next)
            expect(req.user).toEqual({ id: 1, role: 'user' })
            expect(next).toHaveBeenCalled()
        })

        it('should return 401 if no auth header', () => {
            const req = { headers: {} }
            protect(req, res, next)
            expect(res.status).toHaveBeenCalledWith(401)
        })

        it('should return 401 if token invalid', () => {
            const req = { headers: { authorization: 'Bearer badtoken' } }
            jwt.verify.mockImplementation(() => { throw new Error('invalid') })

            protect(req, res, next)
            expect(res.status).toHaveBeenCalledWith(401)
        })
    })

    describe('restrictTo', () => {
        it('should call next if role allowed', () => {
            const req = { user: { role: 'admin' } }
            const middleware = restrictTo('admin', 'user')
            middleware(req, res, next)
            expect(next).toHaveBeenCalled()
        })

        it('should return 403 if role not allowed', () => {
            const req = { user: { role: 'user' } }
            const middleware = restrictTo('admin')
            middleware(req, res, next)
            expect(res.status).toHaveBeenCalledWith(403)
        })
    })
})
