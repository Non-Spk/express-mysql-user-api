const mysql = require('mysql2/promise')
const connectWithRetryModule = require('../db/pool')
const connectWithRetry = connectWithRetryModule
const resetPool = connectWithRetryModule.__resetPool

jest.mock('mysql2/promise')

describe('db pool', () => {
    let consoleLog, consoleError

    beforeEach(() => {
        jest.resetModules()
        resetPool() // รีเซ็ต pool cache
        consoleLog = jest.spyOn(console, 'log').mockImplementation(() => { })
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => { })
        jest.clearAllMocks()
    })

    it('should connect successfully on first try and release connection', async () => {
        const mockConn = { release: jest.fn() }
        const mockGetConnection = jest.fn().mockResolvedValue(mockConn)

        mysql.createPool.mockReturnValue({ getConnection: mockGetConnection })

        const pool = await connectWithRetry()
        expect(pool).toBeDefined()
        expect(mockConn.release).toHaveBeenCalled()
        expect(consoleLog).toHaveBeenCalledWith('MySQL connected')
    })

    it('should retry on failure and succeed', async () => {
        const mockConn = { release: jest.fn() }
        let callCount = 0
        const mockGetConnection = jest.fn().mockImplementation(() => {
            callCount++
            if (callCount < 2) return Promise.reject(new Error('fail')) // retry
            return Promise.resolve(mockConn)
        })

        mysql.createPool.mockReturnValue({ getConnection: mockGetConnection })

        const pool = await connectWithRetry()
        expect(pool).toBeDefined()
        expect(mockConn.release).toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('DB connection failed (1/3)'))
        expect(consoleLog).toHaveBeenCalledWith('MySQL connected')
    })

    it('should throw after max retries', async () => {
        let callCount = 0
        const mockGetConnection = jest.fn().mockImplementation(() => {
            callCount++
            return Promise.reject(new Error('fail')) // always fail
        })

        mysql.createPool.mockReturnValue({ getConnection: mockGetConnection })

        await expect(connectWithRetry()).rejects.toThrow('fail')
        expect(mockGetConnection).toHaveBeenCalledTimes(3)
        expect(consoleError).toHaveBeenCalledTimes(3)
    })
})
