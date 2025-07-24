import { cn } from '../utils'

describe('utils', () => {
  describe('cn (classname utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toBe('base-class additional-class')
    })

    it('should handle conditional classes', () => {
      const condition = true
      const result = cn('base-class', condition && 'conditional-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('should ignore false values', () => {
      const result = cn('base-class', false && 'ignored-class', 'final-class')
      expect(result).toBe('base-class final-class')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'final-class')
      expect(result).toBe('base-class final-class')
    })

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['base-class', 'array-class'], 'additional-class')
      expect(result).toBe('base-class array-class additional-class')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should merge conflicting Tailwind utilities', () => {
      const result = cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')
      expect(result).toBe('hover:bg-red-600 bg-blue-500')
    })

    it('should preserve important modifiers', () => {
      const result = cn('!text-red-500', 'text-blue-500')
      expect(result).toBe('!text-red-500 text-blue-500')
    })

    it('should handle complex class objects', () => {
      const result = cn(
        'base',
        {
          'active': true,
          'inactive': false,
          'hover:scale-105': true
        }
      )
      expect(result).toBe('base active hover:scale-105')
    })
  })
})