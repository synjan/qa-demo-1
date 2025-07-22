import OpenAI from 'openai'
import { TestCase, TestStep, GitHubIssue } from './types'
import { v4 as uuidv4 } from 'uuid'
import { PromptTemplateService, Language } from './prompt-templates'

export class OpenAIService {
  private openai: OpenAI
  private templateService: PromptTemplateService

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.templateService = PromptTemplateService.getInstance()
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

  async generateFromFreeText(
    text: string, 
    username: string, 
    options?: {
      templateId?: string,
      language?: Language,
      temperature?: number,
      maxTokens?: number,
      testCount?: number
    }
  ): Promise<TestCase[]> {
    const templateId = options?.templateId || 'default'
    const language = options?.language || 'en'
    const temperature = options?.temperature || 0.7
    let maxTokens = options?.maxTokens || 3000
    const testCount = options?.testCount || 5

    // Retry logic with increasingly strict prompts
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const template = this.templateService.getTemplate(templateId)
        if (!template) {
          throw new Error(`Template "${templateId}" not found`)
        }

        // Get base prompts
        const systemPrompt = template.systemPrompt[language]
        
        // Create increasingly strict JSON reminders based on attempt number
        let jsonReminder = ''
        let strictness = ''
        
        if (attempt === 0) {
          jsonReminder = language === 'no' ? 
            'PÅMINNELSE: Svar kun med gyldig JSON-array. Ingen tekst utenfor JSON.' :
            'REMINDER: Respond only with valid JSON array. No text outside JSON.'
        } else if (attempt === 1) {
          jsonReminder = language === 'no' ?
            'KRITISK: Du har feilet tidligere. Svar KUN med JSON. Start med [ og slutt med ]. Ingen annen tekst.' :
            'CRITICAL: You failed before. Respond ONLY with JSON. Start with [ and end with ]. No other text.'
          strictness = ' (RETRY - JSON ONLY)'
        } else {
          jsonReminder = language === 'no' ?
            'SISTE SJANSE: Systemet krasjer hvis du ikke svarer med ren JSON. KUN [ ... ]. INGEN ANNEN TEKST.' :
            'FINAL ATTEMPT: System crashes if you don\'t respond with pure JSON. ONLY [ ... ]. NO OTHER TEXT.'
          strictness = ' (FINAL RETRY - PURE JSON OR SYSTEM FAILURE)'
        }
        
        const userPrompt = `${template.userPromptPrefix[language]}\n\n"${text}"\n\nGenerate ${testCount} test cases that focus on: ${template.focusAreas.join(', ')}.\n\n${jsonReminder}\n\nRESPOND ONLY IN JSON FORMAT - START WITH [ AND END WITH ]${strictness}`

        // Log API parameters for debugging
        const apiParams = {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: Math.max(0.1, Math.min(temperature, 0.3) - (attempt * 0.1)), // Lower temperature each retry
          max_tokens: maxTokens,
          // Removed stop sequences that might cause early termination
        }
        
        console.log(`[OpenAI API] Attempt ${attempt + 1} - Request params:`, {
          model: apiParams.model,
          temperature: apiParams.temperature,
          max_tokens: apiParams.max_tokens,
          userPromptLength: userPrompt.length,
          systemPromptLength: systemPrompt.length
        })
        
        const completion = await this.openai.chat.completions.create(apiParams)

        const response = completion.choices[0]?.message?.content
        const usage = completion.usage
        
        console.log(`[OpenAI API] Response metadata:`, {
          finishReason: completion.choices[0]?.finish_reason,
          totalTokens: usage?.total_tokens,
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens
        })
        
        if (!response) {
          throw new Error('No response from OpenAI')
        }

        console.log(`Attempt ${attempt + 1} - Raw OpenAI response:`, response)
        console.log('Response length:', response.length)
        
        // Check for suspiciously short responses
        if (response.length < 100) {
          console.error(`Response too short (${response.length} chars). This might indicate truncation.`)
          if (attempt < maxRetries - 1) {
            lastError = new Error(`Response truncated at ${response.length} characters`)
            console.log(`Retrying due to short response (attempt ${attempt + 2}/${maxRetries})`)
            continue
          }
        }

        // Extract JSON from the response (handle markdown code blocks)
        const cleanedResponse = this.extractJsonFromResponse(response)
        console.log('Cleaned response preview:', cleanedResponse.substring(0, 300))

        // Pre-validate JSON format before parsing
        const jsonValidation = this.validateJsonFormat(cleanedResponse)
        if (!jsonValidation.isValid) {
          console.error(`Attempt ${attempt + 1} JSON format validation failed:`, jsonValidation.error)
          console.error('Invalid JSON preview:', cleanedResponse.substring(0, 200))
          
          if (attempt < maxRetries - 1) {
            lastError = new Error(`JSON format invalid: ${jsonValidation.error}`)
            console.log(`Retrying with stricter prompt (attempt ${attempt + 2}/${maxRetries})`)
            continue
          }
        }

        let generatedData
        try {
          generatedData = JSON.parse(cleanedResponse)
          
          // Validate that it's an array
          if (!Array.isArray(generatedData)) {
            throw new Error('Response is not a JSON array')
          }
          
          console.log(`Success on attempt ${attempt + 1}`)
          
        } catch (jsonError) {
          console.error(`Attempt ${attempt + 1} JSON parsing failed:`, jsonError)
          console.error('Attempted to parse:', cleanedResponse.substring(0, 200))
          
          // Store error and try fallback conversion if this is not the last attempt
          lastError = new Error(`Attempt ${attempt + 1}: ${jsonError.message}. Response preview: ${cleanedResponse.substring(0, 100)}...`)
          
          if (attempt < maxRetries - 1) {
            console.log(`Retrying with stricter prompt (attempt ${attempt + 2}/${maxRetries})`)
            continue // Try again with stricter prompt
          } else {
            // Last attempt - try fallback conversion
            console.log('Final attempt failed, trying fallback text-to-JSON conversion')
            generatedData = this.attemptTextToJsonConversion(cleanedResponse)
            if (!generatedData) {
              throw lastError // Re-throw the JSON parsing error if fallback fails
            }
          }
        }
        
        // Convert to full TestCase objects - handle different AI response formats
        const testCases: TestCase[] = generatedData.map((testData: any) => {
          // Map different field names that AI might use
          const title = testData.title || testData.testCaseID || testData.name || 'Generated Test Case'
          const description = testData.description || ''
          const preconditions = testData.preconditions || ''
          
          // Handle different step formats with improved debugging
          let steps = []
          console.log('Processing testData.steps:', testData.steps, 'Type:', typeof testData.steps)
          
          if (Array.isArray(testData.steps) && testData.steps.length > 0) {
            console.log('Steps is array with length:', testData.steps.length, 'First item type:', typeof testData.steps[0])
            
            if (typeof testData.steps[0] === 'string') {
              // AI returned steps as string array - convert to proper format
              console.log('Converting string array steps')
              steps = testData.steps.map((stepText: string, index: number) => ({
                id: uuidv4(),
                stepNumber: index + 1,
                action: stepText.trim(),
                expectedResult: 'Step completes successfully'
              }))
            } else if (testData.steps[0] && typeof testData.steps[0] === 'object') {
              // AI returned steps as object array
              console.log('Converting object array steps')
              steps = testData.steps.map((step: any, index: number) => ({
                id: uuidv4(),
                stepNumber: index + 1,
                action: step.action || step.step || step.description || `Step ${index + 1}`,
                expectedResult: step.expectedResult || step.expected || 'Step completes successfully'
              }))
            }
          }
          
          // If no steps, create a basic step from the description
          if (steps.length === 0) {
            console.log('No steps found, creating default step')
            steps = [{
              id: uuidv4(),
              stepNumber: 1,
              action: description || 'Execute the test scenario',
              expectedResult: testData.expectedResult || 'Test passes successfully'
            }]
          }
          
          console.log('Final processed steps:', steps)
          
          return {
            id: uuidv4(),
            title: title,
            description: description,
            preconditions: preconditions,
            steps: steps,
            expectedResult: testData.expectedResult || 'Test completes successfully',
            priority: testData.priority || 'medium',
            tags: testData.tags || ['ai-generated'],
            githubIssue: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: username
          }
        })

        return testCases
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error in attempt ' + (attempt + 1))
        console.error(`Attempt ${attempt + 1} failed:`, error)
        if (attempt === maxRetries - 1) {
          break // Exit retry loop on final attempt
        }
      }
    }
    
    // If we get here, all retries failed
    console.error('All retry attempts failed')
    throw lastError || new Error('Failed to generate test cases with AI after multiple attempts')
  }

  /**
   * Generate test cases with streaming support
   */
  async generateFromFreeTextStream(
    text: string,
    username: string,
    options?: {
      templateId?: string,
      language?: Language,
      temperature?: number,
      maxTokens?: number,
      testCount?: number
    },
    onChunk?: (chunk: any) => void
  ): Promise<void> {
    const templateId = options?.templateId || 'default'
    const language = options?.language || 'en'
    const temperature = options?.temperature || 0.7
    const maxTokens = options?.maxTokens || 3000
    const testCount = options?.testCount || 5

    try {
      const template = this.templateService.getTemplate(templateId)
      if (!template) {
        throw new Error(`Template "${templateId}" not found`)
      }

      const systemPrompt = template.systemPrompt[language]
      const languageInstruction = language === 'no' ? 
        'PÅMINNELSE: Svar kun med gyldig JSON-array. Ingen tekst utenfor JSON.' :
        'REMINDER: Respond only with valid JSON array. No text outside JSON.'
        
      const userPrompt = `${template.userPromptPrefix[language]}\n\n"${text}"\n\nGenerate ${testCount} test cases that focus on: ${template.focusAreas.join(', ')}.\n\n${languageInstruction}\n\nRESPOND ONLY IN JSON FORMAT - START WITH [ AND END WITH ]`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: Math.min(temperature, 0.3),
        max_tokens: maxTokens,
        stop: ['```', 'Test Case', 'Note:', '**'],
        stream: true
      })

      let accumulatedContent = ''
      let testCaseBuffer = ''
      let insideArray = false
      let braceDepth = 0
      let testCaseCount = 0

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ''
        accumulatedContent += content
        testCaseBuffer += content

        // Track if we're inside the JSON array
        for (const char of content) {
          if (char === '[' && !insideArray) {
            insideArray = true
            onChunk?.({ type: 'start', message: 'Starting test case generation...' })
          } else if (char === '{') {
            braceDepth++
          } else if (char === '}') {
            braceDepth--
            
            // When we close a test case object
            if (braceDepth === 0 && insideArray) {
              try {
                // Try to parse the accumulated test case
                const match = testCaseBuffer.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/)
                if (match) {
                  const testCaseJson = match[0]
                  const testCaseData = JSON.parse(testCaseJson)
                  
                  // Convert to our format
                  const convertedTestCase = this.convertAIResponseToTestCase(testCaseData, username)
                  
                  testCaseCount++
                  onChunk?.({ 
                    type: 'testcase', 
                    testCase: convertedTestCase,
                    index: testCaseCount
                  })
                  
                  // Clear the buffer for the next test case
                  testCaseBuffer = testCaseBuffer.substring(testCaseBuffer.indexOf(testCaseJson) + testCaseJson.length)
                }
              } catch (error) {
                // Continue if parsing fails for this chunk
                console.warn('Failed to parse streaming chunk:', error)
              }
            }
          }
        }
      }

      onChunk?.({ type: 'complete', totalGenerated: testCaseCount })

    } catch (error) {
      console.error('Error in streaming generation:', error)
      throw error
    }
  }

  /**
   * Convert AI response format to our TestCase format
   */
  private convertAIResponseToTestCase(testData: any, username: string): any {
    const title = testData.title || testData.testCaseID || testData.name || 'Generated Test Case'
    const description = testData.description || ''
    const preconditions = testData.preconditions || ''
    
    // Handle different step formats
    let steps = []
    if (Array.isArray(testData.steps)) {
      if (typeof testData.steps[0] === 'string') {
        steps = testData.steps.map((stepText: string, index: number) => ({
          id: crypto.randomUUID(),
          stepNumber: index + 1,
          action: stepText.trim(),
          expectedResult: 'Step completes successfully'
        }))
      } else if (testData.steps[0] && typeof testData.steps[0] === 'object') {
        steps = testData.steps.map((step: any, index: number) => ({
          id: crypto.randomUUID(),
          stepNumber: index + 1,
          action: step.action || step.step || step.description || `Step ${index + 1}`,
          expectedResult: step.expectedResult || step.expected || 'Step completes successfully'
        }))
      }
    }
    
    if (steps.length === 0) {
      steps = [{
        id: crypto.randomUUID(),
        stepNumber: 1,
        action: description || 'Execute the test scenario',
        expectedResult: testData.expectedResult || 'Test passes successfully'
      }]
    }
    
    return {
      id: crypto.randomUUID(),
      title: title,
      description: description,
      preconditions: preconditions,
      steps: steps,
      expectedResult: testData.expectedResult || 'Test completes successfully',
      priority: testData.priority || 'medium',
      tags: testData.tags || ['ai-generated'],
      githubIssue: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: username
    }
  }

  /**
   * Validate JSON format before attempting to parse
   */
  private validateJsonFormat(jsonString: string): { isValid: boolean; error?: string } {
    try {
      // Basic structural checks
      const trimmed = jsonString.trim()
      
      if (!trimmed) {
        return { isValid: false, error: 'Empty JSON string' }
      }
      
      // Check for basic JSON structure
      const firstChar = trimmed[0]
      const lastChar = trimmed[trimmed.length - 1]
      
      if (firstChar !== '[' && firstChar !== '{') {
        return { isValid: false, error: `JSON must start with [ or {, found: ${firstChar}` }
      }
      
      if ((firstChar === '[' && lastChar !== ']') || (firstChar === '{' && lastChar !== '}')) {
        return { isValid: false, error: `Mismatched brackets: starts with ${firstChar} but ends with ${lastChar}` }
      }
      
      // Check for common JSON issues
      if (trimmed.includes('...') || trimmed.includes('[truncated]') || trimmed.includes('(continued)')) {
        return { isValid: false, error: 'JSON appears to be truncated or incomplete' }
      }
      
      // Check for unterminated strings (common cause of parsing errors)
      let inString = false
      let escapeNext = false
      let stringCount = 0
      
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i]
        
        if (escapeNext) {
          escapeNext = false
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          continue
        }
        
        if (char === '"') {
          inString = !inString
          if (inString) {
            stringCount++
          }
        }
      }
      
      if (inString) {
        return { isValid: false, error: 'Unterminated string detected' }
      }
      
      // Test parse with native JSON to catch other issues
      JSON.parse(trimmed)
      
      return { isValid: true }
      
    } catch (error) {
      return { 
        isValid: false, 
        error: `JSON validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Extract JSON content from AI response, handling various formats
   * including markdown code blocks and extra text
   */
  private extractJsonFromResponse(response: string): string {
    // Remove leading/trailing whitespace
    let cleaned = response.trim()
    
    console.log('[JSON Extraction Debug] Original response length:', response.length)
    console.log('[JSON Extraction Debug] First 200 chars:', response.substring(0, 200))
    
    // Check if response is wrapped in markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
    if (codeBlockMatch) {
      console.log('[JSON Extraction Debug] Found markdown code block')
      return codeBlockMatch[1].trim()
    }
    
    // More robust JSON array extraction - handle nested brackets
    const jsonStart = cleaned.indexOf('[')
    if (jsonStart !== -1) {
      let bracketCount = 0
      let inString = false
      let escapeNext = false
      let jsonEnd = -1
      
      for (let i = jsonStart; i < cleaned.length; i++) {
        const char = cleaned[i]
        
        if (escapeNext) {
          escapeNext = false
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          continue
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString
          continue
        }
        
        if (!inString) {
          if (char === '[') {
            bracketCount++
          } else if (char === ']') {
            bracketCount--
            if (bracketCount === 0) {
              jsonEnd = i
              break
            }
          }
        }
      }
      
      if (jsonEnd !== -1) {
        const extractedJson = cleaned.substring(jsonStart, jsonEnd + 1)
        console.log('[JSON Extraction Debug] Extracted JSON array, length:', extractedJson.length)
        return extractedJson.trim()
      }
    }
    
    // Look for JSON object starting with { and ending with }
    const jsonObjectStart = cleaned.indexOf('{')
    if (jsonObjectStart !== -1) {
      let braceCount = 0
      let inString = false
      let escapeNext = false
      let jsonEnd = -1
      
      for (let i = jsonObjectStart; i < cleaned.length; i++) {
        const char = cleaned[i]
        
        if (escapeNext) {
          escapeNext = false
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          continue
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString
          continue
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++
          } else if (char === '}') {
            braceCount--
            if (braceCount === 0) {
              jsonEnd = i
              break
            }
          }
        }
      }
      
      if (jsonEnd !== -1) {
        const extractedJson = cleaned.substring(jsonObjectStart, jsonEnd + 1)
        console.log('[JSON Extraction Debug] Extracted JSON object, length:', extractedJson.length)
        return extractedJson.trim()
      }
    }
    
    // If no patterns match, return the original response
    // This will likely fail JSON parsing, but we'll get better error messages
    console.log('[JSON Extraction Debug] No JSON structure found, returning original')
    return cleaned
  }

  /**
   * Attempt to convert structured text to JSON format as a fallback
   * Handles the specific format that GPT returned (Test Case 1: etc.)
   */
  private attemptTextToJsonConversion(text: string): any[] | null {
    try {
      console.log('Attempting text-to-JSON conversion...')
      
      // Split by "Test Case" pattern
      const testCaseBlocks = text.split(/Test Case \d+:/i).filter(block => block.trim())
      
      if (testCaseBlocks.length === 0) {
        return null
      }
      
      const testCases = []
      
      for (const block of testCaseBlocks) {
        const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line)
        
        if (lines.length === 0) continue
        
        const testCase: any = {
          title: '',
          description: '',
          preconditions: '',
          steps: [],
          expectedResult: '',
          priority: 'medium',
          tags: ['ai-generated']
        }
        
        // Extract title from first line
        testCase.title = lines[0].replace(/^[\-\•]\s*/, '').trim()
        
        let currentSection = 'title'
        let stepNumber = 1
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          
          if (line.toLowerCase().includes('trinn:') || line.toLowerCase().includes('steps:')) {
            currentSection = 'steps'
            const stepText = line.replace(/^.*?trinn:\s*/i, '').replace(/^.*?steps:\s*/i, '')
            if (stepText.trim()) {
              testCase.steps.push({
                action: stepText.trim(),
                expectedResult: 'Complete the action successfully'
              })
            }
          } else if (line.toLowerCase().includes('forventet resultat:') || line.toLowerCase().includes('expected result:')) {
            currentSection = 'expectedResult'
            testCase.expectedResult = line.replace(/^.*?(forventet resultat|expected result):\s*/i, '').trim()
          } else if (line.toLowerCase().includes('validering:') || line.toLowerCase().includes('validation:')) {
            // Add validation as additional step or expected result
            if (testCase.expectedResult) {
              testCase.expectedResult += ' ' + line.replace(/^.*?(validering|validation):\s*/i, '').trim()
            }
          } else if (line.startsWith('-') || line.startsWith('•')) {
            // Handle bullet points as steps
            const stepText = line.replace(/^[\-\•]\s*/, '').trim()
            if (stepText && currentSection === 'steps') {
              testCase.steps.push({
                action: stepText,
                expectedResult: 'Step completes successfully'
              })
            }
          }
        }
        
        // Set description based on title or content
        testCase.description = `Test case for: ${testCase.title}`
        
        // Ensure we have at least one step
        if (testCase.steps.length === 0) {
          testCase.steps.push({
            action: testCase.title || 'Execute test scenario',
            expectedResult: testCase.expectedResult || 'Test passes successfully'
          })
        }
        
        testCases.push(testCase)
      }
      
      console.log(`Converted ${testCases.length} test cases from text format`)
      return testCases
      
    } catch (error) {
      console.error('Text-to-JSON conversion failed:', error)
      return null
    }
  }


  static createInstance(): OpenAIService {
    return new OpenAIService()
  }
}