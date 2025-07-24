import { TestPlan } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

let testPlanCounter = 1;

export class TestPlanFactory {
  static reset() {
    testPlanCounter = 1;
  }

  static testPlan(overrides: Partial<TestPlan> = {}): TestPlan {
    const id = overrides.id || `tp-${uuidv4()}`;
    const counter = testPlanCounter++;
    
    return {
      id,
      name: overrides.name || `Test Plan ${counter}`,
      description: overrides.description || `Description for test plan ${counter}`,
      testCaseIds: overrides.testCaseIds || [`tc-${uuidv4()}`, `tc-${uuidv4()}`, `tc-${uuidv4()}`],
      tags: overrides.tags || ['release', `v${counter}.0`],
      createdAt: overrides.createdAt || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      createdBy: overrides.createdBy || 'testuser',
      lastUpdatedBy: overrides.lastUpdatedBy || 'testuser',
      ...overrides,
    };
  }

  static testPlans(count: number, overrides: Partial<TestPlan> = {}): TestPlan[] {
    return Array.from({ length: count }, () => this.testPlan(overrides));
  }

  static release(version: string): Partial<TestPlan> {
    return {
      name: `Release ${version} Test Plan`,
      description: `Test plan for release ${version}`,
      tags: ['release', version, 'production'],
    };
  }

  static sprint(sprintNumber: number): Partial<TestPlan> {
    return {
      name: `Sprint ${sprintNumber} Test Plan`,
      description: `Test plan for sprint ${sprintNumber}`,
      tags: ['sprint', `sprint-${sprintNumber}`],
    };
  }

  static regression(): Partial<TestPlan> {
    return {
      name: 'Regression Test Suite',
      description: 'Comprehensive regression test plan',
      tags: ['regression', 'automated', 'nightly'],
    };
  }

  static smoke(): Partial<TestPlan> {
    return {
      name: 'Smoke Test Suite',
      description: 'Critical path smoke tests',
      tags: ['smoke', 'critical', 'quick'],
    };
  }

  static withTestCases(testCaseIds: string[]): Partial<TestPlan> {
    return {
      testCaseIds,
    };
  }
}