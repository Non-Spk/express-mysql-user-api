const { signToken } = require('../utils/jwt')
const jwt = require('jsonwebtoken')

jest.mock('jsonwebtoken')

describe('jwt utils', () => {
    it('should sign a token', () => {
        process.env.JWT_SECRET = 'secret'
        process.env.JWT_EXPIRES_IN = '1h'
        jwt.sign.mockReturnValue('mockToken')

        const token = signToken({ id: 1, role: 'admin' })
        expect(token).toBe('mockToken')
        expect(jwt.sign).toHaveBeenCalledWith({ id: 1, role: 'admin' }, 'secret', { expiresIn: '1h' })
    })
})
