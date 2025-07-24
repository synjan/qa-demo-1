import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';
import { 
  BASE_URL, 
  API_TOKEN,
  getAuthHeaders,
  commonThresholds 
} from './config/options.js';

// Custom metrics
const apiErrorRate = new Rate('api_errors');

// Test options
export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ...commonThresholds,
    api_errors: ['rate<0.05'],
    'http_req_duration{group:auth}': ['p(95)<300'],
    'http_req_duration{group:github}': ['p(95)<800'],
  },
};

export default function () {
  // Test Authentication APIs
  group('auth', function () {
    // Get CSRF token
    let response = http.get(`${BASE_URL}/api/auth/csrf`);
    check(response, {
      'CSRF endpoint works': (r) => r.status === 200,
      'CSRF token returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.csrfToken !== undefined;
        } catch {
          return false;
        }
      }
    });
    apiErrorRate.add(response.status !== 200);

    // Get auth providers
    response = http.get(`${BASE_URL}/api/auth/providers`);
    check(response, {
      'Providers endpoint works': (r) => r.status === 200,
      'GitHub provider exists': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.github !== undefined;
        } catch {
          return false;
        }
      }
    });
    apiErrorRate.add(response.status !== 200);

    // Get session
    response = http.get(`${BASE_URL}/api/auth/session`);
    check(response, {
      'Session endpoint works': (r) => r.status === 200,
    });
    apiErrorRate.add(response.status !== 200);
  });

  // Test GitHub APIs (if token is available)
  if (API_TOKEN && API_TOKEN !== 'test_token_123') {
    group('github', function () {
      const headers = getAuthHeaders(API_TOKEN);

      // Get repositories
      let response = http.get(`${BASE_URL}/api/github/repositories`, { headers });
      check(response, {
        'Repositories endpoint works': (r) => r.status === 200 || r.status === 401,
        'Returns array': (r) => {
          if (r.status !== 200) return true; // Skip check if unauthorized
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body);
          } catch {
            return false;
          }
        }
      });
      apiErrorRate.add(response.status >= 400 && response.status !== 401);

      // Test pagination
      response = http.get(`${BASE_URL}/api/github/repositories?page=1&per_page=5`, { headers });
      check(response, {
        'Pagination works': (r) => r.status === 200 || r.status === 401,
      });
      apiErrorRate.add(response.status >= 400 && response.status !== 401);
    });
  }

  // Test error handling
  group('errors', function () {
    // Invalid endpoint
    let response = http.get(`${BASE_URL}/api/invalid-endpoint`);
    check(response, {
      'Invalid endpoint returns 404': (r) => r.status === 404,
    });

    // Invalid method
    response = http.patch(`${BASE_URL}/api/auth/session`);
    check(response, {
      'Invalid method returns 405': (r) => r.status === 405 || r.status === 404,
    });
  });
}

export function setup() {
  console.log('Starting API performance test...');
  console.log(`Target URL: ${BASE_URL}`);
  
  // Test basic connectivity
  const response = http.get(`${BASE_URL}/api/auth/providers`);
  if (response.status !== 200) {
    throw new Error('API is not accessible');
  }
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`API test completed in ${duration} seconds`);
}