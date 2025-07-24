/**
 * @jest-environment jsdom
 */

import { sanitizeContent, sanitizeTestCase, isContentSafe, stripHTML } from '../sanitize'

// Mock DOMPurify for testing
jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((input: string) => {
      // Simple mock that removes script tags and dangerous attributes
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/javascript:/gi, '')
    })
  }
}))

describe('Sanitization Utility', () => {
  describe('sanitizeContent', () => {
    it('should sanitize malicious content', () => {
      const maliciousContent = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeContent(maliciousContent)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('should handle null and undefined input', () => {
      expect(sanitizeContent(null)).toBe('')
      expect(sanitizeContent(undefined)).toBe('')
      expect(sanitizeContent('')).toBe('')
    })

    it('should handle non-string input', () => {
      expect(sanitizeContent(123 as any)).toBe('')
      expect(sanitizeContent({} as any)).toBe('')
    })
  })

  describe('sanitizeTestCase', () => {
    it('should sanitize all test case fields', () => {
      const testCase = {
        id: 'test-1',
        title: '<script>alert("xss")</script>Test Title',
        description: '<p>Description with <script>alert("xss")</script></p>',
        preconditions: '<div onclick="malicious()">Preconditions</div>',
        expectedResult: '<span>Expected result</span>',
        steps: [
          {
            stepNumber: 1,
            action: '<button onclick="bad()">Click me</button>',
            expectedResult: '<p>Step result with <script>evil()</script></p>'
          }
        ],
        tags: ['<script>tag1</script>', 'safe-tag']
      }

      const sanitized = sanitizeTestCase(testCase)

      expect(sanitized.title).not.toContain('<script>')
      expect(sanitized.description).not.toContain('<script>')
      expect(sanitized.preconditions).not.toContain('onclick')
      expect(sanitized.steps[0].action).not.toContain('onclick')
      expect(sanitized.steps[0].expectedResult).not.toContain('<script>')
      expect(sanitized.tags[0]).not.toContain('<script>')
    })

    it('should handle invalid test case input', () => {
      expect(sanitizeTestCase(null)).toBe(null)
      expect(sanitizeTestCase(undefined)).toBe(undefined)
      expect(sanitizeTestCase('string')).toBe('string')
    })
  })

  describe('isContentSafe', () => {
    it('should detect malicious content', () => {
      expect(isContentSafe('<script>alert("xss")</script>')).toBe(false)
      expect(isContentSafe('javascript:alert("xss")')).toBe(false)
      expect(isContentSafe('<div onclick="malicious()">content</div>')).toBe(false)
      expect(isContentSafe('<iframe src="evil.com"></iframe>')).toBe(false)
    })

    it('should allow safe content', () => {
      expect(isContentSafe('<p>Safe paragraph</p>')).toBe(true)
      expect(isContentSafe('Plain text content')).toBe(true)
      expect(isContentSafe('<div class="safe">Safe div</div>')).toBe(true)
    })

    it('should handle null and undefined', () => {
      expect(isContentSafe(null)).toBe(true)
      expect(isContentSafe(undefined)).toBe(true)
      expect(isContentSafe('')).toBe(true)
    })
  })

  describe('stripHTML', () => {
    it('should remove all HTML tags', () => {
      const htmlContent = '<p>Paragraph</p><div class="test">Div content</div>'
      const result = stripHTML(htmlContent)
      expect(result).toBe('ParagraphDiv content')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should handle malicious content by stripping it', () => {
      const maliciousContent = '<script>alert("xss")</script>Safe content'
      const result = stripHTML(maliciousContent)
      expect(result).toBe('alert("xss")Safe content')
      expect(result).not.toContain('<script>')
    })

    it('should handle null and undefined', () => {
      expect(stripHTML(null)).toBe('')
      expect(stripHTML(undefined)).toBe('')
      expect(stripHTML('')).toBe('')
    })
  })
})