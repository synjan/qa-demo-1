import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    let testPlans
    
    if (query) {
      const allTestPlans = await FileUtils.getAllTestPlans()
      testPlans = allTestPlans.filter(plan =>
        plan.name.toLowerCase().includes(query.toLowerCase()) ||
        plan.description.toLowerCase().includes(query.toLowerCase())
      )
    } else {
      testPlans = await FileUtils.getAllTestPlans()
    }
    
    return NextResponse.json(testPlans)
  } catch (error) {
    console.error('Error fetching test plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const testPlan = await request.json()
    
    // Basic validation
    if (!testPlan.id || !testPlan.name || !Array.isArray(testPlan.testCases)) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, testCases' },
        { status: 400 }
      )
    }
    
    await FileUtils.saveTestPlan(testPlan)
    
    return NextResponse.json({ 
      message: 'Test plan saved successfully',
      testPlan 
    })
  } catch (error) {
    console.error('Error saving test plan:', error)
    return NextResponse.json(
      { error: 'Failed to save test plan' },
      { status: 500 }
    )
  }
}