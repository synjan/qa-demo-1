import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(request: NextRequest) {
  try {
    // Load all test data
    const [testCases, testRuns] = await Promise.all([
      FileUtils.getAllTestCases(),
      FileUtils.getAllTestRuns()
    ])

    // Calculate execution statistics
    let executedTests = 0
    let passedTests = 0
    let failedTests = 0
    let blockedTests = 0

    // Track which test cases have been executed
    const executedTestCases = new Set<string>()

    testRuns.forEach(run => {
      run.results.forEach(result => {
        executedTestCases.add(result.testCaseId)
        executedTests++
        
        switch (result.status) {
          case 'pass':
            passedTests++
            break
          case 'fail':
            failedTests++
            break
          case 'blocked':
            blockedTests++
            break
        }
      })
    })

    const stats = {
      totalTests: testCases.length,
      executed: executedTestCases.size,
      passed: passedTests,
      failed: failedTests,
      blocked: blockedTests,
      executionRuns: testRuns.length,
      // Additional metrics for guest dashboard
      avgExecutionTime: calculateAverageExecutionTime(testRuns),
      recentActivity: getRecentActivityCount(testRuns, 7), // Last 7 days
      topPriorityTests: getTopPriorityTestsCount(testCases),
      completionRate: testCases.length > 0 ? (executedTestCases.size / testCases.length) * 100 : 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Test runner stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to load test statistics' },
      { status: 500 }
    )
  }
}

function calculateAverageExecutionTime(testRuns: any[]): number {
  if (testRuns.length === 0) return 0
  
  const totalTime = testRuns.reduce((acc, run) => {
    const startTime = new Date(run.startedAt).getTime()
    const endTime = run.completedAt ? new Date(run.completedAt).getTime() : startTime
    return acc + (endTime - startTime)
  }, 0)
  
  return Math.round(totalTime / testRuns.length / 1000) // Convert to seconds
}

function getRecentActivityCount(testRuns: any[], days: number): number {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return testRuns.filter(run => 
    new Date(run.startedAt) >= cutoffDate
  ).length
}

function getTopPriorityTestsCount(testCases: any[]): { critical: number; high: number; medium: number; low: number } {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  
  testCases.forEach(testCase => {
    if (testCase.priority in counts) {
      counts[testCase.priority as keyof typeof counts]++
    }
  })
  
  return counts
}