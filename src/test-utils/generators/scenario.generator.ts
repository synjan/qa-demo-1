import { TestCase, TestPlan, TestRun, TestResult } from '@/lib/types';
import { TestCaseFactory, TestPlanFactory, TestRunFactory } from '../factories';
import { RandomGenerator, TestDataGenerator } from './random.generator';

/**
 * Generate complete test scenarios for different use cases
 */
export class ScenarioGenerator {
  /**
   * Generate a complete smoke test scenario
   */
  static smokeTestScenario() {
    const testCases = [
      TestCaseFactory.testCase({
        title: 'User Login',
        priority: 'high',
        tags: ['smoke', 'auth', 'critical'],
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            action: 'Navigate to login page',
            expectedResult: 'Login page loads successfully'
          },
          {
            id: 'step-2',
            stepNumber: 2,
            action: 'Enter valid credentials',
            expectedResult: 'Credentials accepted'
          },
          {
            id: 'step-3',
            stepNumber: 3,
            action: 'Click login button',
            expectedResult: 'User redirected to dashboard'
          }
        ]
      }),
      TestCaseFactory.testCase({
        title: 'Create Test Case',
        priority: 'high',
        tags: ['smoke', 'crud', 'critical'],
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            action: 'Click "New Test Case" button',
            expectedResult: 'Test case form opens'
          },
          {
            id: 'step-2',
            stepNumber: 2,
            action: 'Fill in required fields',
            expectedResult: 'Form validation passes'
          },
          {
            id: 'step-3',
            stepNumber: 3,
            action: 'Click save button',
            expectedResult: 'Test case created successfully'
          }
        ]
      }),
      TestCaseFactory.testCase({
        title: 'View Test Results',
        priority: 'high',
        tags: ['smoke', 'reporting', 'critical'],
      })
    ];

    const testPlan = TestPlanFactory.testPlan({
      name: 'Smoke Test Suite',
      description: 'Critical path validation for production deployment',
      testCaseIds: testCases.map(tc => tc.id),
      tags: ['smoke', 'critical', 'production']
    });

    const testRun = TestRunFactory.testRun({
      testPlanId: testPlan.id,
      name: 'Production Smoke Test Run',
      environment: 'production',
      status: 'completed',
      results: testCases.map(tc => 
        TestRunFactory.testResult({
          testCaseId: tc.id,
          status: 'passed',
          actualResult: 'Test executed successfully',
          executionTime: RandomGenerator.number(30, 120)
        })
      )
    });

    return { testCases, testPlan, testRun };
  }

  /**
   * Generate a regression test scenario
   */
  static regressionTestScenario() {
    const featureAreas = ['auth', 'testcases', 'testplans', 'reporting', 'github'];
    const testCases: TestCase[] = [];

    // Generate 3-5 test cases per feature area
    featureAreas.forEach(area => {
      const caseCount = RandomGenerator.number(3, 5);
      for (let i = 0; i < caseCount; i++) {
        testCases.push(
          TestDataGenerator.testCase({
            tags: ['regression', area],
            priority: RandomGenerator.priority(),
            estimatedTime: RandomGenerator.number(180, 600)
          })
        );
      }
    });

    const testPlan = TestPlanFactory.testPlan({
      name: 'Full Regression Test Suite',
      description: 'Comprehensive regression testing covering all features',
      testCaseIds: testCases.map(tc => tc.id),
      tags: ['regression', 'full-suite']
    });

    // Simulate realistic test results
    const results = testCases.map(tc => {
      const random = Math.random();
      let status: TestResult['status'];
      
      if (random < 0.85) status = 'passed';
      else if (random < 0.95) status = 'failed';
      else status = 'skipped';

      return TestRunFactory.testResult({
        testCaseId: tc.id,
        status,
        actualResult: status === 'failed' 
          ? RandomGenerator.errorMessage()
          : status === 'skipped'
          ? 'Test skipped due to dependency failure'
          : 'Test passed successfully',
        executionTime: status === 'skipped' ? 0 : RandomGenerator.number(60, 600)
      });
    });

    const testRun = TestRunFactory.testRun({
      testPlanId: testPlan.id,
      name: 'Nightly Regression Run',
      environment: 'staging',
      status: 'completed',
      results
    });

    return { testCases, testPlan, testRun };
  }

  /**
   * Generate an edge case testing scenario
   */
  static edgeCaseScenario() {
    const edgeCases = [
      {
        title: 'Maximum Input Length Test',
        description: 'Test system behavior with maximum allowed input',
        tags: ['edge-case', 'validation', 'boundary']
      },
      {
        title: 'Empty Data Submission',
        description: 'Test system behavior with empty/null values',
        tags: ['edge-case', 'validation', 'negative']
      },
      {
        title: 'Concurrent User Actions',
        description: 'Test system under concurrent operations',
        tags: ['edge-case', 'concurrency', 'stress']
      },
      {
        title: 'Special Characters Handling',
        description: 'Test with unicode and special characters',
        tags: ['edge-case', 'i18n', 'validation']
      },
      {
        title: 'Session Timeout Handling',
        description: 'Test behavior after session expiration',
        tags: ['edge-case', 'auth', 'timeout']
      }
    ];

    const testCases = edgeCases.map(ec => 
      TestCaseFactory.testCase({
        ...ec,
        priority: 'low',
        estimatedTime: RandomGenerator.number(300, 900)
      })
    );

    const testPlan = TestPlanFactory.testPlan({
      name: 'Edge Case Test Suite',
      description: 'Testing boundary conditions and unusual scenarios',
      testCaseIds: testCases.map(tc => tc.id),
      tags: ['edge-case', 'exploratory']
    });

    return { testCases, testPlan };
  }

  /**
   * Generate a performance testing scenario
   */
  static performanceTestScenario() {
    const performanceTests = [
      {
        title: 'Page Load Time - Dashboard',
        tags: ['performance', 'frontend', 'metrics'],
        expectedResult: 'Page loads in under 2 seconds'
      },
      {
        title: 'API Response Time - List Test Cases',
        tags: ['performance', 'api', 'metrics'],
        expectedResult: 'API responds in under 500ms'
      },
      {
        title: 'Bulk Operation - Create 100 Test Cases',
        tags: ['performance', 'stress', 'bulk'],
        expectedResult: 'Operation completes in under 30 seconds'
      },
      {
        title: 'Concurrent Users - 50 Active Sessions',
        tags: ['performance', 'load', 'concurrent'],
        expectedResult: 'System remains responsive'
      }
    ];

    const testCases = performanceTests.map(pt =>
      TestCaseFactory.testCase({
        ...pt,
        priority: 'medium',
        estimatedTime: RandomGenerator.number(600, 1800)
      })
    );

    return { testCases };
  }

  /**
   * Generate a complete E2E user journey
   */
  static e2eUserJourney() {
    const journey = [
      'User Registration/Login',
      'Connect GitHub Repository',
      'Import Issues from GitHub',
      'Generate Test Cases from Issues',
      'Create Test Plan',
      'Execute Test Run',
      'View Test Reports',
      'Export Results'
    ];

    const testCases = journey.map((step, index) =>
      TestCaseFactory.testCase({
        title: `E2E Step ${index + 1}: ${step}`,
        priority: 'high',
        tags: ['e2e', 'user-journey', 'integration'],
        estimatedTime: RandomGenerator.number(300, 600)
      })
    );

    const testPlan = TestPlanFactory.testPlan({
      name: 'End-to-End User Journey',
      description: 'Complete user workflow from start to finish',
      testCaseIds: testCases.map(tc => tc.id),
      tags: ['e2e', 'integration', 'user-journey']
    });

    return { testCases, testPlan };
  }

  /**
   * Generate a failed test scenario for testing error handling
   */
  static failedTestScenario() {
    const testCases = [
      TestCaseFactory.testCase({
        title: 'API Authentication Failure',
        tags: ['api', 'auth', 'negative'],
        priority: 'high'
      }),
      TestCaseFactory.testCase({
        title: 'Database Connection Error',
        tags: ['infrastructure', 'database', 'negative'],
        priority: 'high'
      }),
      TestCaseFactory.testCase({
        title: 'UI Component Rendering Error',
        tags: ['ui', 'frontend', 'negative'],
        priority: 'medium'
      })
    ];

    const results = testCases.map(tc =>
      TestRunFactory.testResult({
        testCaseId: tc.id,
        status: 'failed',
        actualResult: RandomGenerator.errorMessage(),
        notes: 'See attached logs for detailed error information',
        attachments: ['error-log.txt', 'screenshot.png']
      })
    );

    const testRun = TestRunFactory.testRun({
      name: 'Failed Test Scenario',
      status: 'completed',
      results,
      notes: 'Multiple failures detected - investigation required'
    });

    return { testCases, testRun };
  }
}