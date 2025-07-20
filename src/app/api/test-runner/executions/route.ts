import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

interface StepResult {
  stepId: string
  status: 'pass' | 'fail' | 'blocked' | 'skipped' | 'pending'
  notes: string
  actualResult: string
  timestamp: string
}

interface TestExecution {
  id?: string
  testCaseId: string
  executedBy: string
  startedAt: string
  completedAt?: string
  status: 'in_progress' | 'completed' | 'aborted'
  overallResult: 'pass' | 'fail' | 'blocked' | 'skipped' | 'pending'
  stepResults: StepResult[]
  notes: string
}

const executionsDir = path.join(process.cwd(), 'test-executions')

export async function POST(request: NextRequest) {
  try {
    const execution: TestExecution = await request.json()
    
    // Ensure executions directory exists
    await fs.mkdir(executionsDir, { recursive: true })
    
    // Generate execution ID if not provided
    if (!execution.id) {
      execution.id = uuidv4()
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `execution-${execution.id}-${timestamp}.json`
    const filePath = path.join(executionsDir, filename)
    
    // Add metadata
    const executionWithMetadata = {
      ...execution,
      savedAt: new Date().toISOString(),
      source: 'test-runner'
    }
    
    // Save execution to file
    await fs.writeFile(filePath, JSON.stringify(executionWithMetadata, null, 2), 'utf-8')
    
    // Log the execution for audit trail
    await logExecution(execution)
    
    return NextResponse.json({
      success: true,
      executionId: execution.id,
      message: 'Test execution saved successfully'
    })
    
  } catch (error) {
    console.error('Test execution save error:', error)
    return NextResponse.json(
      { error: 'Failed to save test execution' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const executedBy = url.searchParams.get('executedBy')
    const testCaseId = url.searchParams.get('testCaseId')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    // Ensure executions directory exists
    await fs.mkdir(executionsDir, { recursive: true })
    
    // Read all execution files
    const files = await fs.readdir(executionsDir)
    const executionFiles = files.filter(file => file.startsWith('execution-') && file.endsWith('.json'))
    
    const executions: (TestExecution & { id: string; savedAt: string })[] = []
    
    for (const file of executionFiles) {
      try {
        const filePath = path.join(executionsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const execution = JSON.parse(content)
        executions.push(execution)
      } catch (error) {
        console.warn(`Failed to parse execution file ${file}:`, error)
      }
    }
    
    // Filter executions based on query parameters
    let filteredExecutions = executions
    
    if (executedBy) {
      filteredExecutions = filteredExecutions.filter(exec => 
        exec.executedBy.toLowerCase().includes(executedBy.toLowerCase())
      )
    }
    
    if (testCaseId) {
      filteredExecutions = filteredExecutions.filter(exec => 
        exec.testCaseId === testCaseId
      )
    }
    
    if (status) {
      filteredExecutions = filteredExecutions.filter(exec => 
        exec.status === status
      )
    }
    
    // Sort by most recent first
    filteredExecutions.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
    
    // Apply limit
    const limitedExecutions = filteredExecutions.slice(0, limit)
    
    return NextResponse.json({
      executions: limitedExecutions,
      total: filteredExecutions.length,
      showing: limitedExecutions.length
    })
    
  } catch (error) {
    console.error('Test execution fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test executions' },
      { status: 500 }
    )
  }
}

// Helper function to log execution for audit trail
async function logExecution(execution: TestExecution) {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    await fs.mkdir(logsDir, { recursive: true })
    
    const logFile = path.join(logsDir, 'test-executions.log')
    const logEntry = {
      timestamp: new Date().toISOString(),
      executionId: execution.id,
      testCaseId: execution.testCaseId,
      executedBy: execution.executedBy,
      status: execution.status,
      overallResult: execution.overallResult,
      stepCount: execution.stepResults.length,
      completedSteps: execution.stepResults.filter(step => step.status !== 'pending').length
    }
    
    const logLine = JSON.stringify(logEntry) + '\n'
    await fs.appendFile(logFile, logLine, 'utf-8')
  } catch (error) {
    console.error('Failed to log execution:', error)
    // Don't throw - logging failure shouldn't break the main functionality
  }
}