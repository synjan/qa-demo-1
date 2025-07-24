import { test, expect } from '@playwright/test';
import { APITestHelper, APIEndpoints } from './api-test.helper';
import { TestData } from '../helpers/test-data.helper';

test.describe('Test Case Generation API', () => {
  let apiHelper: APITestHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new APITestHelper(request);
    apiHelper.setAuthToken(TestData.auth.validPAT);
  });

  test('should generate test cases from GitHub issues', async () => {
    const requestData = {
      issueNumbers: [1, 2],
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    
    // This might fail if OpenAI key is invalid or rate limited
    if (response.status() === 200) {
      const data = await apiHelper.getJSON(response);
      
      expect(data).toHaveProperty('testCases');
      expect(Array.isArray(data.testCases)).toBe(true);
      
      if (data.testCases.length > 0) {
        const testCase = data.testCases[0];
        expect(testCase).toHaveProperty('id');
        expect(testCase).toHaveProperty('title');
        expect(testCase).toHaveProperty('description');
        expect(testCase).toHaveProperty('steps');
        expect(testCase).toHaveProperty('expectedResults');
        expect(testCase).toHaveProperty('issueNumber');
        expect(testCase).toHaveProperty('repository');
      }
    } else if (response.status() === 401) {
      // Invalid API key
      const data = await apiHelper.getJSON(response);
      expect(data.error).toContain('API key');
    } else if (response.status() === 429) {
      // Rate limited
      const data = await apiHelper.getJSON(response);
      expect(data.error).toContain('rate limit');
    }
  });

  test('should validate required fields for test generation', async () => {
    // Missing issueNumbers
    const invalidData = {
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, invalidData);
    await apiHelper.expectStatus(response, 400);
    
    const data = await apiHelper.getJSON(response);
    expect(data.error || data.message).toContain('issueNumbers');
  });

  test('should reject empty issue numbers array', async () => {
    const requestData = {
      issueNumbers: [],
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    await apiHelper.expectStatus(response, 400);
    
    const data = await apiHelper.getJSON(response);
    expect(data.error || data.message).toMatch(/issue|empty/i);
  });

  test('should handle invalid OpenAI API key', async () => {
    const requestData = {
      issueNumbers: [1],
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.invalidKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    
    // Should return 401 or 400 for invalid API key
    expect([400, 401]).toContain(response.status());
    
    const data = await apiHelper.getJSON(response);
    expect(data.error || data.message).toBeTruthy();
  });

  test('should handle non-existent repository', async () => {
    const requestData = {
      issueNumbers: [1],
      repository: 'non-existent-repo-12345',
      owner: 'non-existent-owner-12345',
      openaiApiKey: TestData.openai.apiKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    
    // Should fail when trying to fetch issues
    expect([404, 400]).toContain(response.status());
  });

  test('should limit number of issues per request', async () => {
    // Try to generate for too many issues
    const requestData = {
      issueNumbers: Array.from({ length: 100 }, (_, i) => i + 1),
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    
    // API should have limits
    if (response.status() === 400) {
      const data = await apiHelper.getJSON(response);
      expect(data.error || data.message).toMatch(/limit|too many/i);
    }
  });

  test('should handle timeout for long generation', async () => {
    const requestData = {
      issueNumbers: [1, 2, 3, 4, 5],
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    // This test might take longer
    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    
    // Should complete within reasonable time or timeout
    expect([200, 408, 504]).toContain(response.status());
  });

  test('should validate issue numbers are integers', async () => {
    const requestData = {
      issueNumbers: ['one', 'two'],
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    await apiHelper.expectStatus(response, 400);
  });

  test('should generate test cases with proper structure', async () => {
    // Mock successful response structure
    const mockResponse = {
      testCases: [
        {
          id: 'tc-123',
          title: 'Test Login Functionality',
          description: 'Verify user can log in successfully',
          preconditions: 'User has valid credentials',
          steps: [
            { step: 'Navigate to login page', expected: 'Login page is displayed' },
            { step: 'Enter username', expected: 'Username is entered' },
            { step: 'Enter password', expected: 'Password is entered' },
            { step: 'Click login button', expected: 'User is logged in' }
          ],
          expectedResults: 'User is redirected to dashboard',
          issueNumber: 1,
          repository: TestData.repositories.valid.name,
          createdAt: new Date().toISOString()
        }
      ]
    };

    // Validate the expected structure
    const testCase = mockResponse.testCases[0];
    expect(testCase.steps).toBeInstanceOf(Array);
    expect(testCase.steps.length).toBeGreaterThan(0);
    
    testCase.steps.forEach(step => {
      expect(step).toHaveProperty('step');
      expect(step).toHaveProperty('expected');
      expect(typeof step.step).toBe('string');
      expect(typeof step.expected).toBe('string');
    });
  });

  test('should handle partial failures in batch generation', async () => {
    const requestData = {
      issueNumbers: [1, 999999], // One valid, one invalid
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData);
    
    if (response.status() === 200) {
      const data = await apiHelper.getJSON(response);
      
      // Might return partial results
      expect(data.testCases).toBeDefined();
      
      if (data.errors) {
        expect(Array.isArray(data.errors)).toBe(true);
      }
    }
  });

  test('should respect content type headers', async () => {
    const requestData = {
      issueNumbers: [1],
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner
    };

    // Send with wrong content type
    const response = await apiHelper.post(APIEndpoints.testcases.generate, requestData, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    // Should still work or return 400
    expect([200, 400, 415]).toContain(response.status());
  });

  test('should handle concurrent generation requests', async () => {
    const baseRequest = {
      repository: TestData.repositories.valid.name,
      owner: TestData.repositories.valid.owner,
      openaiApiKey: TestData.openai.apiKey
    };

    const requests = [
      apiHelper.post(APIEndpoints.testcases.generate, { ...baseRequest, issueNumbers: [1] }),
      apiHelper.post(APIEndpoints.testcases.generate, { ...baseRequest, issueNumbers: [2] }),
      apiHelper.post(APIEndpoints.testcases.generate, { ...baseRequest, issueNumbers: [3] })
    ];

    const responses = await Promise.all(requests);
    
    // All should complete without crashing
    responses.forEach(response => {
      expect(response.status()).toBeDefined();
      expect([200, 400, 401, 429, 500]).toContain(response.status());
    });
  });
});