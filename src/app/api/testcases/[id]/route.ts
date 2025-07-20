import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testCase = await FileUtils.loadTestCase(id)
    
    if (!testCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(testCase)
  } catch (error) {
    console.error('Error fetching test case:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test case' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedTestCase = await request.json()
    
    // Ensure the ID matches the URL parameter
    if (updatedTestCase.id !== params.id) {
      return NextResponse.json(
        { error: 'Test case ID mismatch' },
        { status: 400 }
      )
    }
    
    // Check if test case exists
    const existingTestCase = await FileUtils.loadTestCase(params.id)
    if (!existingTestCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }
    
    // Update the updatedAt timestamp
    updatedTestCase.updatedAt = new Date().toISOString()
    
    await FileUtils.saveTestCase(updatedTestCase)
    
    return NextResponse.json({
      message: 'Test case updated successfully',
      testCase: updatedTestCase
    })
  } catch (error) {
    console.error('Error updating test case:', error)
    return NextResponse.json(
      { error: 'Failed to update test case' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await FileUtils.deleteTestCase(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Test case deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting test case:', error)
    return NextResponse.json(
      { error: 'Failed to delete test case' },
      { status: 500 }
    )
  }
}