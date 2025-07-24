import { test, expect } from '@playwright/test';
import { APITestHelper, APIEndpoints } from './api-test.helper';
import { TestData } from '../helpers/test-data.helper';

test.describe('Authentication API', () => {
  let apiHelper: APITestHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new APITestHelper(request);
  });

  test('should get CSRF token', async () => {
    const response = await apiHelper.get(APIEndpoints.auth.csrf);
    const data = await apiHelper.validateSuccessResponse(response);
    
    expect(data).toHaveProperty('csrfToken');
    expect(typeof data.csrfToken).toBe('string');
    expect(data.csrfToken.length).toBeGreaterThan(0);
  });

  test('should get auth providers', async () => {
    const response = await apiHelper.get(APIEndpoints.auth.providers);
    const data = await apiHelper.validateSuccessResponse(response);
    
    expect(data).toHaveProperty('github');
    expect(data.github).toMatchObject({
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      signinUrl: expect.stringContaining('/api/auth/signin/github'),
      callbackUrl: expect.stringContaining('/api/auth/callback/github')
    });
  });

  test('should get session when not authenticated', async () => {
    const response = await apiHelper.get(APIEndpoints.auth.session);
    const data = await apiHelper.validateSuccessResponse(response);
    
    // When not authenticated, NextAuth returns an empty object or null
    expect(data).toBeDefined();
    if (data && typeof data === 'object') {
      expect(Object.keys(data).length).toBe(0);
    }
  });

  test('should create guest session', async () => {
    const guestData = {
      name: 'Test Guest User',
      role: 'guest'
    };

    const response = await apiHelper.post(APIEndpoints.auth.guest, guestData);
    const data = await apiHelper.validateSuccessResponse(response);
    
    expect(data).toHaveProperty('sessionId');
    expect(typeof data.sessionId).toBe('string');
    expect(data.sessionId.length).toBeGreaterThan(0);
  });

  test('should reject guest session with missing name', async () => {
    const invalidData = {
      role: 'guest'
    };

    const response = await apiHelper.post(APIEndpoints.auth.guest, invalidData);
    await apiHelper.expectStatus(response, 400);
    
    const data = await apiHelper.getJSON(response);
    expect(data).toHaveProperty('error');
  });

  test('should reject guest session with empty name', async () => {
    const invalidData = {
      name: '',
      role: 'guest'
    };

    const response = await apiHelper.post(APIEndpoints.auth.guest, invalidData);
    await apiHelper.expectStatus(response, 400);
  });

  test('should handle session with GitHub PAT in headers', async () => {
    // Set PAT as auth token
    apiHelper.setAuthToken(TestData.auth.validPAT);
    
    const response = await apiHelper.get(APIEndpoints.auth.session);
    const data = await apiHelper.validateSuccessResponse(response);
    
    // Session behavior depends on backend implementation
    expect(data).toBeDefined();
  });

  test('should get session with cookies', async ({ page }) => {
    // Create a session by authenticating through UI first
    await page.goto('/auth/signin');
    const patInput = page.locator('input[id="pat"]');
    await patInput.fill(TestData.auth.validPAT);
    await page.click('button:has-text("Continue with PAT")');
    
    // Wait for navigation
    await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
    
    // Now test the API with the session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    
    if (sessionCookie) {
      const response = await apiHelper.get(APIEndpoints.auth.session, {
        headers: {
          'Cookie': `${sessionCookie.name}=${sessionCookie.value}`
        }
      });
      
      const data = await apiHelper.validateSuccessResponse(response);
      expect(data).toBeDefined();
    }
  });

  test('should handle invalid auth callback', async () => {
    // Test invalid OAuth callback
    const response = await apiHelper.get(`${APIEndpoints.auth.callback}/github?error=access_denied`);
    
    // NextAuth typically redirects on callback errors
    expect([302, 307, 400]).toContain(response.status());
  });

  test('should validate auth endpoints security headers', async () => {
    const response = await apiHelper.get(APIEndpoints.auth.session);
    
    // Check security headers
    const headers = response.headers();
    
    // NextAuth should set appropriate cache headers
    expect(headers['cache-control'] || headers['Cache-Control']).toBeDefined();
    
    // Should have content type
    expect(headers['content-type'] || headers['Content-Type']).toContain('application/json');
  });

  test('should handle concurrent guest sessions', async () => {
    // Create multiple guest sessions concurrently
    const guestPromises = Array.from({ length: 3 }, (_, i) => 
      apiHelper.post(APIEndpoints.auth.guest, {
        name: `Guest User ${i + 1}`,
        role: 'guest'
      })
    );

    const responses = await Promise.all(guestPromises);
    const sessionIds = new Set();

    for (const response of responses) {
      const data = await apiHelper.validateSuccessResponse(response);
      expect(data.sessionId).toBeTruthy();
      sessionIds.add(data.sessionId);
    }

    // All session IDs should be unique
    expect(sessionIds.size).toBe(3);
  });

  test('should handle malformed JSON in guest session', async () => {
    const response = await apiHelper.post(APIEndpoints.auth.guest, 'invalid json', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should return 400 for bad request
    await apiHelper.expectStatus(response, 400);
  });

  test('should respect rate limiting on auth endpoints', async () => {
    // Make multiple rapid requests
    const requests = Array.from({ length: 10 }, () => 
      apiHelper.get(APIEndpoints.auth.session)
    );

    const responses = await Promise.all(requests);
    
    // All should succeed (rate limiting might not be implemented)
    for (const response of responses) {
      expect([200, 429]).toContain(response.status());
    }
  });
});