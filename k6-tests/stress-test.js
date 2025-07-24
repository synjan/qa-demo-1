import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { 
  BASE_URL, 
  getAuthHeaders, 
  stressTestStages,
  commonThresholds 
} from './config/options.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test options
export const options = {
  stages: stressTestStages,
  thresholds: {
    ...commonThresholds,
    errors: ['rate<0.1'], // Error rate should be less than 10% even under stress
    api_latency: ['p(95)<1000'], // 95% of API calls should be under 1s
  },
};

export default function () {
  const vu = __VU;
  const iter = __ITER;

  // Stress test different endpoints
  const endpoints = [
    { url: '/', name: 'Homepage' },
    { url: '/auth/signin', name: 'Signin' },
    { url: '/api/auth/providers', name: 'Providers' },
    { url: '/api/auth/session', name: 'Session' },
  ];

  // Random endpoint selection
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const start = Date.now();
  const response = http.get(`${BASE_URL}${endpoint.url}`, {
    tags: { endpoint: endpoint.name }
  });
  const latency = Date.now() - start;

  // Record API latency
  if (endpoint.url.startsWith('/api')) {
    apiLatency.add(latency);
  }

  // Check response
  const success = check(response, {
    [`${endpoint.name} status OK`]: (r) => r.status === 200 || r.status === 307,
    'Response time acceptable': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);

  // Simulate more aggressive user behavior under stress
  if (iter % 10 === 0) {
    // Every 10th iteration, make multiple rapid requests
    for (let i = 0; i < 3; i++) {
      http.get(`${BASE_URL}/api/auth/csrf`);
    }
  }

  // Shorter sleep time to increase pressure
  sleep(Math.random() * 0.5 + 0.1);
}

export function setup() {
  console.log('Starting stress test...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('This test will gradually increase load to find breaking points');
}

export function teardown(data) {
  console.log('Stress test completed');
}