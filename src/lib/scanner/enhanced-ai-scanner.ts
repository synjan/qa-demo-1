import { AIGitHubScanner } from './ai-github-scanner'
import {
  FileContent,
  CodeAnalysis,
  APIEndpoint,
  DatabaseOperation,
  BusinessLogicPattern,
  ExternalIntegration,
  RiskAssessment,
  DetailedTestCase,
  TechnologyStack
} from '@/lib/types'

export class EnhancedAIScanner extends AIGitHubScanner {
  private static readonly MAX_FILE_CONTENT = 10000 // Increased from 2000
  
  protected async analyzeCodeWithAI(fileContents: FileContent[]): Promise<CodeAnalysis> {
    if (fileContents.length === 0) {
      return {}
    }

    // Extract specific patterns first
    const apiEndpoints = await this.extractAPIEndpoints(fileContents)
    const databaseOps = await this.extractDatabaseOperations(fileContents)
    const businessLogic = await this.extractBusinessLogic(fileContents)
    const integrations = await this.extractIntegrations(fileContents)
    
    // Create enhanced prompt with extracted patterns
    const prompt = this.createEnhancedAnalysisPrompt(fileContents, {
      apiEndpoints,
      databaseOps,
      businessLogic,
      integrations
    })
    
    try {
      const completion = await (this.openAIService as any).openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert QA engineer analyzing code for testing requirements. Focus on:
            1. Identifying critical test scenarios
            2. Finding security vulnerabilities
            3. Detecting complex business logic that needs thorough testing
            4. Assessing risk areas
            5. Providing specific, actionable test cases
            
            Return a comprehensive JSON analysis following this structure:
            {
              "architecturePattern": "detailed architecture description",
              "codeComplexity": {
                "overall": number,
                "fileComplexity": {},
                "suggestions": ["specific improvement suggestions"]
              },
              "securityConcerns": [
                {
                  "severity": "low|medium|high|critical",
                  "type": "specific vulnerability type",
                  "description": "detailed description",
                  "file": "file path",
                  "line": number,
                  "recommendation": "specific fix",
                  "testCase": "specific test to verify"
                }
              ],
              "testingApproach": {
                "currentApproach": "description",
                "frameworks": ["detected frameworks"],
                "coverage": number,
                "gaps": ["specific gaps"],
                "recommendations": ["specific recommendations"]
              },
              "documentationQuality": number,
              "mainTechnologies": ["technologies"],
              "codePatterns": [
                {
                  "pattern": "pattern name",
                  "description": "description",
                  "occurrences": number,
                  "quality": "good|neutral|poor",
                  "testingImplication": "how this affects testing"
                }
              ],
              "riskAssessment": {
                "overallRisk": "low|medium|high|critical",
                "riskFactors": [
                  {
                    "area": "specific area",
                    "risk": "low|medium|high|critical",
                    "reason": "detailed reason",
                    "mitigation": "specific mitigation"
                  }
                ],
                "testingPriorities": [
                  {
                    "area": "specific area",
                    "priority": 1-10,
                    "reason": "why this is priority",
                    "suggestedTests": ["specific test scenarios"]
                  }
                ]
              }
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      console.log('Enhanced AI Scanner - Raw Response:', response)
      
      try {
        const analysis = response ? JSON.parse(response) : {}
        console.log('Enhanced AI Scanner - Parsed Analysis:', analysis)
        
        // Merge with extracted patterns
        const finalAnalysis = {
          ...analysis,
          apiEndpoints,
          databaseOperations: databaseOps,
          businessLogic,
          integrations
        }
        
        console.log('Enhanced AI Scanner - Final Analysis:', finalAnalysis)
        return finalAnalysis
      } catch (parseError) {
        console.error('Failed to parse enhanced AI analysis:', response)
        return {
          apiEndpoints,
          databaseOperations: databaseOps,
          businessLogic,
          integrations
        }
      }
    } catch (error) {
      console.error('Enhanced AI analysis failed:', error)
      return {
        apiEndpoints,
        databaseOperations: databaseOps,
        businessLogic,
        integrations
      }
    }
  }

  private async extractAPIEndpoints(fileContents: FileContent[]): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = []
    
    for (const file of fileContents) {
      // Next.js API routes
      if (file.path.includes('/api/') && (file.path.endsWith('.ts') || file.path.endsWith('.js'))) {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        for (const method of methods) {
          if (file.content.includes(`export async function ${method}`) || 
              file.content.includes(`export function ${method}`)) {
            const apiPath = file.path
              .replace(/.*\/api\//, '/api/')
              .replace(/\/route\.(ts|js)$/, '')
              .replace(/\[([^\]]+)\]/g, ':$1')
            
            endpoints.push({
              path: apiPath,
              method,
              file: file.path,
              authentication: file.content.includes('getServerSession') || file.content.includes('auth'),
              testPriority: this.assessEndpointPriority(file.content, method)
            })
          }
        }
      }
      
      // Express/Node.js style routes
      const routePatterns = [
        /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
      ]
      
      for (const pattern of routePatterns) {
        let match
        while ((match = pattern.exec(file.content)) !== null) {
          endpoints.push({
            path: match[2],
            method: match[1].toUpperCase(),
            file: file.path,
            authentication: file.content.includes('authenticate') || file.content.includes('auth'),
            testPriority: 'medium'
          })
        }
      }
    }
    
    return endpoints
  }

