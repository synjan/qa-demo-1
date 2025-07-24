import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
        
        let testCases
        
        if (query || tags.length > 0) {
          testCases = await FileUtils.searchTestCases(query, tags)
        } else {
          testCases = await FileUtils.getAllTestCases()
        }
        
        return NextResponse.json(testCases)
      } catch (error) {
        console.error('Error fetching test cases:', error)
        return NextResponse.json(
          { error: 'Failed to fetch test cases' },
          { status: 500 }
        )
      }
}

export async function POST(request: NextRequest) {
  try {
    const testCase = await request.json()
    console.log('[Save Debug] Validated test case:', JSON.stringify(testCase, null, 2))
        
        await FileUtils.saveTestCase(testCase)
        
        return NextResponse.json({ 
          message: 'Test case saved successfully',
          testCase 
        })
      } catch (error) {
        console.error('Error saving test case:', error)
        return NextResponse.json(
          { error: 'Failed to save test case', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
}