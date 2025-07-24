import { TestCase, TestStep } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

let testCaseCounter = 1;
let stepCounter = 1;

export class TestCaseFactory {
  static reset() {
    testCaseCounter = 1;
    stepCounter = 1;
  }

  static step(overrides: Partial<TestStep> = {}): TestStep {
    const id = `step-${stepCounter++}`;
    
    return {
      id,
      stepNumber: overrides.stepNumber || stepCounter,
      action: overrides.action || `Perform action ${stepCounter}`,
      expectedResult: overrides.expectedResult || `Expected result ${stepCounter}`,
      ...overrides,
    };
  }

  static steps(count: number, overrides: Partial<TestStep> = {}): TestStep[] {
    return Array.from({ length: count }, (_, i) => 
      this.step({ ...overrides, stepNumber: i + 1 })
    );
  }

  static testCase(overrides: Partial<TestCase> = {}): TestCase {
    const id = overrides.id || `tc-${uuidv4()}`;
    const counter = testCaseCounter++;
    
    return {
      id,
      title: overrides.title || `Test Case ${counter}`,
      description: overrides.description || `Description for test case ${counter}`,
      preconditions: overrides.preconditions || `Preconditions for test case ${counter}`,
      steps: overrides.steps || this.steps(3),
      expectedResult: overrides.expectedResult || `Expected final result ${counter}`,
      priority: overrides.priority || 'medium',
      tags: overrides.tags || ['automated', 'regression'],
      estimatedTime: overrides.estimatedTime || 300,
      createdAt: overrides.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      createdBy: overrides.createdBy || 'testuser',
      lastUpdatedBy: overrides.lastUpdatedBy || 'testuser',
      githubIssueNumber: overrides.githubIssueNumber,
      githubRepository: overrides.githubRepository,
      ...overrides,
    };
  }

  static testCases(count: number, overrides: Partial<TestCase> = {}): TestCase[] {
    return Array.from({ length: count }, () => this.testCase(overrides));
  }

  static withGitHubLink(issueNumber: number, repository: string): Partial<TestCase> {
    return {
      githubIssueNumber: issueNumber,
      githubRepository: repository,
      tags: ['github', 'automated'],
    };
  }

  static critical(): Partial<TestCase> {
    return {
      priority: 'high',
      tags: ['critical', 'smoke'],
      estimatedTime: 600,
    };
  }

  static regression(): Partial<TestCase> {
    return {
      priority: 'medium',
      tags: ['regression'],
      estimatedTime: 300,
    };
  }

  static edge(): Partial<TestCase> {
    return {
      priority: 'low',
      tags: ['edge-case'],
      estimatedTime: 180,
    };
  }
}