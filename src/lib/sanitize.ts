import DOMPurify from 'dompurify'

/**
 * Configuration for different sanitization levels
 */
const SANITIZE_CONFIGS = {
  // For displaying AI-generated content that may contain HTML/markdown
  content: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
  },
  
  // For plain text content (removes all HTML)
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  
  // For links and basic formatting
  basic: {
    ALLOWED_TAGS: ['strong', 'em', 'code', 'br'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
  }
}

/**
 * Sanitize content for safe display
 * @param content - The content to sanitize
 * @param level - The sanitization level ('content', 'text', 'basic')
 * @returns Sanitized content
 */
export function sanitizeContent(content: string | null | undefined, level: keyof typeof SANITIZE_CONFIGS = 'content'): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  // Use isomorphic-dompurify for server-side rendering compatibility
  const config = SANITIZE_CONFIGS[level]
  
  try {
    return DOMPurify.sanitize(content, config)
  } catch (error) {
    console.error('Sanitization error:', error)
    // Fallback to stripping all HTML if sanitization fails
    return content.replace(/<[^>]*>/g, '')
  }
}

/**
 * Sanitize test case content
 * @param testCase - Test case object with potentially unsafe content
 * @returns Test case with sanitized content
 */
export function sanitizeTestCase(testCase: any): any {
  if (!testCase || typeof testCase !== 'object') {
    return testCase
  }

  return {
    ...testCase,
    title: sanitizeContent(testCase.title, 'text'),
    description: sanitizeContent(testCase.description, 'content'),
    preconditions: sanitizeContent(testCase.preconditions, 'content'),
    expectedResult: sanitizeContent(testCase.expectedResult, 'content'),
    steps: Array.isArray(testCase.steps) 
      ? testCase.steps.map((step: any) => ({
          ...step,
          action: sanitizeContent(step.action, 'content'),
          expectedResult: sanitizeContent(step.expectedResult, 'content')
        }))
      : testCase.steps,
    tags: Array.isArray(testCase.tags) 
      ? testCase.tags.map((tag: string) => sanitizeContent(tag, 'text'))
      : testCase.tags
  }
}

/**
 * Sanitize an array of test cases
 * @param testCases - Array of test cases
 * @returns Array of sanitized test cases
 */
export function sanitizeTestCases(testCases: any[]): any[] {
  if (!Array.isArray(testCases)) {
    return []
  }

  return testCases.map(sanitizeTestCase)
}

/**
 * Sanitize HTML content for display in React components
 * Use this when you need to render sanitized HTML with dangerouslySetInnerHTML
 * @param html - HTML content to sanitize
 * @returns Object with sanitized HTML for dangerouslySetInnerHTML
 */
export function sanitizeHTML(html: string | null | undefined): { __html: string } {
  return {
    __html: sanitizeContent(html, 'content')
  }
}

/**
 * Check if content contains potentially malicious scripts
 * @param content - Content to check
 * @returns true if content appears safe, false if potentially malicious
 */
export function isContentSafe(content: string | null | undefined): boolean {
  if (!content || typeof content !== 'string') {
    return true
  }

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /document\.cookie/gi,
    /window\.location/gi
  ]

  return !dangerousPatterns.some(pattern => pattern.test(content))
}

/**
 * Strip all HTML tags from content
 * @param content - Content to strip
 * @returns Plain text content
 */
export function stripHTML(content: string | null | undefined): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  return content.replace(/<[^>]*>/g, '').trim()
}