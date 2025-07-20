import { NextRequest, NextResponse } from 'next/server'
import { FileUtils } from '@/lib/file-utils'
import { TestCase } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const testCases: TestCase[] = []
    const errors: string[] = []
    let importedCount = 0
    let failedCount = 0

    try {
      if (file.name.endsWith('.csv')) {
        // Parse CSV format
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        // Check for required headers
        const requiredHeaders = ['title', 'description']
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingHeaders.length > 0) {
          errors.push(`Missing required headers: ${missingHeaders.join(', ')}`)
          return NextResponse.json({
            success: false,
            imported: 0,
            failed: lines.length - 1,
            errors,
            testCases: []
          })
        }

        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(v => v.trim())
            const row: Record<string, string> = {}
            
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })

            if (!row.title || !row.description) {
              errors.push(`Row ${i}: Missing title or description`)
              failedCount++
              continue
            }

            // Parse steps if provided
            let steps = []
            if (row.steps) {
              try {
                // Try to parse as JSON array
                steps = JSON.parse(row.steps)
              } catch {
                // If not JSON, treat as simple text and create a single step
                steps = [{
                  action: row.steps,
                  expectedResult: 'Expected outcome'
                }]
              }
            } else {
              // Default step
              steps = [{
                action: 'Execute the test',
                expectedResult: 'Test passes successfully'
              }]
            }

            const testCase: TestCase = {
              id: uuidv4(),
              title: row.title,
              description: row.description,
              priority: (row.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low',
              preconditions: row.preconditions || '',
              expectedResult: row.expectedresult || 'Test should complete successfully',
              steps,
              tags: row.tags ? row.tags.split(';').map((t: string) => t.trim()) : [],
              githubIssue: row.githubissue || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'import-system'
            }

            await FileUtils.saveTestCase(testCase)
            testCases.push(testCase)
            importedCount++

          } catch (error) {
            errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Parse error'}`)
            failedCount++
          }
        }

      } else if (file.name.endsWith('.json')) {
        // Parse JSON format
        const jsonData = JSON.parse(text)
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]

        for (let i = 0; i < dataArray.length; i++) {
          try {
            const item = dataArray[i]

            if (!item.title || !item.description) {
              errors.push(`Item ${i + 1}: Missing title or description`)
              failedCount++
              continue
            }

            const testCase: TestCase = {
              id: item.id || uuidv4(),
              title: item.title,
              description: item.description,
              priority: item.priority || 'medium',
              preconditions: item.preconditions || '',
              expectedResult: item.expectedResult || 'Test should complete successfully',
              steps: item.steps || [{
                action: 'Execute the test',
                expectedResult: 'Test passes successfully'
              }],
              tags: item.tags || [],
              githubIssue: item.githubIssue || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'import-system'
            }

            await FileUtils.saveTestCase(testCase)
            testCases.push(testCase)
            importedCount++

          } catch (error) {
            errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
            failedCount++
          }
        }

      } else {
        return NextResponse.json(
          { error: 'Unsupported file format. Only CSV and JSON are supported.' },
          { status: 400 }
        )
      }

    } catch (error) {
      return NextResponse.json(
        { error: `File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: importedCount > 0,
      imported: importedCount,
      failed: failedCount,
      errors,
      testCases: testCases.map(tc => ({
        id: tc.id,
        title: tc.title,
        priority: tc.priority
      }))
    })

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}