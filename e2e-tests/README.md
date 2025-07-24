# QA Test Manager - E2E Test Suite

This directory contains the complete end-to-end test suite for the QA Test Manager application using Playwright.

## Test Structure

```
e2e-tests/
├── helpers/              # Test utilities and helpers
│   ├── auth.helper.ts    # Authentication utilities
│   ├── navigation.helper.ts # Navigation helpers
│   └── test-data.helper.ts  # Test data and constants
├── api/                 # API tests
│   ├── api-test.helper.ts      # API testing utilities
│   ├── auth-api.spec.ts        # Authentication API tests
│   ├── github-api.spec.ts      # GitHub API tests
│   └── test-generation-api.spec.ts # Test generation API tests
├── auth/                 # Authentication tests
│   └── authentication.spec.ts
├── dashboard/           # Dashboard tests
│   └── dashboard.spec.ts
├── test-cases/          # Test case management tests
│   └── test-cases-crud.spec.ts
├── test-plans/          # Test plan management tests
│   └── test-plans.spec.ts
├── test-runs/           # Test execution tests
│   └── test-execution.spec.ts
├── settings/            # Settings tests
│   └── settings.spec.ts
├── integrations/        # Integration tests
│   └── github-integration.spec.ts
└── smoke.spec.ts        # Basic smoke tests
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npm run test:e2e -- e2e-tests/auth/authentication.spec.ts
```

### With UI Mode
```bash
npm run test:e2e:ui
```

### In Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

### Run Only Smoke Tests
```bash
npm run test:e2e -- e2e-tests/smoke.spec.ts
```

## Test Categories

### 1. **Smoke Tests** (`smoke.spec.ts`)
- Basic application loading
- Signin page accessibility
- 404 error handling

### 2. **API Tests** (`api/`)
#### Authentication API (`auth-api.spec.ts`)
- CSRF token generation
- Auth provider listing
- Session management
- Guest session creation
- Error handling and validation

#### GitHub API (`github-api.spec.ts`)
- Repository fetching
- Issue retrieval and filtering
- Pagination support
- Rate limiting handling
- Authentication validation

#### Test Generation API (`test-generation-api.spec.ts`)
- Test case generation from issues
- OpenAI integration
- Batch processing
- Error handling
- Input validation

### 3. **Authentication Tests** (`auth/authentication.spec.ts`)
- GitHub OAuth flow
- Personal Access Token authentication
- Session persistence
- Sign out functionality
- Route protection

### 4. **Dashboard Tests** (`dashboard/dashboard.spec.ts`)
- Statistics display
- Navigation functionality
- Quick actions
- Theme switching
- Responsive design
- Widget management

### 5. **Test Cases CRUD** (`test-cases/test-cases-crud.spec.ts`)
- Create test cases manually
- Generate from GitHub issues
- View test case details
- Edit existing test cases
- Delete test cases
- Search and filter

### 6. **Test Plans** (`test-plans/test-plans.spec.ts`)
- Create test plans
- Add/remove test cases
- Edit plan details
- Clone plans
- Delete plans
- Export functionality

### 7. **Test Runs** (`test-runs/test-execution.spec.ts`)
- Start new test runs
- Execute test cases
- Mark pass/fail/skip
- Add failure details
- Pause/resume runs
- View results
- Export reports

### 8. **Settings** (`settings/settings.spec.ts`)
- Profile management
- API key configuration
- Integration settings
- Notification preferences
- Application preferences
- Data export

### 9. **GitHub Integration** (`integrations/github-integration.spec.ts`)
- Repository fetching
- Issue retrieval
- Repository search
- Issue filtering
- Favorites management
- Error handling

## Test Helpers

### AuthHelper
- `authenticateWithPAT()` - Set up authenticated state
- `signInWithPAT()` - Sign in through UI
- `signOut()` - Sign out through UI
- `isAuthenticated()` - Check auth state

### NavigationHelper
- `goToDashboard()` - Navigate to dashboard
- `goToTestCases()` - Navigate to test cases
- `goToTestPlans()` - Navigate to test plans
- `goToTestRuns()` - Navigate to test runs
- `goToSettings()` - Navigate to settings
- `toggleTheme()` - Switch theme
- `isDarkMode()` - Check theme state

### TestData
Contains all test data including:
- Authentication credentials
- Repository information
- Test case templates
- Test plan templates
- API keys

## Best Practices

1. **Use Helpers**: Utilize the helper functions for common operations
2. **Wait Strategies**: Use proper wait strategies instead of hard timeouts
3. **Selectors**: Use the predefined selectors from test-data.helper.ts
4. **Error Handling**: Tests handle both success and error scenarios
5. **Cleanup**: Tests are independent and don't rely on previous test state

## Debugging

### View Test Report
After running tests, view the HTML report:
```bash
npx playwright show-report
```

### Debug Single Test
```bash
npx playwright test --debug e2e-tests/auth/authentication.spec.ts
```

### View Trace
Enable trace on first retry in playwright.config.ts

## CI/CD Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Parallel execution disabled on CI
- Screenshots on failure
- HTML report generation

## Environment Variables

Tests expect these environment variables for full functionality:
- `GITHUB_PAT` - GitHub Personal Access Token
- `OPENAI_API_KEY` - OpenAI API key for test generation

For local testing, you can use test tokens defined in test-data.helper.ts