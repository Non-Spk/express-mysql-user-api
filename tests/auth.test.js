const { hashPassword, comparePassword } = require('../utils/auth')
const bcrypt = require('bcryptjs')

jest.mock('bcryptjs')

describe('auth utils', () => {
    it('should hash password', async () => {
        bcrypt.hash.mockResolvedValue('hashedPassword')
        const result = await hashPassword('myPassword')
        expect(result).toBe('hashedPassword')
        expect(bcrypt.hash).toHaveBeenCalledWith('myPassword', 12)
    })

    it('should compare password', async () => {
        bcrypt.compare.mockResolvedValue(true)
        const result = await comparePassword('myPassword', 'hashedPassword')
        expect(result).toBe(true)
        expect(bcrypt.compare).toHaveBeenCalledWith('myPassword', 'hashedPassword')
    })
})
