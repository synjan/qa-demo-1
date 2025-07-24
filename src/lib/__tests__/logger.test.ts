/**
 * @jest-environment node
 */

import { logger, log, devLog, devError } from '../logger'

describe('Logger Utility', () => {
  let consoleSpy: jest.SpyInstance
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    originalNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe('Logger class', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development'
      
      logger.debug('Test debug message', { key: 'value' })
      
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] Test debug message',
        { key: 'value' }
      )
    })

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production'
      
      logger.debug('Test debug message')
      
      expect(console.log).not.toHaveBeenCalled()
    })

    it('should log info messages in all environments', () => {
      process.env.NODE_ENV = 'production'
      
      logger.info('Test info message')
      
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message')
    })

    it('should log warnings', () => {
      logger.warn('Test warning', { context: 'test' })
      
      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] Test warning',
        { context: 'test' }
      )
    })

    it('should log errors with error objects', () => {
      const error = new Error('Test error')
      
      logger.error('Something went wrong', error, { userId: '123' })
      
      expect(console.error).toHaveBeenCalledWith(
        '[ERROR] Something went wrong',
        error,
        { userId: '123' }
      )
    })

    it('should sanitize sensitive data from context', () => {
      logger.info('Test with sensitive data', {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'xyz789'
      })
      
      expect(console.info).toHaveBeenCalledWith(
        '[INFO] Test with sensitive data',
        {
          username: 'john',
          password: '[REDACTED]',
          token: '[REDACTED]',
          apiKey: '[REDACTED]'
        }
      )
    })

    it('should truncate very long strings', () => {
      const longString = 'a'.repeat(1500)
      
      logger.info('Long string test', { data: longString })
      
      const call = (console.info as jest.Mock).mock.calls[0]
      expect(call[1].data).toHaveLength(1015) // 1000 + '...[TRUNCATED]'
      expect(call[1].data).toContain('...[TRUNCATED]')
    })
  })

  describe('Convenience functions', () => {
    it('should work with log.debug', () => {
      process.env.NODE_ENV = 'development'
      
      log.debug('Debug message')
      
      expect(console.log).toHaveBeenCalledWith('[DEBUG] Debug message')
    })

    it('should work with log.error', () => {
      const error = new Error('Test')
      
      log.error('Error message', error)
      
      expect(console.error).toHaveBeenCalledWith('[ERROR] Error message', error, '')
    })
  })

  describe('Development-only functions', () => {
    it('should log in development mode', () => {
      process.env.NODE_ENV = 'development'
      
      devLog('Development message')
      
      expect(console.log).toHaveBeenCalledWith('Development message')
    })

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production'
      
      devLog('Development message')
      
      expect(console.log).not.toHaveBeenCalled()
    })

    it('should log errors in development mode', () => {
      process.env.NODE_ENV = 'development'
      
      devError('Development error')
      
      expect(console.error).toHaveBeenCalledWith('Development error')
    })
  })

  describe('Utility methods', () => {
    it('should log API calls', () => {
      process.env.NODE_ENV = 'development'
      
      logger.apiCall('GET', '/api/test', { userId: '123' })
      
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] API Call: GET /api/test',
        { userId: '123' }
      )
    })

    it('should log API responses with error status', () => {
      logger.apiResponse('POST', '/api/test', 500, { error: 'Server error' })
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] API Response: POST /api/test - 500')
      )
    })

    it('should log user actions', () => {
      logger.userAction('Login', { userId: '123' })
      
      expect(console.info).toHaveBeenCalledWith(
        '[INFO] User Action: Login',
        { userId: '123' }
      )
    })

    it('should log performance metrics', () => {
      process.env.NODE_ENV = 'development'
      
      logger.performance('Database query', 150, { query: 'SELECT * FROM users' })
      
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] Performance: Database query took 150ms',
        { query: 'SELECT * FROM users' }
      )
    })
  })
})