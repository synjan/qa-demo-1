import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai'
import { GitHubService } from '@/lib/github'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { issueNumbers, repository, owner } = body

    // Get GitHub token
    let token: string | null = null
    if (session?.accessToken) {
      token = session.accessToken as string
    } else {
      token = request.headers.get('Authorization')?.replace('Bearer ', '') || null
    }
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
    }

    const github = GitHubService.createFromToken(token)
    const openai = OpenAIService.createInstance()
    
    const username = session?.user?.name || 'Unknown User'
    const generatedTestCases = []

    // Generate test cases for each issue
    for (const issueNumber of issueNumbers) {
      try {
        const issue = await github.getIssue(owner, repository, issueNumber)
        const testCase = await openai.generateTestCase(issue, `${owner}/${repository}`, username)
        
        // Save test case as markdown file
        const filename = `${testCase.id}.md`
        const testCasePath = path.join(process.cwd(), 'testcases', filename)
        
        const frontmatter = {
          id: testCase.id,
          title: testCase.title,
          description: testCase.description,
          preconditions: testCase.preconditions,
          expectedResult: testCase.expectedResult,
          priority: testCase.priority,
          tags: testCase.tags,
          githubIssue: testCase.githubIssue,
          createdAt: testCase.createdAt,
          updatedAt: testCase.updatedAt,
          createdBy: testCase.createdBy
        }

        // Create markdown content with test steps
        let markdownContent = `# ${testCase.title}\n\n`
        markdownContent += `${testCase.description}\n\n`
        
        if (testCase.preconditions) {
          markdownContent += `## Preconditions\n\n${testCase.preconditions}\n\n`
        }
        
        markdownContent += `## Test Steps\n\n`
        testCase.steps.forEach((step, index) => {
          markdownContent += `### Step ${index + 1}\n\n`
          markdownContent += `**Action:** ${step.action}\n\n`
          markdownContent += `**Expected Result:** ${step.expectedResult}\n\n`
        })
        
        markdownContent += `## Expected Final Result\n\n${testCase.expectedResult}\n`
        
        const fileContent = matter.stringify(markdownContent, frontmatter)
        
        await fs.writeFile(testCasePath, fileContent, 'utf-8')
        generatedTestCases.push(testCase)
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate test case for issue #${issueNumber}:`, error)
      }
    }

        return NextResponse.json({ 
          message: `Generated ${generatedTestCases.length} test cases`,
          testCases: generatedTestCases 
        })
      } catch (error) {
        console.error('Error generating test cases:', error)
        return NextResponse.json({ error: 'Failed to generate test cases' }, { status: 500 })
      }
}