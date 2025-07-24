import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';

// Global test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};

export const resetMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

// Common test timeouts
export const TEST_TIMEOUTS = {
  unit: 5000,
  integration: 10000,
  e2e: 30000,
};

// Test categories for conditional execution
export const TEST_CATEGORIES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  E2E: 'e2e',
  PERFORMANCE: 'performance',
  VISUAL: 'visual',
};

export const shouldRunTest = (category: string) => {
  const runCategories = process.env.TEST_CATEGORIES?.split(',') || [TEST_CATEGORIES.UNIT];
  return runCategories.includes(category) || runCategories.includes('all');
};

// Mock implementations
export const createMockResponse = (data: any, options: Partial<Response> = {}) => {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: () => createMockResponse(data, options),
    ...options,
  } as Response;
};

// Test data cleanup
export const cleanupTestData = async (pattern: string) => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanupTestData should only be used in test environment');
  }
  
  // Implementation depends on your data storage
  // This is a placeholder
  console.log(`Cleaning up test data matching: ${pattern}`);
};

// Performance measurement
export class PerformanceTracker {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`);
    }
    
    const duration = (end || performance.now()) - start;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  reset() {
    this.marks.clear();
    this.measures.clear();
  }
}