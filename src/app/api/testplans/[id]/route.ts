import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testPlan = await FileUtils.loadTestPlan(id)
    
    if (!testPlan) {
      return NextResponse.json(
        { error: 'Test plan not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(testPlan)
  } catch (error) {
    console.error('Error fetching test plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test plan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedTestPlan = await request.json()
    
    // Ensure the ID matches the URL parameter
    if (updatedTestPlan.id !== params.id) {
      return NextResponse.json(
        { error: 'Test plan ID mismatch' },
        { status: 400 }
      )
    }
    
    // Check if test plan exists
    const existingTestPlan = await FileUtils.loadTestPlan(params.id)
    if (!existingTestPlan) {
      return NextResponse.json(
        { error: 'Test plan not found' },
        { status: 404 }
      )
    }
    
    // Update the updatedAt timestamp
    updatedTestPlan.updatedAt = new Date().toISOString()
    
    await FileUtils.saveTestPlan(updatedTestPlan)
    
    return NextResponse.json({
      message: 'Test plan updated successfully',
      testPlan: updatedTestPlan
    })
  } catch (error) {
    console.error('Error updating test plan:', error)
    return NextResponse.json(
      { error: 'Failed to update test plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await FileUtils.deleteTestPlan(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Test plan not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Test plan deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting test plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete test plan' },
      { status: 500 }
    )
  }
}