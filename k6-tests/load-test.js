import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { 
  BASE_URL, 
  getAuthHeaders, 
  checkResponse, 
  loadTestStages,
  commonThresholds 
} from './config/options.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test options
export const options = {
  stages: loadTestStages,
  thresholds: {
    ...commonThresholds,
    errors: ['rate<0.05'], // Error rate should be less than 5%
  },
};

// Test scenarios
export default function () {
  // Scenario 1: Homepage load
  let response = http.get(BASE_URL);
  check(response, {
    'Homepage loads successfully': (r) => r.status === 200 || r.status === 307,
    'Homepage response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200 && response.status !== 307);

  sleep(1);

  // Scenario 2: Auth signin page
  response = http.get(`${BASE_URL}/auth/signin`);
  check(response, {
    'Signin page loads': (r) => r.status === 200,
    'Signin page has content': (r) => r.body.includes('QA Test Manager'),
  });
  errorRate.add(response.status !== 200);

  sleep(1);

  // Scenario 3: API health check
  response = http.get(`${BASE_URL}/api/auth/providers`);
  check(response, {
    'API providers endpoint works': (r) => r.status === 200,
    'API returns JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });
  errorRate.add(response.status !== 200);

  sleep(1);

  // Scenario 4: Create guest session
  const guestPayload = JSON.stringify({
    name: `Guest User ${__VU}-${__ITER}`,
    role: 'guest'
  });

  response = http.post(`${BASE_URL}/api/auth/guest`, guestPayload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(response, {
    'Guest session created': (r) => r.status === 200,
    'Session ID returned': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.sessionId !== undefined;
      } catch {
        return false;
      }
    }
  });
  errorRate.add(response.status !== 200);

  sleep(2);
}

// Setup code
export function setup() {
  console.log('Starting load test...');
  console.log(`Target URL: ${BASE_URL}`);
  
  // Verify the application is running
  const response = http.get(BASE_URL);
  if (response.status !== 200 && response.status !== 307) {
    throw new Error(`Application is not accessible at ${BASE_URL}`);
  }
}

// Teardown code
export function teardown(data) {
  console.log('Load test completed');
}