import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { 
  BASE_URL, 
  spikeTestStages,
  commonThresholds 
} from './config/options.js';

// Custom metrics
const errorRate = new Rate('errors');
const requestsDropped = new Counter('requests_dropped');

// Test options
export const options = {
  stages: spikeTestStages,
  thresholds: {
    ...commonThresholds,
    errors: ['rate<0.15'], // Allow up to 15% errors during spike
    requests_dropped: ['count<100'], // Should not drop too many requests
  },
};

export default function () {
  const requests = [
    {
      method: 'GET',
      url: `${BASE_URL}/`,
      params: { timeout: '5s' }
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/auth/providers`,
      params: { timeout: '3s' }
    },
    {
      method: 'POST',
      url: `${BASE_URL}/api/auth/guest`,
      body: JSON.stringify({
        name: `Spike User ${__VU}`,
        role: 'guest'
      }),
      params: {
        headers: { 'Content-Type': 'application/json' },
        timeout: '3s'
      }
    }
  ];

  // Execute random request
  const req = requests[Math.floor(Math.random() * requests.length)];
  let response;

  try {
    if (req.method === 'GET') {
      response = http.get(req.url, req.params);
    } else {
      response = http.post(req.url, req.body, req.params);
    }

    const success = check(response, {
      'Status is 200-399': (r) => r.status >= 200 && r.status < 400,
      'No timeout': (r) => r.error === '',
    });

    if (!success) {
      errorRate.add(1);
      if (response.error && response.error.includes('timeout')) {
        requestsDropped.add(1);
      }
    } else {
      errorRate.add(0);
    }
  } catch (e) {
    errorRate.add(1);
    requestsDropped.add(1);
    console.error(`Request failed: ${e.message}`);
  }

  // Minimal sleep during spike
  sleep(Math.random() * 0.1);
}

export function setup() {
  console.log('Starting spike test...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('This test simulates sudden traffic spikes');
}

export function handleSummary(data) {
  console.log('Spike test completed');
  
  // Check if the system recovered after spike
  const errorRates = data.metrics.errors.values;
  if (errorRates && errorRates.rate > 0.15) {
    console.error('System did not handle spike well - error rate exceeded 15%');
  } else {
    console.log('System handled spike successfully');
  }
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}