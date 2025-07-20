import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const exportFormat = searchParams.get('format') || 'csv'
    const dateRange = searchParams.get('dateRange') || 'all'
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const includeSteps = searchParams.get('includeSteps') === 'true'
    const includeNotes = searchParams.get('includeNotes') === 'true'
    const statusFilter = searchParams.get('status')?.split(',').filter(Boolean) || []
    const priorityFilter = searchParams.get('priority')?.split(',').filter(Boolean) || []

    // Load test results and test cases
    const [testResults, testCases] = await Promise.all([
      FileUtils.loadAllTestResults(),
      FileUtils.loadAllTestCases()
    ])

    // Create a map for quick test case lookup
    const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]))

    // Filter results based on criteria
    let filteredResults = testResults

    // Date range filtering
    if (dateRange !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (dateRange) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      filteredResults = filteredResults.filter(result => 
        new Date(result.executionDate) >= cutoffDate
      )
    }

    // Status filtering
    if (statusFilter.length > 0) {
      filteredResults = filteredResults.filter(result => 
        statusFilter.includes(result.status)
      )
    }

    // Priority filtering (requires test case lookup)
    if (priorityFilter.length > 0) {
      filteredResults = filteredResults.filter(result => {
        const testCase = testCaseMap.get(result.testCaseId)
        return testCase && priorityFilter.includes(testCase.priority)
      })
    }

    // Generate export content based on format
    if (exportFormat === 'csv') {
      return generateCSVExport(filteredResults, testCaseMap, {
        includeDetails,
        includeSteps,
        includeNotes
      })
    } else if (exportFormat === 'json') {
      return generateJSONExport(filteredResults, testCaseMap, {
        includeDetails,
        includeSteps,
        includeNotes
      })
    } else if (exportFormat === 'pdf') {
      // For now, return JSON with PDF placeholder
      return NextResponse.json(
        { error: 'PDF export not yet implemented' },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid export format' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateCSVExport(results: any[], testCaseMap: Map<string, any>, options: any) {
  const headers = [
    'Test Case ID',
    'Test Case Title',
    'Priority',
    'Execution Date',
    'Status',
    'Duration (ms)',
    'Executed By'
  ]

  if (options.includeDetails) {
    headers.push('Description', 'Preconditions')
  }

  if (options.includeSteps) {
    headers.push('Steps Passed', 'Steps Failed', 'Steps Blocked', 'Steps Skipped')
  }

  if (options.includeNotes) {
    headers.push('Notes')
  }

  const csvRows = [headers.join(',')]

  results.forEach(result => {
    const testCase = testCaseMap.get(result.testCaseId)
    const row = [
      result.testCaseId,
      `"${testCase?.title || 'Unknown'}"`,
      testCase?.priority || 'unknown',
      new Date(result.executionDate).toISOString(),
      result.status,
      result.duration || 0,
      result.executedBy || 'unknown'
    ]

    if (options.includeDetails && testCase) {
      row.push(
        `"${testCase.description || ''}"`,
        `"${testCase.preconditions || ''}"`
      )
    }

    if (options.includeSteps && result.stepResults) {
      const stepStats = {
        passed: result.stepResults.filter((s: any) => s.status === 'pass').length,
        failed: result.stepResults.filter((s: any) => s.status === 'fail').length,
        blocked: result.stepResults.filter((s: any) => s.status === 'blocked').length,
        skipped: result.stepResults.filter((s: any) => s.status === 'skipped').length
      }
      row.push(
        stepStats.passed.toString(),
        stepStats.failed.toString(),
        stepStats.blocked.toString(),
        stepStats.skipped.toString()
      )
    }

    if (options.includeNotes) {
      row.push(`"${result.notes || ''}"`)
    }

    csvRows.push(row.join(','))
  })

  const csvContent = csvRows.join('\n')
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="test-results-${timestamp}.csv"`
    }
  })
}

function generateJSONExport(results: any[], testCaseMap: Map<string, any>, options: any) {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalResults: results.length,
    options,
    results: results.map(result => {
      const testCase = testCaseMap.get(result.testCaseId)
      
      const exportResult: any = {
        testCaseId: result.testCaseId,
        testCaseTitle: testCase?.title || 'Unknown',
        priority: testCase?.priority || 'unknown',
        executionDate: result.executionDate,
        status: result.status,
        duration: result.duration,
        executedBy: result.executedBy
      }

      if (options.includeDetails && testCase) {
        exportResult.testCase = {
          description: testCase.description,
          preconditions: testCase.preconditions,
          expectedResult: testCase.expectedResult,
          tags: testCase.tags
        }
      }

      if (options.includeSteps && result.stepResults) {
        exportResult.stepResults = result.stepResults
      }

      if (options.includeNotes) {
        exportResult.notes = result.notes
      }

      return exportResult
    })
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="test-results-${timestamp}.json"`
    }
  })
}