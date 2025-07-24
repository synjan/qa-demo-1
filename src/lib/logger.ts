/**
 * Logging utility that handles different environments and provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }
  }

  private sanitizeError(error: Error): Record<string, unknown> {
    return {
      name: error.name,
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined
    }
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined

    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization']
    const sanitized = { ...context }

    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 1000) {
        // Truncate very long strings
        sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]'
      }
    }

    return sanitized
  }

  private log(entry: LogEntry) {
    if (this.isDevelopment) {
      // In development, use console for immediate feedback
      const { level, message, context, error } = entry
      const logMethod = console[level] || console.log

      if (error) {
        logMethod(`[${level.toUpperCase()}] ${message}`, error, context || '')
      } else if (context) {
        logMethod(`[${level.toUpperCase()}] ${message}`, context)
      } else {
        logMethod(`[${level.toUpperCase()}] ${message}`)
      }
    } else {
      // In production, you could send to monitoring service
      // For now, we'll use console.error for errors only
      if (entry.level === 'error') {
        console.error(JSON.stringify(entry))
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('debug', message, this.sanitizeContext(context))
      this.log(entry)
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    const entry = this.formatMessage('info', message, this.sanitizeContext(context))
    this.log(entry)
  }

  warn(message: string, context?: Record<string, unknown>) {
    const entry = this.formatMessage('warn', message, this.sanitizeContext(context))
    this.log(entry)
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    let sanitizedError: Error | undefined

    if (error instanceof Error) {
      sanitizedError = error
    } else if (error) {
      sanitizedError = new Error(String(error))
    }

    const entry = this.formatMessage('error', message, this.sanitizeContext(context), sanitizedError)
    this.log(entry)
  }

  // Utility methods for common patterns
  apiCall(method: string, url: string, context?: Record<string, unknown>) {
    this.debug(`API Call: ${method} ${url}`, context)
  }

  apiResponse(method: string, url: string, status: number, context?: Record<string, unknown>) {
    const message = `API Response: ${method} ${url} - ${status}`
    if (status >= 400) {
      this.error(message, undefined, context)
    } else {
      this.debug(message, context)
    }
  }

  userAction(action: string, context?: Record<string, unknown>) {
    this.info(`User Action: ${action}`, context)
  }

  performance(operation: string, duration: number, context?: Record<string, unknown>) {
    this.debug(`Performance: ${operation} took ${duration}ms`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions for backward compatibility
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => logger.error(message, error, context)
}

// Development-only console replacement
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

export function devError(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args)
  }
}

export function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args)
  }
}