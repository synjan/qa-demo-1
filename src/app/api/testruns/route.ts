import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testPlanId = searchParams.get('testPlanId')
    
    let testRuns
    
    if (testPlanId) {
      const allTestRuns = await FileUtils.getAllTestRuns()
      testRuns = allTestRuns.filter(run => run.testPlanId === testPlanId)
    } else {
      testRuns = await FileUtils.getAllTestRuns()
    }
    
    return NextResponse.json(testRuns)
  } catch (error) {
    console.error('Error fetching test runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test runs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const testRun = await request.json()
    
    // Basic validation
    if (!testRun.id || !testRun.testPlanId || !testRun.name || !testRun.executedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: id, testPlanId, name, executedBy' },
        { status: 400 }
      )
    }
    
    await FileUtils.saveTestRun(testRun)
    
    return NextResponse.json({ 
      message: 'Test run saved successfully',
      testRun 
    })
  } catch (error) {
    console.error('Error saving test run:', error)
    return NextResponse.json(
      { error: 'Failed to save test run' },
      { status: 500 }
    )
  }
}