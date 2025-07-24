import { TestRun, TestResult } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

let testRunCounter = 1;

export class TestRunFactory {
  static reset() {
    testRunCounter = 1;
  }

  static testResult(overrides: Partial<TestResult> = {}): TestResult {
    return {
      testCaseId: overrides.testCaseId || `tc-${uuidv4()}`,
      status: overrides.status || 'passed',
      actualResult: overrides.actualResult || 'Test executed as expected',
      notes: overrides.notes || '',
      attachments: overrides.attachments || [],
      executedAt: overrides.executedAt || new Date().toISOString(),
      executedBy: overrides.executedBy || 'testuser',
      executionTime: overrides.executionTime || Math.floor(Math.random() * 300) + 60,
      ...overrides,
    };
  }

  static testResults(testCaseIds: string[], overrides: Partial<TestResult> = {}): TestResult[] {
    return testCaseIds.map(testCaseId => this.testResult({ ...overrides, testCaseId }));
  }

  static testRun(overrides: Partial<TestRun> = {}): TestRun {
    const id = overrides.id || `tr-${uuidv4()}`;
    const counter = testRunCounter++;
    const startedAt = overrides.startedAt || new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const isCompleted = overrides.status === 'completed' || overrides.completedAt !== undefined;
    
    return {
      id,
      testPlanId: overrides.testPlanId || `tp-${uuidv4()}`,
      name: overrides.name || `Test Run ${counter}`,
      status: overrides.status || 'in_progress',
      results: overrides.results || [],
      environment: overrides.environment || 'staging',
      startedAt,
      completedAt: isCompleted ? (overrides.completedAt || new Date().toISOString()) : null,
      executedBy: overrides.executedBy || 'testuser',
      tags: overrides.tags || ['automated', `run-${counter}`],
      notes: overrides.notes || '',
      ...overrides,
    };
  }

  static testRuns(count: number, overrides: Partial<TestRun> = {}): TestRun[] {
    return Array.from({ length: count }, () => this.testRun(overrides));
  }

  static completed(results: TestResult[]): Partial<TestRun> {
    const passedCount = results.filter(r => r.status === 'passed').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    return {
      status: 'completed',
      results,
      completedAt: new Date().toISOString(),
      notes: `Completed: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped`,
    };
  }

  static inProgress(completedResults: TestResult[] = []): Partial<TestRun> {
    return {
      status: 'in_progress',
      results: completedResults,
      completedAt: null,
    };
  }

  static failed(error: string): Partial<TestRun> {
    return {
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes: `Test run failed: ${error}`,
      results: [],
    };
  }

  static randomResults(testCaseIds: string[]): TestResult[] {
    const statuses: TestResult['status'][] = ['passed', 'failed', 'skipped'];
    
    return testCaseIds.map(testCaseId => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return this.testResult({
        testCaseId,
        status,
        actualResult: status === 'failed' 
          ? 'Test failed with unexpected behavior' 
          : status === 'skipped'
          ? 'Test skipped due to dependencies'
          : 'Test passed successfully',
        notes: status === 'failed' ? 'See attached logs for details' : '',
      });
    });
  }
}