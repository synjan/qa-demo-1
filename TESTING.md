# QA Test Manager - Comprehensive Testing Guide

This document outlines the complete testing strategy and implementation for the QA Test Manager application.

## Testing Architecture

### Test Pyramid

```
         /\
        /  \    E2E Tests (Playwright)
       /----\   Integration Tests (API)
      /      \  Unit Tests (Jest)
     /--------\ 
    /          \ Performance Tests (k6)
   /------------\ Contract Tests (Pact)
  /______________\ Visual Regression (Playwright)
```

## Test Types

### 1. Unit Tests (Jest + React Testing Library)
**Coverage Target:** 80%+

```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

**Test Structure:**
- `src/**/__tests__/` - Test files
- `src/**/*.test.{ts,tsx}` - Alternative pattern

**Key Areas:**
- Components (`src/components/`)
- Utilities (`src/lib/`)
- Hooks (`src/hooks/`)
- Services (`src/lib/github.ts`, `src/lib/openai.ts`)

### 2. End-to-End Tests (Playwright)

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:headed    # With browser UI
npm run test:e2e:ui        # Playwright test UI
npm run test:e2e:smoke     # Smoke tests only
npm run test:e2e:api       # API tests only
```

**Test Categories:**
- **Smoke Tests**: Critical path validation
- **Authentication**: OAuth and PAT flows
- **CRUD Operations**: Test cases, plans, and runs
- **API Tests**: Backend endpoint validation

### 3. Visual Regression Tests (Playwright)

```bash
npm run test:visual        # Run visual tests
npm run test:visual:update # Update snapshots
npm run test:visual:ui     # Visual test UI
```

**Coverage:**
- All major pages and states
- Responsive design (mobile, tablet, desktop)
- Light/dark theme variations
- Component states (hover, active, disabled)

### 4. Performance Tests (k6)

```bash
# Individual tests
k6 run load-test.js
k6 run stress-test.js
k6 run spike-test.js
k6 run api-test.js

# All tests
cd k6-tests && ./run-tests.sh
```

**Test Scenarios:**
- **Load Test**: 20 concurrent users, gradual ramp-up
- **Stress Test**: Find breaking point (up to 200 users)
- **Spike Test**: Sudden traffic spike (100 users)
- **API Test**: Endpoint performance validation

**Performance Targets:**
- Response time p95 < 500ms
- Error rate < 10%
- Throughput > 100 req/s

### 5. Contract Tests (Pact)

```bash
npm run test:contracts        # Run contract tests
npm run test:contracts:verify # Verify provider
npm run test:contracts:publish # Publish to broker
```

**Contracts:**
- GitHub API consumer contracts
- Internal API provider/consumer contracts
- Schema validation
- Backwards compatibility checks

## CI/CD Integration

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Triggered on: Push to main/develop, PRs
   - Jobs:
     - Unit tests with coverage
     - E2E tests
     - Performance tests
     - Security audit
     - Build verification

2. **CD Pipeline** (`.github/workflows/cd.yml`)
   - Triggered on: Push to main
   - Deployment to production
   - Smoke test validation

3. **PR Checks** (`.github/workflows/pr.yml`)
   - Code formatting
   - ESLint
   - Type checking
   - Test coverage report
   - Bundle size analysis
   - Lighthouse CI

4. **Release Pipeline** (`.github/workflows/release.yml`)
   - Triggered on: Version tags
   - Generate changelog
   - Create GitHub release
   - Build Docker images
   - Deploy to production

## Test Data Management

### Test Fixtures
- Location: `e2e-tests/fixtures/`
- Mock data for:
  - Users
  - Test cases
  - Test plans
  - GitHub repositories
  - API responses

### Test Helpers
- `e2e-tests/helpers/auth.helper.ts` - Authentication utilities
- `e2e-tests/helpers/navigation.helper.ts` - Common navigation
- `e2e-tests/helpers/test-data.helper.ts` - Test data generation

## Running Tests Locally

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install k6 (macOS)
brew install k6

# Start dev server
npm run dev
```

### Quick Test Commands
```bash
# Run all tests
npm test && npm run test:e2e

# Quick smoke test
npm run test:e2e:smoke

# Visual regression check
npm run test:visual

# Performance baseline
k6 run k6-tests/load-test.js

# Contract validation
npm run test:contracts
```

## Test Reports

### Coverage Reports
- Location: `coverage/`
- HTML report: `coverage/lcov-report/index.html`
- Thresholds:
  - Statements: 60%
  - Branches: 60%
  - Functions: 60%
  - Lines: 60%

### E2E Reports
- Location: `playwright-report/`
- View: `npx playwright show-report`

### Performance Reports
- k6 HTML report: `k6-tests/results.html`
- JSON metrics: `k6-tests/results.json`

## Debugging Tests

### Unit Tests
```bash
# Debug in VS Code
# Add breakpoint and run "Jest: Debug" from command palette

# Debug specific test
npm test -- --testNamePattern="should create test case"
```

### E2E Tests
```bash
# Debug mode
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip

# Step-by-step
npm run test:e2e:ui
```

### Performance Tests
```bash
# Verbose output
k6 run load-test.js --verbose

# HTTP debug
k6 run load-test.js --http-debug
```

## Best Practices

### Writing Tests

1. **Unit Tests**
   - Test behavior, not implementation
   - Use meaningful describe/it blocks
   - Mock external dependencies
   - Keep tests isolated

2. **E2E Tests**
   - Use data-testid attributes
   - Implement Page Object Model
   - Handle async operations properly
   - Clean up test data

3. **Visual Tests**
   - Mask dynamic content
   - Disable animations
   - Use consistent viewport sizes
   - Review snapshots carefully

4. **Performance Tests**
   - Define clear SLAs
   - Test realistic scenarios
   - Monitor trends over time
   - Consider geographic distribution

5. **Contract Tests**
   - Version contracts properly
   - Test both happy and error paths
   - Keep contracts in sync
   - Use semantic versioning

### Test Maintenance

- Review and update tests with feature changes
- Remove obsolete tests
- Refactor duplicated test code
- Update snapshots intentionally
- Monitor flaky tests

## Troubleshooting

### Common Issues

1. **Flaky E2E Tests**
   - Add proper waits
   - Check for race conditions
   - Ensure clean test state

2. **Performance Test Failures**
   - Check server resources
   - Verify network conditions
   - Review concurrent user limits

3. **Visual Test Mismatches**
   - Check for dynamic content
   - Verify font loading
   - Review animation states

4. **Contract Test Failures**
   - Verify API compatibility
   - Check request/response formats
   - Update contracts when needed

## Future Improvements

1. **Mutation Testing**: Add Stryker for mutation coverage
2. **Accessibility Testing**: Integrate axe-core
3. **Security Testing**: Add OWASP ZAP integration
4. **Chaos Engineering**: Implement failure injection
5. **Cross-browser Testing**: Add BrowserStack integration

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Pact Documentation](https://docs.pact.io/)
- [Testing Best Practices](https://testingjavascript.com/)