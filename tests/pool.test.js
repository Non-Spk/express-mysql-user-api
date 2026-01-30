const connectWithRetry = require('../db/pool')
const mysql = require('mysql2/promise')

jest.mock('mysql2/promise', () => ({
    createPool: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
    })
}))

describe('db pool', () => {
    it('should connect and return pool', async () => {
        const pool = await connectWithRetry()
        expect(pool).toHaveProperty('getConnection')
        expect(mysql.createPool).toHaveBeenCalled()
    })
})
