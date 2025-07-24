export const TestData = {
  auth: {
    validPAT: 'ghp_test_valid_token_123456789',
    invalidPAT: 'invalid_token',
    testUser: {
      name: 'Test User',
      email: 'test@example.com'
    }
  },

  repositories: {
    valid: {
      owner: 'test-owner',
      name: 'test-repo',
      fullName: 'test-owner/test-repo'
    },
    withIssues: {
      owner: 'test-owner',
      name: 'test-project',
      fullName: 'test-owner/test-project',
      issues: [
        {
          number: 1,
          title: 'Add user authentication',
          body: 'Implement user login and registration'
        },
        {
          number: 2,
          title: 'Fix navigation bug',
          body: 'Navigation menu not working on mobile'
        }
      ]
    }
  },

  testCases: {
    basic: {
      title: 'Test User Login',
      description: 'Verify user can log in successfully',
      preconditions: 'User has valid credentials',
      steps: [
        'Navigate to login page',
        'Enter username',
        'Enter password',
        'Click login button'
      ],
      expectedResults: [
        'Login page is displayed',
        'Username field accepts input',
        'Password field accepts input',
        'User is redirected to dashboard'
      ]
    },
    generated: {
      issueNumber: 1,
      repository: 'test-owner/test-repo'
    }
  },

  testPlans: {
    basic: {
      name: 'Smoke Test Plan',
      description: 'Basic smoke tests for critical functionality',
      testCaseIds: []
    },
    regression: {
      name: 'Regression Test Plan',
      description: 'Full regression test suite',
      testCaseIds: []
    }
  },

  testRuns: {
    basic: {
      name: 'Daily Smoke Test Run',
      environment: 'Production',
      browser: 'Chrome'
    }
  },

  openai: {
    apiKey: 'sk-test-key-123456789',
    invalidKey: 'invalid-key'
  }
};

export const Timeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  apiCall: 60000
};

export const Selectors = {
  buttons: {
    primary: 'button[data-variant="default"], button:not([data-variant])',
    secondary: 'button[data-variant="secondary"]',
    danger: 'button[data-variant="destructive"]',
    ghost: 'button[data-variant="ghost"]'
  },
  inputs: {
    text: 'input[type="text"]',
    password: 'input[type="password"]',
    email: 'input[type="email"]',
    search: 'input[type="search"], input[placeholder*="Search"]'
  },
  cards: {
    base: '[data-slot="card"], .card',
    title: '[data-slot="card-title"], .card-title',
    content: '[data-slot="card-content"], .card-content'
  },
  dialogs: {
    root: '[role="dialog"]',
    title: '[role="dialog"] h2',
    close: '[role="dialog"] button[aria-label="Close"]'
  },
  tables: {
    root: '[role="table"], table',
    header: 'thead',
    body: 'tbody',
    row: 'tr',
    cell: 'td'
  },
  navigation: {
    main: 'nav',
    link: 'nav a',
    active: 'nav a[aria-current="page"]'
  }
};