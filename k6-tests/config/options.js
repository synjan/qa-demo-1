// Common k6 test options and configurations

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_TOKEN = __ENV.API_TOKEN || 'test_token_123';

// Common thresholds for all tests
export const commonThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests must complete below 500ms
  http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  http_req_waiting: ['p(95)<400'], // 95% of requests waiting time below 400ms
};

// Performance test stages
export const loadTestStages = [
  { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
  { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
  { duration: '30s', target: 20 },  // Ramp up to 20 users
  { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
  { duration: '30s', target: 0 },   // Ramp down to 0 users
];

export const stressTestStages = [
  { duration: '30s', target: 50 },   // Ramp up to 50 users
  { duration: '1m', target: 50 },    // Stay at 50 users
  { duration: '30s', target: 100 },  // Ramp up to 100 users
  { duration: '2m', target: 100 },   // Stay at 100 users
  { duration: '30s', target: 200 },  // Ramp up to 200 users
  { duration: '1m', target: 200 },   // Stay at 200 users
  { duration: '1m', target: 0 },     // Ramp down to 0 users
];

export const spikeTestStages = [
  { duration: '10s', target: 10 },   // Baseline load
  { duration: '5s', target: 100 },   // Sudden spike to 100 users
  { duration: '30s', target: 100 },  // Stay at spike level
  { duration: '5s', target: 10 },    // Drop back to baseline
  { duration: '30s', target: 10 },   // Continue at baseline
  { duration: '10s', target: 0 },    // Ramp down
];

export const soakTestStages = [
  { duration: '2m', target: 50 },    // Ramp up to 50 users
  { duration: '30m', target: 50 },   // Stay at 50 users for 30 minutes
  { duration: '2m', target: 0 },     // Ramp down
];

// Common headers
export function getAuthHeaders(token = API_TOKEN) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Helper to check response
export function checkResponse(response, expectedStatus = 200) {
  return {
    'status is correct': response.status === expectedStatus,
    'response time OK': response.timings.duration < 500,
    'no error': response.error === '',
  };
}