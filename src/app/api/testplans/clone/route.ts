import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'
import { TestPlan } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, sourceId, testCases } = body

    if (!name || !sourceId) {
      return NextResponse.json(
        { error: 'Name and source ID are required' },
        { status: 400 }
      )
    }

    // Load the source test plan to verify it exists
    const sourceTestPlan = await FileUtils.loadTestPlan(sourceId)
    if (!sourceTestPlan) {
      return NextResponse.json(
        { error: 'Source test plan not found' },
        { status: 404 }
      )
    }

    // Create the cloned test plan
    const clonedTestPlan: TestPlan = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || sourceTestPlan.description,
      testCases: testCases || sourceTestPlan.testCases,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'clone-system', // In a real app, this would be the authenticated user
      targetDate: '', // User can set this later
      // Add clone metadata
      clonedFrom: sourceId,
      clonedAt: new Date().toISOString()
    }

    // Save the cloned test plan
    await FileUtils.saveTestPlan(clonedTestPlan)

    // Return the created test plan
    return NextResponse.json({
      success: true,
      id: clonedTestPlan.id,
      testPlan: clonedTestPlan,
      message: `Test plan "${name}" cloned successfully from "${sourceTestPlan.name}"`
    })

  } catch (error) {
    console.error('Clone test plan API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}