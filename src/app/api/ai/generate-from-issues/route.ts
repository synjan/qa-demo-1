import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { OpenAIService } from '@/lib/openai'

interface IssueData {
  number: number
  title: string
  body?: string
  labels: string[]
  repository: string
}

interface GenerationOptions {
  templateId?: string
  language?: string
  temperature?: number
  maxTokens?: number
  testCount?: number
}

interface RequestBody {
  issues: IssueData[]
  repository: string
  options?: GenerationOptions
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body: RequestBody = await request.json()
    const { issues, repository, options = {} } = body

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: 'Issues array is required and must contain at least one issue' },
        { status: 400 }
      )
    }

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      )
    }

    // Get username for test case creation
    const username = session?.user?.email || 'anonymous'

    // Initialize OpenAI service
    const openaiService = new OpenAIService()

    // Create rich text context from GitHub issues
    const issuesContext = issues.map(issue => {
      const labelsText = issue.labels.length > 0 ? `\n**Labels:** ${issue.labels.join(', ')}` : ''
      const bodyText = issue.body ? `\n\n**Description:**\n${issue.body}` : '\n\n**Description:** No description provided'
      
      return `## GitHub Issue #${issue.number}: ${issue.title}
**Repository:** ${repository}${labelsText}${bodyText}

---`
    }).join('\n\n')

    // Create comprehensive text context for AI generation
    const textContext = `# Test Case Generation from GitHub Issues

**Repository:** ${repository}
**Total Issues:** ${issues.length}
**Requested Test Cases:** ${options.testCount || 5} per issue

## Issues to Analyze:

${issuesContext}

## Generation Instructions:

Please analyze the above GitHub issues and generate comprehensive test cases that cover:
- Main functionality described in each issue
- Edge cases and error scenarios
- Integration points mentioned in the issues
- User experience flows
- Data validation and boundary conditions

Generate ${options.testCount || 5} test cases that thoroughly test the requirements described in these GitHub issues. Each test case should be specific, actionable, and suitable for manual execution by QA testers.

Focus on creating test cases that validate the functionality, requirements, or bug fixes described in the GitHub issues above.`

    console.log('[Generate from Issues] Processing issues:', issues.length)
    console.log('[Generate from Issues] Repository:', repository)
    console.log('[Generate from Issues] Username:', username)
    console.log('[Generate from Issues] Options:', options)
    console.log('[Generate from Issues] Using text-based generation for testCount support')

    // Use the text generation method which properly supports testCount
    const testCases = await openaiService.generateFromFreeText(
      textContext,
      username,
      options
    )

    console.log('[Generate from Issues] Generated test cases:', testCases.length)

    // Return in the same format as the text generation endpoint
    return NextResponse.json({ testCases })
  } catch (error) {
    console.error('[Generate from Issues] Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate test cases: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating test cases' },
      { status: 500 }
    )
  }
}