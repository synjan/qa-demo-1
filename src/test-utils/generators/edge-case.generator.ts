import { TestCase, TestStep } from '@/lib/types';
import { TestCaseFactory } from '../factories';

/**
 * Generate edge cases and boundary condition test data
 */
export class EdgeCaseGenerator {
  /**
   * Generate test cases for string input edge cases
   */
  static stringInputEdgeCases(): TestCase[] {
    const cases = [
      {
        title: 'Empty String Input',
        input: '',
        description: 'Test with completely empty string'
      },
      {
        title: 'Single Character Input',
        input: 'A',
        description: 'Test with single character'
      },
      {
        title: 'Maximum Length String',
        input: 'A'.repeat(10000),
        description: 'Test with maximum allowed length'
      },
      {
        title: 'Unicode Characters',
        input: '测试🎉émojis™✓',
        description: 'Test with unicode and special characters'
      },
      {
        title: 'SQL Injection Attempt',
        input: "'; DROP TABLE users; --",
        description: 'Test SQL injection protection'
      },
      {
        title: 'XSS Script Injection',
        input: '<script>alert("XSS")</script>',
        description: 'Test XSS protection'
      },
      {
        title: 'Null Byte Injection',
        input: 'test\x00data',
        description: 'Test null byte handling'
      },
      {
        title: 'Whitespace Only',
        input: '   \t\n\r   ',
        description: 'Test whitespace-only input'
      },
      {
        title: 'Special File Path Characters',
        input: '../../../etc/passwd',
        description: 'Test path traversal protection'
      },
      {
        title: 'HTML Entities',
        input: '&lt;div&gt;&amp;nbsp;&quot;test&quot;&lt;/div&gt;',
        description: 'Test HTML entity handling'
      },
      {
        title: 'Control Characters',
        input: '\x00\x01\x02\x03\x04\x05',
        description: 'Test control character handling'
      },
      {
        title: 'RTL Text',
        input: 'مرحبا بالعالم',
        description: 'Test right-to-left text support'
      },
      {
        title: 'Zero Width Characters',
        input: 'test\u200Bdata\u200C\u200D',
        description: 'Test zero-width character handling'
      },
      {
        title: 'Emoji Overload',
        input: '😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍',
        description: 'Test multiple emoji handling'
      },
      {
        title: 'Mixed Line Endings',
        input: 'line1\nline2\r\nline3\rline4',
        description: 'Test mixed line ending formats'
      }
    ];

    return cases.map(c => 
      TestCaseFactory.testCase({
        title: c.title,
        description: c.description,
        tags: ['edge-case', 'string-input', 'validation'],
        priority: 'low',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            action: `Enter "${c.input}" in the input field`,
            expectedResult: 'System handles input gracefully without errors'
          },
          {
            id: 'step-2',
            stepNumber: 2,
            action: 'Submit the form',
            expectedResult: 'Appropriate validation message or successful processing'
          }
        ]
      })
    );
  }

  /**
   * Generate test cases for numeric edge cases
   */
  static numericEdgeCases(): TestCase[] {
    const cases = [
      { title: 'Zero Value', value: 0 },
      { title: 'Negative Zero', value: -0 },
      { title: 'Minimum Integer', value: Number.MIN_SAFE_INTEGER },
      { title: 'Maximum Integer', value: Number.MAX_SAFE_INTEGER },
      { title: 'Positive Infinity', value: Infinity },
      { title: 'Negative Infinity', value: -Infinity },
      { title: 'NaN Value', value: NaN },
      { title: 'Very Small Decimal', value: 0.0000000001 },
      { title: 'Very Large Number', value: 9.99e99 },
      { title: 'Negative Boundary', value: -1 },
      { title: 'Float Precision Edge', value: 0.1 + 0.2 }, // 0.30000000000000004
      { title: 'Scientific Notation', value: 1.23e-10 }
    ];

    return cases.map(c =>
      TestCaseFactory.testCase({
        title: `Numeric Edge Case: ${c.title}`,
        description: `Test system behavior with ${c.title} (${c.value})`,
        tags: ['edge-case', 'numeric', 'validation'],
        priority: 'low',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            action: `Enter ${c.value} in numeric field`,
            expectedResult: 'Value is handled appropriately'
          }
        ]
      })
    );
  }

  /**
   * Generate test cases for date/time edge cases
   */
  static dateTimeEdgeCases(): TestCase[] {
    const cases = [
      { title: 'Unix Epoch Start', date: new Date(0) },
      { title: 'Unix Epoch Negative', date: new Date(-1) },
      { title: 'Year 1900', date: new Date('1900-01-01') },
      { title: 'Year 2038 Problem', date: new Date('2038-01-19T03:14:07Z') },
      { title: 'Leap Year Feb 29', date: new Date('2024-02-29') },
      { title: 'Non-Leap Year Feb 29', date: new Date('2023-02-29') }, // Invalid
      { title: 'DST Transition', date: new Date('2024-03-10T02:30:00') },
      { title: 'Year 9999', date: new Date('9999-12-31T23:59:59') },
      { title: 'Invalid Date String', date: 'not-a-date' },
      { title: 'Timezone Boundary', date: new Date('2024-01-01T00:00:00+14:00') }
    ];

    return cases.map(c =>
      TestCaseFactory.testCase({
        title: `Date/Time Edge Case: ${c.title}`,
        description: `Test date handling with ${c.title}`,
        tags: ['edge-case', 'datetime', 'validation'],
        priority: 'low'
      })
    );
  }

  /**
   * Generate test cases for concurrent operation edge cases
   */
  static concurrencyEdgeCases(): TestCase[] {
    return [
      TestCaseFactory.testCase({
        title: 'Simultaneous Login Attempts',
        description: 'Multiple login attempts from same user',
        tags: ['edge-case', 'concurrency', 'auth'],
        priority: 'medium',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            action: 'Open application in 3 different browsers',
            expectedResult: 'All instances load correctly'
          },
          {
            id: 'step-2',
            stepNumber: 2,
            action: 'Attempt to login simultaneously in all browsers',
            expectedResult: 'System handles concurrent logins gracefully'
          }
        ]
      }),
      TestCaseFactory.testCase({
        title: 'Race Condition - Update Same Resource',
        description: 'Two users updating same test case simultaneously',
        tags: ['edge-case', 'concurrency', 'race-condition'],
        priority: 'high'
      }),
      TestCaseFactory.testCase({
        title: 'Bulk Delete During Read',
        description: 'Delete items while another user is viewing them',
        tags: ['edge-case', 'concurrency', 'consistency'],
        priority: 'medium'
      })
    ];
  }

  /**
   * Generate test cases for performance edge cases
   */
  static performanceEdgeCases(): TestCase[] {
    return [
      TestCaseFactory.testCase({
        title: 'Maximum Pagination Limit',
        description: 'Request maximum allowed items per page',
        tags: ['edge-case', 'performance', 'pagination'],
        priority: 'medium',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            action: 'Set page size to 1000 items',
            expectedResult: 'Page loads within acceptable time'
          }
        ]
      }),
      TestCaseFactory.testCase({
        title: 'Deep Nested Data Structure',
        description: 'Create deeply nested test case steps',
        tags: ['edge-case', 'performance', 'memory'],
        priority: 'low'
      }),
      TestCaseFactory.testCase({
        title: 'Large File Upload',
        description: 'Upload maximum allowed file size',
        tags: ['edge-case', 'performance', 'upload'],
        priority: 'medium'
      })
    ];
  }

  /**
   * Generate test cases for security edge cases
   */
  static securityEdgeCases(): TestCase[] {
    return [
      TestCaseFactory.testCase({
        title: 'JWT Token Expiration',
        description: 'Test behavior with expired authentication token',
        tags: ['edge-case', 'security', 'auth'],
        priority: 'high'
      }),
      TestCaseFactory.testCase({
        title: 'Invalid Token Format',
        description: 'Send malformed JWT token',
        tags: ['edge-case', 'security', 'validation'],
        priority: 'high'
      }),
      TestCaseFactory.testCase({
        title: 'CORS Origin Bypass Attempt',
        description: 'Attempt cross-origin requests',
        tags: ['edge-case', 'security', 'cors'],
        priority: 'high'
      }),
      TestCaseFactory.testCase({
        title: 'Rate Limit Testing',
        description: 'Exceed API rate limits',
        tags: ['edge-case', 'security', 'rate-limit'],
        priority: 'medium'
      })
    ];
  }

  /**
   * Generate all edge case categories
   */
  static allEdgeCases(): TestCase[] {
    return [
      ...this.stringInputEdgeCases(),
      ...this.numericEdgeCases(),
      ...this.dateTimeEdgeCases(),
      ...this.concurrencyEdgeCases(),
      ...this.performanceEdgeCases(),
      ...this.securityEdgeCases()
    ];
  }

  /**
   * Generate boundary value test cases for a numeric field
   */
  static boundaryValues(min: number, max: number, fieldName: string): TestCase[] {
    const values = [
      { name: 'Below Minimum', value: min - 1, valid: false },
      { name: 'At Minimum', value: min, valid: true },
      { name: 'Just Above Minimum', value: min + 1, valid: true },
      { name: 'Middle Value', value: Math.floor((min + max) / 2), valid: true },
      { name: 'Just Below Maximum', value: max - 1, valid: true },
      { name: 'At Maximum', value: max, valid: true },
      { name: 'Above Maximum', value: max + 1, valid: false }
    ];

    return values.map(v =>
      TestCaseFactory.testCase({
        title: `${fieldName} Boundary Test: ${v.name}`,
        description: `Test ${fieldName} with value ${v.value}`,
        tags: ['edge-case', 'boundary', 'validation'],
        priority: 'medium',
        expectedResult: v.valid 
          ? `Value ${v.value} is accepted`
          : `Value ${v.value} is rejected with validation error`
      })
    );
  }
}