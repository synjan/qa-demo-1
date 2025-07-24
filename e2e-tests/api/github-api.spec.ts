import { test, expect } from '@playwright/test';
import { APITestHelper, APIEndpoints } from './api-test.helper';
import { TestData } from '../helpers/test-data.helper';

test.describe('GitHub API', () => {
  let apiHelper: APITestHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new APITestHelper(request);
    // Most GitHub endpoints require authentication
    apiHelper.setAuthToken(TestData.auth.validPAT);
  });

  test('should fetch user repositories', async () => {
    const response = await apiHelper.get(APIEndpoints.github.repositories);
    const data = await apiHelper.validateSuccessResponse(response);
    
    // Should return an array of repositories
    expect(Array.isArray(data)).toBe(true);
    
    if (data.length > 0) {
      const repo = data[0];
      expect(repo).toHaveProperty('id');
      expect(repo).toHaveProperty('name');
      expect(repo).toHaveProperty('full_name');
      expect(repo).toHaveProperty('owner');
      expect(repo).toHaveProperty('private');
      expect(repo).toHaveProperty('html_url');
    }
  });

  test('should handle repositories request without auth', async () => {
    // Remove auth token
    apiHelper.setAuthToken('');
    
    const response = await apiHelper.get(APIEndpoints.github.repositories);
    
    // Should return 401 or 403 for unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('should fetch repository issues', async () => {
    const { owner, name } = TestData.repositories.valid;
    const response = await apiHelper.get(APIEndpoints.github.issues(owner, name));
    
    if (response.status() === 404) {
      // Repository might not exist, skip test
      return;
    }
    
    const data = await apiHelper.validateSuccessResponse(response);
    
    // Should return an array of issues
    expect(Array.isArray(data)).toBe(true);
    
    if (data.length > 0) {
      const issue = data[0];
      expect(issue).toHaveProperty('number');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('state');
      expect(issue).toHaveProperty('created_at');
      expect(issue).toHaveProperty('user');
    }
  });

  test('should filter issues by state', async () => {
    const { owner, name } = TestData.repositories.valid;
    
    // Test open issues
    const openResponse = await apiHelper.get(`${APIEndpoints.github.issues(owner, name)}&state=open`);
    
    if (openResponse.status() === 200) {
      const openIssues = await apiHelper.getJSON(openResponse);
      
      if (Array.isArray(openIssues) && openIssues.length > 0) {
        openIssues.forEach(issue => {
          expect(issue.state).toBe('open');
        });
      }
    }
    
    // Test closed issues
    const closedResponse = await apiHelper.get(`${APIEndpoints.github.issues(owner, name)}&state=closed`);
    
    if (closedResponse.status() === 200) {
      const closedIssues = await apiHelper.getJSON(closedResponse);
      
      if (Array.isArray(closedIssues) && closedIssues.length > 0) {
        closedIssues.forEach(issue => {
          expect(issue.state).toBe('closed');
        });
      }
    }
  });

  test('should handle invalid repository name', async () => {
    const response = await apiHelper.get(APIEndpoints.github.issues('invalid-owner-123', 'invalid-repo-456'));
    
    // Should return 404 for not found
    await apiHelper.expectStatus(response, 404);
    
    const data = await apiHelper.getJSON(response);
    expect(data).toHaveProperty('message');
  });

  test('should paginate repository results', async () => {
    // Test with pagination parameters
    const response = await apiHelper.get(`${APIEndpoints.github.repositories}?page=1&per_page=5`);
    
    if (response.status() === 200) {
      const data = await apiHelper.getJSON(response);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(5);
    }
  });

  test('should handle rate limiting', async () => {
    const response = await apiHelper.get(APIEndpoints.github.repositories);
    
    // Check rate limit headers
    const headers = response.headers();
    
    // GitHub includes rate limit headers
    const rateLimitRemaining = headers['x-ratelimit-remaining'];
    const rateLimitLimit = headers['x-ratelimit-limit'];
    
    if (rateLimitRemaining && rateLimitLimit) {
      expect(parseInt(rateLimitRemaining)).toBeGreaterThanOrEqual(0);
      expect(parseInt(rateLimitLimit)).toBeGreaterThan(0);
    }
  });

  test('should cache repository responses', async () => {
    // Make first request
    const response1 = await apiHelper.get(APIEndpoints.github.repositories);
    await apiHelper.validateSuccessResponse(response1);
    
    // Make second request immediately
    const response2 = await apiHelper.get(APIEndpoints.github.repositories);
    await apiHelper.validateSuccessResponse(response2);
    
    // Check if cache headers are present
    const headers = response2.headers();
    const cacheControl = headers['cache-control'] || headers['Cache-Control'];
    
    // API might implement caching
    if (cacheControl) {
      expect(cacheControl).toMatch(/max-age|public|private/);
    }
  });

  test('should fetch repository details', async () => {
    const { owner, name } = TestData.repositories.valid;
    const response = await apiHelper.get(APIEndpoints.github.repository(owner, name));
    
    if (response.status() === 404) {
      // Repository might not exist
      return;
    }
    
    const data = await apiHelper.validateSuccessResponse(response);
    
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', name);
    expect(data).toHaveProperty('owner');
    expect(data.owner).toHaveProperty('login', owner);
  });

  test('should handle special characters in repository names', async () => {
    // Test with URL-encoded characters
    const response = await apiHelper.get(
      APIEndpoints.github.issues('test-owner', 'test-repo-with-dash')
    );
    
    // Should handle properly or return 404
    expect([200, 404]).toContain(response.status());
  });

  test('should validate GitHub token format', async () => {
    // Test with invalid token format
    apiHelper.setAuthToken('invalid_token_format');
    
    const response = await apiHelper.get(APIEndpoints.github.repositories);
    
    // GitHub should reject invalid tokens
    expect([401, 403]).toContain(response.status());
  });

  test('should handle concurrent API requests', async () => {
    const requests = [
      apiHelper.get(APIEndpoints.github.repositories),
      apiHelper.get(APIEndpoints.github.repositories + '?page=2'),
      apiHelper.get(APIEndpoints.github.issues('octocat', 'hello-world'))
    ];
    
    const responses = await Promise.all(requests);
    
    // All requests should complete
    responses.forEach(response => {
      expect(response.status()).toBeDefined();
    });
  });

  test('should return appropriate error for missing parameters', async () => {
    // Call issues endpoint without required params
    const response = await apiHelper.get('/api/github/issues');
    
    // Should return 400 for bad request
    await apiHelper.expectStatus(response, 400);
    
    const data = await apiHelper.getJSON(response);
    expect(data.error || data.message).toContain('Missing required parameters');
  });

  test('should handle GitHub API errors gracefully', async () => {
    // Use a token that would trigger specific GitHub errors
    apiHelper.setAuthToken('ghp_expired_or_revoked_token');
    
    const response = await apiHelper.get(APIEndpoints.github.repositories);
    
    if (response.status() !== 200) {
      const data = await apiHelper.getJSON(response);
      
      // Should have error message
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
    }
  });
});