  private assessEndpointPriority(content: string, method: string): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Authentication, payment, user data modification
    if (content.includes('auth') || content.includes('payment') || content.includes('password')) {
      return 'critical'
    }
    
    // High: Data modification endpoints
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      return 'high'
    }
    
    // Medium: Data retrieval with parameters
    if (method === 'GET' && content.includes('params')) {
      return 'medium'
    }
    
    return 'low'
  }

  private async extractDatabaseOperations(fileContents: FileContent[]): Promise<DatabaseOperation[]> {
    const operations: DatabaseOperation[] = []
    
    for (const file of fileContents) {
      // Prisma operations
      const prismaPatterns = [
        /prisma\.\w+\.(create|findMany|findUnique|findFirst|update|updateMany|delete|deleteMany)\(/g,
        /db\.\w+\.(create|findMany|findUnique|findFirst|update|updateMany|delete|deleteMany)\(/g
      ]
      
      for (const pattern of prismaPatterns) {
        let match
        while ((match = pattern.exec(file.content)) !== null) {
          const [, operation] = match
          operations.push({
            type: this.mapDbOperation(operation),
            entity: match[0].split('.')[1],
            file: file.path,
            complexity: this.assessQueryComplexity(file.content, match.index),
            description: `${operation} operation on ${match[0].split('.')[1]}`
          })
        }
      }
      
      // SQL queries
      const sqlPattern = /\b(SELECT|INSERT|UPDATE|DELETE)\b[\s\S]*?\bFROM\b/gi
      let sqlMatch
      while ((sqlMatch = sqlPattern.exec(file.content)) !== null) {
        operations.push({
          type: this.mapDbOperation(sqlMatch[1]),
          entity: 'SQL Query',
          file: file.path,
          complexity: 'complex',
          description: 'Raw SQL query'
        })
      }
    }
    
    return operations
  }

  private mapDbOperation(op: string): 'create' | 'read' | 'update' | 'delete' | 'query' {
    const mapping: Record<string, any> = {
      'create': 'create',
      'insert': 'create',
      'findMany': 'read',
      'findUnique': 'read',
      'findFirst': 'read',
      'select': 'read',
      'update': 'update',
      'updateMany': 'update',
      'delete': 'delete',
      'deleteMany': 'delete'
    }
    
    return mapping[op.toLowerCase()] || 'query'
  }

  private assessQueryComplexity(content: string, position: number): 'simple' | 'moderate' | 'complex' {
    const context = content.substring(Math.max(0, position - 200), position + 200)
    
    if (context.includes('include') || context.includes('join') || context.includes('where')) {
      return 'complex'
    }
    
    if (context.includes('orderBy') || context.includes('take') || context.includes('skip')) {
      return 'moderate'
    }
    
    return 'simple'
  }

  private async extractBusinessLogic(fileContents: FileContent[]): Promise<BusinessLogicPattern[]> {
    const patterns: BusinessLogicPattern[] = []
    
    for (const file of fileContents) {
      // Validation patterns
      if (file.content.includes('validate') || file.content.includes('schema')) {
        patterns.push({
          name: 'Input Validation',
          type: 'validation',
          file: file.path,
          complexity: 50,
          description: 'Input validation logic detected',
          testingNotes: 'Test with invalid inputs, edge cases, and boundary values'
        })
      }
      
      // Complex calculations
      const calculationPatterns = [
        /calculate|compute|total|sum|average|percentage/i,
        /price|cost|discount|tax|fee/i
      ]
      
      for (const pattern of calculationPatterns) {
        if (pattern.test(file.content)) {
          patterns.push({
            name: 'Business Calculation',
            type: 'calculation',
            file: file.path,
            complexity: 75,
            description: 'Business calculation logic detected',
            testingNotes: 'Test with various input values, edge cases, and precision'
          })
          break
        }
      }
      
      // Workflow patterns
      if (file.content.includes('workflow') || file.content.includes('process') || 
          file.content.includes('step') || file.content.includes('status')) {
        patterns.push({
          name: 'Business Workflow',
          type: 'workflow',
          file: file.path,
          complexity: 80,
          description: 'Business workflow or state machine detected',
          testingNotes: 'Test all state transitions and edge cases'
        })
      }
    }
    
    return patterns
  }

  private async extractIntegrations(fileContents: FileContent[]): Promise<ExternalIntegration[]> {
    const integrations: ExternalIntegration[] = []
    
    for (const file of fileContents) {
      // API calls
      const apiPatterns = [
        /fetch\s*\(/,
        /axios\./,
        /\$\.ajax/,
        /httpClient\./
      ]
      
      for (const pattern of apiPatterns) {
        if (pattern.test(file.content)) {
          integrations.push({
            service: 'External API',
            type: 'api',
            file: file.path,
            operations: ['HTTP Request'],
            authMethod: file.content.includes('Bearer') ? 'Bearer Token' : 
                       file.content.includes('apiKey') ? 'API Key' : undefined
          })
          break
        }
      }
      
      // AWS services
      if (file.content.includes('aws-sdk') || file.content.includes('AWS')) {
        integrations.push({
          service: 'AWS',
          type: 'storage',
          file: file.path,
          operations: ['Cloud Operations']
        })
      }
      
      // Payment services
      if (file.content.includes('stripe') || file.content.includes('paypal')) {
        integrations.push({
          service: 'Payment Gateway',
          type: 'api',
          file: file.path,
          operations: ['Payment Processing']
        })
      }
    }
    
    return integrations
  }

  private createEnhancedAnalysisPrompt(
    fileContents: FileContent[],
    extractedPatterns: {
      apiEndpoints: APIEndpoint[],
      databaseOps: DatabaseOperation[],
      businessLogic: BusinessLogicPattern[],
      integrations: ExternalIntegration[]
    }
  ): string {
    let prompt = `Analyze this codebase from a QA perspective. Focus on identifying:
1. Critical areas that need thorough testing
2. Security vulnerabilities and their test cases
3. Complex business logic requiring edge case testing
4. Integration points that could fail
5. Performance bottlenecks

Found patterns:
- ${extractedPatterns.apiEndpoints.length} API endpoints
- ${extractedPatterns.databaseOps.length} database operations
- ${extractedPatterns.businessLogic.length} business logic patterns
- ${extractedPatterns.integrations.length} external integrations

Code samples:\n\n`
    
    // Include more content from each file
    for (const file of fileContents.slice(0, 15)) {
      prompt += `File: ${file.path} (${file.language})\n`
      prompt += '```\n'
      prompt += file.content.substring(0, EnhancedAIScanner.MAX_FILE_CONTENT)
      prompt += '\n```\n\n'
    }
    
    prompt += `\nProvide a comprehensive QA analysis with specific test scenarios, 
    risk assessment, and actionable recommendations.`
    
    return prompt
  }

  protected async generateAITestSuggestions(
    codeAnalysis: CodeAnalysis,
    technologies: TechnologyStack,
    fileContents: FileContent[]
  ): Promise<DetailedTestCase[]> {
    const prompt = this.createDetailedTestPrompt(codeAnalysis, technologies)
    
    try {
      const completion = await (this.openAIService as any).openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: `You are a senior QA engineer creating detailed, executable test cases. 
            Generate specific test cases with actual test code, data, and expected results.
            
            Return a JSON array of detailed test cases:
            [
              {
                "id": "string",
                "title": "specific test title",
                "description": "what this test verifies",
                "category": "unit|integration|functional|performance|security|infrastructure",
                "priority": "low|medium|high|critical",
                "estimatedEffort": "time estimate",
                "reason": "why this test is important",
                "testSteps": [
                  {
                    "id": "string",
                    "stepNumber": number,
                    "action": "specific action",
                    "expectedResult": "specific expected result"
                  }
                ],
                "apiEndpoint": "endpoint path if applicable",
                "httpMethod": "GET|POST|PUT|DELETE if applicable",
                "requestBody": { sample request body },
                "expectedResponse": { sample response },
                "setupSteps": ["setup steps"],
                "teardownSteps": ["cleanup steps"],
                "testData": [
                  {
                    "name": "variable name",
                    "value": "test value",
                    "description": "why this value"
                  }
                ],
                "testCode": "actual test code snippet",
                "coverage": ["what this test covers"],
                "riskLevel": "low|medium|high"
              }
            ]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      
      try {
        const parsed = response ? JSON.parse(response) : { testCases: [] }
        const testCases = Array.isArray(parsed) ? parsed : (parsed.testCases || parsed.suggestions || [])
        
        return testCases.map((tc: DetailedTestCase) => ({
          ...tc,
          aiGenerated: true
        }))
      } catch (parseError) {
        console.error('Failed to parse detailed test cases:', response)
        return this.generateFallbackTestCases(codeAnalysis)
      }
    } catch (error) {
      console.error('Detailed test generation failed:', error)
      return this.generateFallbackTestCases(codeAnalysis)
    }
  }

  private createDetailedTestPrompt(
    codeAnalysis: CodeAnalysis,
    technologies: TechnologyStack
  ): string {
    let prompt = `Generate detailed test cases based on this analysis:

Architecture: ${codeAnalysis.architecturePattern || 'Unknown'}
Technologies: ${technologies.primaryStack}
Risk Level: ${codeAnalysis.riskAssessment?.overallRisk || 'Unknown'}

Key areas to test:\n`

    // API Endpoints
    if (codeAnalysis.apiEndpoints && codeAnalysis.apiEndpoints.length > 0) {
      prompt += '\nAPI Endpoints:\n'
      codeAnalysis.apiEndpoints.forEach(endpoint => {
        prompt += `- ${endpoint.method} ${endpoint.path} (Priority: ${endpoint.testPriority})\n`
      })
    }

    // Database Operations
    if (codeAnalysis.databaseOperations && codeAnalysis.databaseOperations.length > 0) {
      prompt += '\nDatabase Operations:\n'
      codeAnalysis.databaseOperations.forEach(op => {
        prompt += `- ${op.type} on ${op.entity} (Complexity: ${op.complexity})\n`
      })
    }

    // Security Concerns
    if (codeAnalysis.securityConcerns && codeAnalysis.securityConcerns.length > 0) {
      prompt += '\nSecurity Concerns:\n'
      codeAnalysis.securityConcerns.forEach(concern => {
        prompt += `- ${concern.severity}: ${concern.type} - ${concern.description}\n`
      })
    }

    // Risk Factors
    if (codeAnalysis.riskAssessment?.riskFactors) {
      prompt += '\nRisk Factors:\n'
      codeAnalysis.riskAssessment.riskFactors.forEach(risk => {
        prompt += `- ${risk.area}: ${risk.risk} - ${risk.reason}\n`
      })
    }

    prompt += `\nGenerate 10-15 detailed test cases covering:
1. Critical API endpoints with sample requests/responses
2. Security vulnerabilities with specific payloads
3. Database operations with edge cases
4. Business logic with boundary values
5. Integration points with failure scenarios

Include actual test code (Jest/Mocha style), setup/teardown steps, and test data.`

    return prompt
  }

  private generateFallbackTestCases(codeAnalysis: CodeAnalysis): DetailedTestCase[] {
    const testCases: DetailedTestCase[] = []

    // Generate test for each API endpoint
    if (codeAnalysis.apiEndpoints) {
      codeAnalysis.apiEndpoints.slice(0, 5).forEach((endpoint, index) => {
        testCases.push({
          id: `api-${index + 1}`,
          title: `Test ${endpoint.method} ${endpoint.path}`,
          description: `Verify ${endpoint.method} request to ${endpoint.path} returns expected response`,
          category: 'integration',
          priority: endpoint.testPriority || 'medium',
          estimatedEffort: '30 minutes',
          reason: 'API endpoint testing is critical for integration',
          apiEndpoint: endpoint.path,
          httpMethod: endpoint.method,
          testSteps: [
            {
              id: '1',
              stepNumber: 1,
              action: `Send ${endpoint.method} request to ${endpoint.path}`,
              expectedResult: 'Receive 200 OK response'
            }
          ],
          aiGenerated: true
        })
      })
    }

    return testCases
  }
}