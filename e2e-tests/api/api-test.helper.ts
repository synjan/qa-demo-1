import { APIRequestContext, expect } from '@playwright/test';

export class APITestHelper {
  private request: APIRequestContext;
  private baseURL: string;
  private authToken?: string;

  constructor(request: APIRequestContext, baseURL: string = 'http://localhost:3000') {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Get common headers including auth
   */
  private getHeaders(additionalHeaders: Record<string, string> = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make GET request
   */
  async get(endpoint: string, options: { headers?: Record<string, string> } = {}) {
    const response = await this.request.get(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers)
    });
    return response;
  }

  /**
   * Make POST request
   */
  async post(endpoint: string, data?: any, options: { headers?: Record<string, string> } = {}) {
    const response = await this.request.post(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      data
    });
    return response;
  }

  /**
   * Make PUT request
   */
  async put(endpoint: string, data?: any, options: { headers?: Record<string, string> } = {}) {
    const response = await this.request.put(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      data
    });
    return response;
  }

  /**
   * Make DELETE request
   */
  async delete(endpoint: string, options: { headers?: Record<string, string> } = {}) {
    const response = await this.request.delete(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers)
    });
    return response;
  }

  /**
   * Validate response status
   */
  async expectStatus(response: any, status: number) {
    expect(response.status()).toBe(status);
  }

  /**
   * Get response JSON
   */
  async getJSON(response: any) {
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', await response.text());
      throw error;
    }
  }

  /**
   * Common API response validations
   */
  async validateSuccessResponse(response: any, expectedStatus: number = 200) {
    await this.expectStatus(response, expectedStatus);
    const data = await this.getJSON(response);
    expect(data).toBeTruthy();
    return data;
  }

  /**
   * Validate error response
   */
  async validateErrorResponse(response: any, expectedStatus: number, expectedMessage?: string) {
    await this.expectStatus(response, expectedStatus);
    const data = await this.getJSON(response);
    
    if (expectedMessage) {
      expect(data.message || data.error).toContain(expectedMessage);
    }
    
    return data;
  }
}

export const APIEndpoints = {
  // Authentication
  auth: {
    session: '/api/auth/session',
    signin: '/api/auth/signin',
    signout: '/api/auth/signout',
    providers: '/api/auth/providers',
    csrf: '/api/auth/csrf',
    callback: '/api/auth/callback',
    guest: '/api/auth/guest'
  },

  // GitHub Integration
  github: {
    repositories: '/api/github/repositories',
    issues: (owner: string, repo: string) => `/api/github/issues?owner=${owner}&repo=${repo}`,
    repository: (owner: string, repo: string) => `/api/github/repositories/${owner}/${repo}`,
    user: '/api/github/user'
  },

  // Test Management
  testcases: {
    list: '/api/testcases',
    create: '/api/testcases',
    get: (id: string) => `/api/testcases/${id}`,
    update: (id: string) => `/api/testcases/${id}`,
    delete: (id: string) => `/api/testcases/${id}`,
    generate: '/api/testcases/generate'
  },

  testplans: {
    list: '/api/testplans',
    create: '/api/testplans',
    get: (id: string) => `/api/testplans/${id}`,
    update: (id: string) => `/api/testplans/${id}`,
    delete: (id: string) => `/api/testplans/${id}`,
    addTestCases: (id: string) => `/api/testplans/${id}/testcases`,
    removeTestCase: (id: string, testCaseId: string) => `/api/testplans/${id}/testcases/${testCaseId}`
  },

  testruns: {
    list: '/api/testruns',
    create: '/api/testruns',
    get: (id: string) => `/api/testruns/${id}`,
    update: (id: string) => `/api/testruns/${id}`,
    delete: (id: string) => `/api/testruns/${id}`,
    updateResult: (id: string, testCaseId: string) => `/api/testruns/${id}/results/${testCaseId}`,
    complete: (id: string) => `/api/testruns/${id}/complete`
  },

  // Settings
  settings: {
    get: '/api/settings',
    update: '/api/settings',
    preferences: '/api/settings/preferences',
    integrations: '/api/settings/integrations'
  }
};