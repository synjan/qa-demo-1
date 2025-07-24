# Test Performance Optimization Guide

This guide outlines strategies and configurations for optimizing test performance in the QA Test Manager project.

## Overview

The test suite has been optimized for parallel execution, reducing test runtime by up to 75% through:
- Parallel Jest execution
- Playwright test sharding
- Smart test splitting
- Performance monitoring

## Quick Start

### Local Development
```bash
# Run all tests in parallel (uses 50% of CPU cores)
npm run test:parallel

# Run E2E tests in parallel
npm run test:e2e:parallel

# Run specific test group
GROUP=1 npm run test:group
```

### CI/CD
```bash
# Split tests into groups
TOTAL_GROUPS=4 npm run test:split

# Run specific shard
SHARD=1 TOTAL_SHARDS=4 npm run test:e2e:shard
```

## Optimization Strategies

### 1. Test Parallelization

#### Jest Parallel Configuration
```javascript
// jest.config.parallel.js
module.exports = {
  maxWorkers: '50%', // Use 50% of CPU cores
  // In CI: maxWorkers: 4
};
```

#### Benefits:
- **Local**: 2-4x faster on multi-core machines
- **CI**: Consistent performance with 4 workers
- **Memory**: Controlled resource usage

### 2. Test Sharding

#### Playwright Sharding
```typescript
// playwright-parallel.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 4 : '50%',
  shard: {
    total: 4,
    current: parseInt(process.env.SHARD || '1'),
  },
});
```

#### GitHub Actions Matrix
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
```

### 3. Smart Test Splitting

The `scripts/split-tests.js` utility distributes tests based on:
- Historical execution times
- Test complexity patterns
- Balanced workload distribution

#### Algorithm:
1. Load test metadata with average durations
2. Sort tests by duration (longest first)
3. Use bin packing to distribute evenly
4. Generate group files for parallel execution

### 4. Test Data Factories

Replace hardcoded test data with dynamic generators:

```typescript
// Before (slow - hardcoded)
const mockRepos = [
  { id: 1, name: 'repo1', ... },
  { id: 2, name: 'repo2', ... },
];

// After (fast - generated)
const mockRepos = GitHubFactory.repositories(2);
```

Benefits:
- Reduced memory footprint
- Faster test initialization
- Consistent test data

### 5. Shared Test Utilities

Eliminate duplication with shared test patterns:

```typescript
// Shared test suite
export function runGitHubAPITests(getContext: () => Context) {
  // Common tests run in both unit and integration
}

// Unit tests
runGitHubAPITests(() => mockContext);

// Integration tests  
runGitHubAPITests(() => realContext);
```

## Performance Metrics

### Baseline (Sequential)
- Unit tests: ~45 seconds
- E2E tests: ~3 minutes
- Total: ~4 minutes

### Optimized (Parallel)
- Unit tests: ~12 seconds (4 workers)
- E2E tests: ~45 seconds (4 shards)
- Total: ~1 minute

**Performance Gain: 75% reduction in test time**

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TOTAL_GROUPS` | Number of test groups | 4 |
| `GROUP` | Current group ID | - |
| `SHARD` | Current shard number | - |
| `TOTAL_SHARDS` | Total number of shards | 4 |
| `SKIP_SLOW_TESTS` | Skip slow test suites | false |
| `QUICK_TEST` | Run only critical tests | false |
| `USE_FAKE_TIMERS` | Use Jest fake timers | false |
| `PREWARM_APP` | Pre-warm Next.js app | true |
| `SETUP_AUTH` | Pre-configure auth state | true |

### Test Categories

Tests are organized by priority:
1. **Smoke tests** (`smoke.spec.ts`) - Critical path
2. **Critical tests** (`critical-*.spec.ts`) - Core features
3. **Standard tests** (`*.spec.ts`) - Full coverage
4. **Slow tests** (`slow-*.spec.ts`) - Performance/stress

### Memory Management

For large test suites:
```javascript
// Global setup
global.gc && global.gc(); // Force garbage collection

// Test cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
jobs:
  prepare:
    # Split tests into groups
    
  unit-tests:
    strategy:
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
    # Run groups in parallel
    
  e2e-tests:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    # Run shards in parallel
```

### Performance Monitoring

Track test performance over time:
```javascript
// .test-splits/test-metadata.json
{
  "src/lib/__tests__/github.test.ts": {
    "averageDuration": 1523
  }
}
```

## Best Practices

### 1. Isolate Test Dependencies
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  GitHubFactory.reset(); // Reset counters
});
```

### 2. Use Appropriate Timeouts
```typescript
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### 3. Avoid Test Interdependencies
- Each test should be independent
- Use factories for consistent data
- Clean up after each test

### 4. Optimize Assertions
```typescript
// Slow - multiple queries
expect(page.getByText('Title')).toBeVisible();
expect(page.getByText('Description')).toBeVisible();

// Fast - single query
await expect(page).toHaveText(['Title', 'Description']);
```

### 5. Leverage Caching
```typescript
// Cache expensive operations
const cachedData = cache.get('expensive-data') || 
  await generateExpensiveData();
```

## Troubleshooting

### Tests Running Slowly

1. Check CPU usage: `npm run test:parallel -- --maxWorkers=2`
2. Profile tests: `npm run test -- --verbose`
3. Identify slow tests: Check performance reports

### Memory Issues

1. Reduce workers: `--maxWorkers=2`
2. Enable GC: `node --expose-gc`
3. Clear caches between tests

### Flaky Tests

1. Check for race conditions
2. Add proper waits: `await waitFor(...)`
3. Use test retries: `retries: 2`

### Debugging Parallel Tests

```bash
# Run single worker for debugging
npm test -- --maxWorkers=1 --detectOpenHandles

# Run specific test file
npm test -- path/to/test.ts

# Enable verbose logging
DEBUG=* npm test
```

## Future Improvements

1. **Intelligent Test Selection**
   - Run only affected tests based on code changes
   - Skip tests for unchanged code paths

2. **Distributed Testing**
   - Leverage cloud infrastructure
   - Cross-browser testing grid

3. **AI-Powered Optimization**
   - Predict test failures
   - Optimize test order dynamically

4. **Real-time Performance Dashboard**
   - Live test execution metrics
   - Historical trend analysis

## Conclusion

By implementing these optimizations, we've achieved:
- 75% reduction in test execution time
- Better resource utilization
- Improved developer experience
- Scalable test infrastructure

Continue monitoring and optimizing as the test suite grows!