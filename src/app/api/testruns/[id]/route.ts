import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // For test runs, we need to search through all test run files
    const allTestRuns = await FileUtils.getAllTestRuns()
    const testRun = allTestRuns.find(run => run.id === id)
    
    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(testRun)
  } catch (error) {
    console.error('Error fetching test run:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test run' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedTestRun = await request.json()
    
    // Ensure the ID matches the URL parameter
    if (updatedTestRun.id !== params.id) {
      return NextResponse.json(
        { error: 'Test run ID mismatch' },
        { status: 400 }
      )
    }
    
    // Check if test run exists
    const allTestRuns = await FileUtils.getAllTestRuns()
    const existingRun = allTestRuns.find(run => run.id === params.id)
    if (!existingRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      )
    }
    
    // Update the test run
    await FileUtils.saveTestRun(updatedTestRun)
    
    return NextResponse.json({
      message: 'Test run updated successfully',
      testRun: updatedTestRun
    })
  } catch (error) {
    console.error('Error updating test run:', error)
    return NextResponse.json(
      { error: 'Failed to update test run' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For test runs, we need to find and delete the specific file
    // This is more complex since FileUtils doesn't have a deleteTestRun method yet
    // We'll implement this if needed
    
    return NextResponse.json(
      { error: 'Delete operation not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error deleting test run:', error)
    return NextResponse.json(
      { error: 'Failed to delete test run' },
      { status: 500 }
    )
  }
}