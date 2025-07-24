# QA Test Manager - Testing Guide

This comprehensive guide covers all testing strategies, tools, and practices implemented in the QA Test Manager project.

## Table of Contents
- [Overview](#overview)
- [Testing Architecture](#testing-architecture)
- [Test Types](#test-types)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Performance Tests](#performance-tests)
  - [Visual Regression Tests](#visual-regression-tests)
  - [Contract Tests](#contract-tests)
- [Running Tests](#running-tests)
- [Test Utilities](#test-utilities)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Overview

Our testing strategy ensures high quality, reliability, and performance through comprehensive automated testing at multiple levels.

### Key Metrics
- **Coverage**: >90% code coverage
- **Test Execution**: ~1 minute (parallelized)
- **Test Types**: 6 different testing strategies
- **Total Tests**: 500+ test cases

## Testing Architecture

```
┌─────────────────────────────────────────────┐
│             Visual Regression               │
├─────────────────────────────────────────────┤
│           End-to-End (E2E) Tests           │
├─────────────────────────────────────────────┤
│           Integration Tests                 │
├─────────────────────────────────────────────┤
│              Unit Tests                     │
├─────────────────────────────────────────────┤
│        Contract Tests (API Boundaries)      │
└─────────────────────────────────────────────┘
```

## Test Types

### Unit Tests

**Framework**: Jest + React Testing Library

Unit tests verify individual components and functions in isolation.

#### Structure
```
src/
├── components/ui/__tests__/     # UI component tests
├── lib/__tests__/               # Utility function tests
└── app/api/__tests__/           # API route tests
```

#### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test button.test.tsx

# Run tests in parallel (4 groups)
npm run test:parallel
```

#### Example Unit Test
```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Integration tests verify that different parts of the application work together correctly.

#### Key Areas
- API endpoints with database operations
- Authentication flows
- GitHub API integration
- OpenAI service integration

#### Example Integration Test
```typescript
// src/app/api/__tests__/github-integration.test.ts
describe('GitHub API Integration', () => {
  it('should fetch and transform repository data', async () => {
    const response = await fetch('/api/github/repositories');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('repositories');
    expect(data.repositories[0]).toHaveProperty('name');
  });
});
```

### End-to-End Tests

**Framework**: Playwright

E2E tests simulate real user interactions across the entire application.

#### Structure
```
e2e-tests/
├── auth/                # Authentication flows
├── dashboard/           # Dashboard functionality
├── test-cases/          # Test case management
├── test-plans/          # Test plan workflows
├── test-runs/           # Test execution flows
├── api/                 # API endpoint tests
├── visual/              # Visual regression tests
└── helpers/             # Test utilities
```

#### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npm run test:e2e auth.spec.ts

# Run tests in parallel shards
npm run test:e2e:shard

# Debug mode
npm run test:e2e:debug
```

#### Example E2E Test
```typescript
// e2e-tests/auth/authentication.spec.ts
test('user can sign in with GitHub OAuth', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign in with GitHub');
  
  // GitHub OAuth flow...
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

### Performance Tests

**Framework**: k6

Performance tests ensure the application can handle expected load.

#### Test Types
1. **Load Test**: Normal expected load
2. **Stress Test**: Beyond normal capacity
3. **Spike Test**: Sudden traffic increases
4. **API Performance**: Endpoint response times

#### Running Performance Tests
```bash
# Run all performance tests
npm run test:perf

# Run specific test type
npm run test:perf:load
npm run test:perf:stress
npm run test:perf:spike

# With custom parameters
k6 run -u 50 -d 60s k6-tests/load-test.js
```

#### Example Performance Test
```javascript
// k6-tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Visual Regression Tests

**Framework**: Playwright + Percy (optional)

Visual tests catch unintended UI changes.

#### Running Visual Tests
```bash
# Run visual regression tests
npm run test:visual

# Update baseline screenshots
npm run test:visual:update

# Run with Percy (if configured)
PERCY_TOKEN=xxx npm run test:visual
```

#### Example Visual Test
```typescript
// e2e-tests/visual/visual-regression.spec.ts
test('dashboard layout remains consistent', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Contract Tests

**Framework**: Pact

Contract tests ensure API compatibility between services.

#### Running Contract Tests
```bash
# Run consumer tests (generate pacts)
npm run test:contract:consumer

# Run provider verification
npm run test:contract:provider

# Publish pacts to broker
npm run test:contract:publish
```

## Test Utilities

### Test Factories

Generate test data dynamically:

```typescript
import { GitHubFactory, TestCaseFactory } from '@/test-utils/factories';

// Create test data
const mockRepo = GitHubFactory.createRepository();
const mockIssue = GitHubFactory.createIssue({ 
  title: 'Custom issue' 
});
const testCase = TestCaseFactory.create({
  priority: 'high'
});
```

### Random Generators

Create realistic test data:

```typescript
import { RandomGenerator } from '@/test-utils/generators';

const title = RandomGenerator.string({ minLength: 10 });
const priority = RandomGenerator.priority(); // 'high' | 'medium' | 'low'
const email = RandomGenerator.email();
```

### Shared Test Suites

Reuse test logic across unit and integration tests:

```typescript
import { runAuthTests } from '@/test-utils/shared-tests';

describe('Auth - Unit Tests', () => {
  runAuthTests('unit');
});

describe('Auth - Integration Tests', () => {
  runAuthTests('integration');
});
```

### Test Helpers

Common testing utilities:

```typescript
// Authentication helper
await authenticateUser(page, {
  email: 'test@example.com',
  token: 'github_token'
});

// Navigation helper
await navigateToTestCases(page);

// API test helper
const response = await apiRequest('/api/testcases', {
  method: 'POST',
  body: testData
});
```

## CI/CD Integration

### GitHub Actions Workflows

Tests run automatically on:
- Pull requests
- Pushes to main/develop
- Scheduled runs (nightly)

### Parallel Execution

Tests are split for faster execution:
- Unit tests: 4 parallel groups
- E2E tests: 4 shards
- Total time: ~1 minute (vs 4 minutes sequential)

### Test Results

- **Coverage Reports**: Uploaded to Codecov
- **E2E Results**: Stored as artifacts
- **Performance Metrics**: Tracked over time
- **Visual Diffs**: Reviewed in PRs

## Best Practices

### 1. Test Organization

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Arrange
      const data = setupTestData();
      
      // Act
      const result = performAction(data);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 2. Use Test Factories

```typescript
// ❌ Bad: Hardcoded test data
const issue = {
  id: 123,
  title: 'Test Issue',
  state: 'open',
  // ... many more fields
};

// ✅ Good: Use factories
const issue = GitHubFactory.createIssue({
  title: 'Test Issue'
});
```

### 3. Avoid Test Interdependence

```typescript
// ❌ Bad: Tests depend on each other
it('should create user', () => {
  globalUser = createUser();
});

it('should update user', () => {
  updateUser(globalUser); // Depends on previous test
});

// ✅ Good: Independent tests
it('should update user', () => {
  const user = createUser();
  updateUser(user);
});
```

### 4. Clear Test Names

```typescript
// ❌ Bad: Vague test names
it('should work', () => {});
it('test auth', () => {});

// ✅ Good: Descriptive names
it('should redirect to login when accessing protected route without authentication', () => {});
it('should display error message when GitHub API rate limit is exceeded', () => {});
```

### 5. Mock External Services

```typescript
// Mock GitHub API
const mockOctokit = GitHubFactory.mockOctokit({
  repositories: [repo1, repo2],
  issues: [issue1, issue2]
});

// Mock OpenAI
jest.mock('@/lib/openai', () => ({
  generateTestCases: jest.fn().mockResolvedValue([testCase])
}));
```

### 6. Test Error Scenarios

```typescript
it('should handle network timeout gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('ETIMEDOUT'));
  
  const result = await fetchData();
  
  expect(result.error).toBe('Network timeout. Please try again.');
});
```

### 7. Use Proper Assertions

```typescript
// ❌ Bad: Generic assertions
expect(result).toBeTruthy();
expect(items.length).toBeGreaterThan(0);

// ✅ Good: Specific assertions
expect(result).toEqual({ status: 'success', data: expectedData });
expect(items).toHaveLength(3);
expect(items[0]).toMatchObject({ id: 1, name: 'Test' });
```

## Debugging Tests

### Debug Unit Tests
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code: Use "Jest: Debug" configuration
```

### Debug E2E Tests
```bash
# Run with Playwright inspector
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e -- --headed

# Slow motion
npm run test:e2e -- --headed --slow-mo=1000
```

### Common Issues

1. **Flaky Tests**: Use proper waits and assertions
   ```typescript
   // ❌ Bad: Fixed timeout
   await page.waitForTimeout(1000);
   
   // ✅ Good: Wait for specific condition
   await page.waitForSelector('[data-testid="loaded"]');
   ```

2. **State Pollution**: Clean up after tests
   ```typescript
   afterEach(async () => {
     await cleanup();
     jest.clearAllMocks();
   });
   ```

3. **Slow Tests**: Use test factories and parallel execution
   ```typescript
   // Generate bulk test data efficiently
   const testCases = TestCaseFactory.createBulk(100);
   ```

## Continuous Improvement

### Monitoring Test Health

1. **Track Metrics**:
   - Test execution time
   - Flakiness rate
   - Coverage trends
   - Failure patterns

2. **Regular Maintenance**:
   - Update snapshots when UI changes
   - Refactor slow tests
   - Remove obsolete tests
   - Update test data

3. **Team Practices**:
   - Write tests with new features
   - Fix failing tests immediately
   - Review test code in PRs
   - Share testing patterns

---

For more specific testing scenarios or questions, refer to the example tests in the codebase or consult the team's testing documentation.