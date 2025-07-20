import OpenAI from 'openai'
import { TestCase, TestStep, GitHubIssue } from './types'
import { v4 as uuidv4 } from 'uuid'

export class OpenAIService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async generateTestCase(issue: GitHubIssue, repository: string, username: string): Promise<TestCase> {
    const prompt = this.createTestCasePrompt(issue)
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a QA expert that creates comprehensive manual test cases for software features. 
            Generate structured test cases that are clear, actionable, and thorough.
            Return your response as valid JSON matching this exact structure:
            {
              "title": "string",
              "description": "string", 
              "preconditions": "string",
              "steps": [
                {
                  "stepNumber": number,
                  "action": "string",
                  "expectedResult": "string"
                }
              ],
              "expectedResult": "string",
              "priority": "low" | "medium" | "high" | "critical",
              "tags": ["string"]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const generatedData = JSON.parse(response)
      
      // Create full test case object
      const testCase: TestCase = {
        id: uuidv4(),
        title: generatedData.title,
        description: generatedData.description,
        preconditions: generatedData.preconditions,
        steps: generatedData.steps.map((step: any, index: number) => ({
          id: uuidv4(),
          stepNumber: index + 1,
          action: step.action,
          expectedResult: step.expectedResult
        })),
        expectedResult: generatedData.expectedResult,
        priority: generatedData.priority,
        tags: generatedData.tags || [],
        githubIssue: {
          number: issue.number,
          url: issue.html_url,
          repository
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: username
      }

      return testCase
    } catch (error) {
      console.error('Error generating test case:', error)
      throw new Error('Failed to generate test case with AI')
    }
  }

  private createTestCasePrompt(issue: GitHubIssue): string {
    return `
Create a comprehensive manual test case for the following GitHub issue:

**Issue Title:** ${issue.title}

**Issue Description:**
${issue.body || 'No description provided'}

**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'None'}

**Issue URL:** ${issue.html_url}

Please generate a detailed manual test case that covers:
1. Clear preconditions and setup steps
2. Step-by-step testing procedures 
3. Expected results for each step
4. Overall expected outcome
5. Appropriate priority level based on the issue
6. Relevant tags for categorization

Focus on creating actionable test steps that a manual tester can follow to verify the feature or bug fix described in the issue. Include edge cases and negative testing scenarios where appropriate.

Consider the issue type (bug, feature, enhancement) when determining test coverage and priority.
    `.trim()
  }

  async generateTestCasesFromMultipleIssues(issues: GitHubIssue[], repository: string, username: string): Promise<TestCase[]> {
    const testCases: TestCase[] = []
    
    for (const issue of issues) {
      try {
        const testCase = await this.generateTestCase(issue, repository, username)
        testCases.push(testCase)
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate test case for issue #${issue.number}:`, error)
        // Continue with other issues even if one fails
      }
    }
    
    return testCases
  }

  static createInstance(): OpenAIService {
    return new OpenAIService()
  }
}