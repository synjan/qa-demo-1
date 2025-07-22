import { TestStepResult, TestResult } from './types'

/**
 * Utility functions for test case execution logic and status calculation
 */

export type TestCaseStatus = 'pass' | 'fail' | 'partial' | 'not_executed' | 'blocked'

/**
 * Calculate the overall status of a test case based on its step results
 * Business Logic:
 * - If ANY step fails -> Test case status = FAIL
 * - If ALL steps pass -> Test case status = PASS
 * - If no steps executed -> Test case status = NOT_EXECUTED
 * - If any step blocked -> Test case status = BLOCKED
 * - If mixed results (some pass, some skip, no fails) -> Test case status = PARTIAL
 */
export function calculateTestCaseStatus(stepResults: TestStepResult[]): TestCaseStatus {
  if (stepResults.length === 0) {
    return 'not_executed'
  }

  const hasFailures = stepResults.some(step => step.status === 'fail')
  const hasBlocked = stepResults.some(step => step.status === 'blocked')
  const hasExecuted = stepResults.some(step => step.status === 'pass' || step.status === 'fail')
  
  // Priority order: fail > blocked > not_executed > partial > pass
  if (hasFailures) {
    return 'fail'
  }
  
  if (hasBlocked) {
    return 'blocked'
  }
  
  if (!hasExecuted) {
    return 'not_executed'
  }
  
  const allPassedOrSkipped = stepResults.every(step => 
    step.status === 'pass' || step.status === 'skip'
  )
  
  return allPassedOrSkipped ? 'pass' : 'partial'
}

/**
 * Get the reason why a test case failed
 */
export function getTestCaseFailureReason(stepResults: TestStepResult[]): string | null {
  const failedSteps = stepResults.filter(step => step.status === 'fail')
  
  if (failedSteps.length === 0) {
    return null
  }
  
  if (failedSteps.length === 1) {
    return `Step ${failedSteps[0].stepId} failed: ${failedSteps[0].notes || 'No details provided'}`
  }
  
  return `${failedSteps.length} steps failed: ${failedSteps.map(s => s.stepId).join(', ')}`
}

/**
 * Calculate pass rate for a test run
 */
export function calculatePassRate(testResults: TestResult[]): number {
  if (testResults.length === 0) {
    return 0
  }
  
  const passedTests = testResults.filter(result => 
    calculateTestCaseStatus(result.steps) === 'pass'
  ).length
  
  return Math.round((passedTests / testResults.length) * 100)
}

/**
 * Get summary statistics for test execution
 */
export function getTestExecutionSummary(testResults: TestResult[]) {
  const summary = {
    total: testResults.length,
    passed: 0,
    failed: 0,
    blocked: 0,
    notExecuted: 0,
    partial: 0,
    passRate: 0
  }
  
  testResults.forEach(result => {
    const status = calculateTestCaseStatus(result.steps)
    switch (status) {
      case 'pass':
        summary.passed++
        break
      case 'fail':
        summary.failed++
        break
      case 'blocked':
        summary.blocked++
        break
      case 'not_executed':
        summary.notExecuted++
        break
      case 'partial':
        summary.partial++
        break
    }
  })
  
  summary.passRate = calculatePassRate(testResults)
  
  return summary
}

/**
 * Validate if a test case result is complete and ready for submission
 */
export function isTestCaseExecutionComplete(stepResults: TestStepResult[]): boolean {
  return stepResults.every(step => 
    step.status !== undefined && 
    ['pass', 'fail', 'skip', 'blocked'].includes(step.status)
  )
}

/**
 * Get the next step to execute in a test case
 */
export function getNextStepToExecute(stepResults: TestStepResult[]): string | null {
  const nextStep = stepResults.find(step => 
    !step.status || 
    !['pass', 'fail', 'skip', 'blocked'].includes(step.status)
  )
  
  return nextStep ? nextStep.stepId : null
}