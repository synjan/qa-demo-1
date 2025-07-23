import { Octokit } from '@octokit/rest'
import { GitHubScanner } from './github-scanner'
import { OpenAIService } from '../openai'
import {
  ScanResults,
  FileItem,
  FileContent,
  CodeAnalysis,
  TechnologyStack,
  TestCaseSuggestion,
  EnhancedTestSuggestion,
  CodeSample,
  ComplexityMetrics,
  SecurityIssue,
  TestingStrategy,
  CodePattern,
  LanguageStats
} from '@/lib/types'

export class AIGitHubScanner extends GitHubScanner {
  private openAIService: OpenAIService
  private aiModel: string
  private static readonly MAX_FILES_TO_ANALYZE = 20
  private static readonly MAX_FILE_SIZE = 100000 // 100KB
  private static readonly IMPORTANT_FILES = [
    'readme.md',
    'package.json',
    'requirements.txt',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'gemfile',
    'cargo.toml',
    '.env.example',
    'docker-compose.yml',
    'dockerfile'
  ]

  constructor(token: string, repositoryUrl: string, aiModel: string = 'gpt-4-turbo-preview') {
    super(token, repositoryUrl)
    this.openAIService = new OpenAIService()
    this.aiModel = aiModel
  }

  async scan(): Promise<ScanResults> {
    this.startTime = Date.now()
    
    try {
      this.updateProgress(0, 'Fetching repository information...')
      const repository = await this.getRepository()
      
      this.updateProgress(10, 'Analyzing file structure...')
      const files = await this.getFiles()
      
      this.updateProgress(20, 'Fetching file contents for AI analysis...')
      const fileContents = await this.fetchFileContents(files)
      
      this.updateProgress(35, 'Analyzing code with AI...')
      const codeAnalysis = await this.analyzeCodeWithAI(fileContents)
      
      this.updateProgress(50, 'Calculating code metrics...')
      const metrics = await this.analyzeCodeMetrics(files)
      
      this.updateProgress(60, 'Detecting technologies with AI...')
      const technologies = await this.detectTechnologiesWithAI(fileContents, files)
      
      this.updateProgress(75, 'Analyzing file structure...')
      const fileStructure = await this.analyzeFileStructure(files)
      
      this.updateProgress(85, 'Generating AI-powered test suggestions...')
      const testSuggestions = await this.generateAITestSuggestions(
        codeAnalysis,
        technologies,
        fileContents
      )
      
      const overview = {
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description || undefined,
        primaryLanguage: repository.language || technologies.languages[0]?.name || 'Unknown',
        totalFiles: files.length,
        totalLines: metrics.totalLinesOfCode,
        lastModified: new Date(repository.updated_at),
        stargazersCount: repository.stargazers_count
      }
      
      this.updateProgress(100, 'Scan completed with AI analysis!')
      
      return {
        overview,
        metrics,
        technologies,
        fileStructure,
        testSuggestions,
        scanDuration: Date.now() - this.startTime,
        codeAnalysis // Include AI analysis results
      } as ScanResults & { codeAnalysis?: CodeAnalysis }
    } catch (error) {
      throw new Error(`AI Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async fetchFileContents(files: FileItem[]): Promise<FileContent[]> {
    const fileContents: FileContent[] = []
    const filesToFetch = this.selectFilesToAnalyze(files)
    
    for (const file of filesToFetch) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: file.path
        })
        
        if ('content' in data && data.content) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8')
          
          // Skip if file is too large
          if (content.length > AIGitHubScanner.MAX_FILE_SIZE) {
            continue
          }
          
          fileContents.push({
            path: file.path,
            content,
            language: this.detectLanguage(file.path),
            size: content.length
          })
        }
      } catch (error) {
        // Skip files that can't be fetched
        console.error(`Failed to fetch ${file.path}:`, error)
      }
    }
    
    return fileContents
  }

  private selectFilesToAnalyze(files: FileItem[]): FileItem[] {
    const selected: FileItem[] = []
    
    // First, add important configuration files
    for (const file of files) {
      const fileName = file.path.toLowerCase().split('/').pop() || ''
      if (AIGitHubScanner.IMPORTANT_FILES.includes(fileName)) {
        selected.push(file)
      }
    }
    
    // Then add main source files (prioritize src/, lib/, app/ directories)
    const sourceFiles = files.filter(f => {
      const path = f.path.toLowerCase()
      return (path.includes('/src/') || path.includes('/lib/') || path.includes('/app/')) &&
             this.isAnalyzableFile(path)
    })
    
    // Sort by path depth (prefer top-level files) and take remaining slots
    sourceFiles.sort((a, b) => a.path.split('/').length - b.path.split('/').length)
    const remaining = AIGitHubScanner.MAX_FILES_TO_ANALYZE - selected.length
    selected.push(...sourceFiles.slice(0, remaining))
    
    return selected
  }

  private isAnalyzableFile(path: string): boolean {
    const analyzableExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php',
      '.cs', '.cpp', '.c', '.swift', '.kt', '.rs', '.scala', '.r'
    ]
    return analyzableExtensions.some(ext => path.endsWith(ext))
  }

  private detectLanguage(path: string): string {
    const ext = path.substring(path.lastIndexOf('.'))
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.rs': 'rust',
      '.scala': 'scala',
      '.r': 'r'
    }
    return languageMap[ext] || 'unknown'
  }

  private async analyzeCodeWithAI(fileContents: FileContent[]): Promise<CodeAnalysis> {
    if (fileContents.length === 0) {
      return {}
    }

    const prompt = this.createCodeAnalysisPrompt(fileContents)
    
    try {
      const completion = await (this.openAIService as any).openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert code analyzer. Analyze the provided code samples and return a JSON object with the following structure:
            {
              "architecturePattern": "string describing the architecture (e.g., MVC, microservices, monolith)",
              "codeComplexity": {
                "overall": number (0-100),
                "fileComplexity": { "filename": number },
                "suggestions": ["improvement suggestions"]
              },
              "securityConcerns": [
                {
                  "severity": "low|medium|high|critical",
                  "type": "string",
                  "description": "string",
                  "file": "string",
                  "recommendation": "string"
                }
              ],
              "testingApproach": {
                "currentApproach": "string",
                "frameworks": ["framework names"],
                "coverage": number (estimated percentage),
                "recommendations": ["testing recommendations"]
              },
              "documentationQuality": number (0-100),
              "mainTechnologies": ["detected technologies"],
              "codePatterns": [
                {
                  "pattern": "pattern name",
                  "description": "description",
                  "occurrences": number,
                  "quality": "good|neutral|poor"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      try {
        return response ? JSON.parse(response) : {}
      } catch (parseError) {
        console.error('Failed to parse AI code analysis:', response)
        return {}
      }
    } catch (error) {
      console.error('AI code analysis failed:', error)
      return {}
    }
  }

  private createCodeAnalysisPrompt(fileContents: FileContent[]): string {
    let prompt = 'Analyze the following code samples from a repository:\n\n'
    
    for (const file of fileContents.slice(0, 10)) { // Limit to 10 files
      prompt += `File: ${file.path} (${file.language})\n`
      prompt += '```\n'
      prompt += file.content.substring(0, 2000) // Limit content length
      prompt += '\n```\n\n'
    }
    
    prompt += 'Provide a comprehensive analysis including architecture patterns, code complexity, security concerns, testing approach, and code quality.'
    
    return prompt
  }

  private async detectTechnologiesWithAI(
    fileContents: FileContent[],
    files: FileItem[]
  ): Promise<TechnologyStack> {
    // Get basic technology detection from parent class
    const basicTech = await super.detectTechnologies(files)
    
    // Enhance with AI analysis
    const configFiles = fileContents.filter(f => 
      ['package.json', 'requirements.txt', 'go.mod', 'pom.xml', 'build.gradle'].includes(
        f.path.toLowerCase().split('/').pop() || ''
      )
    )
    
    if (configFiles.length === 0) {
      return basicTech
    }

    try {
      const prompt = this.createTechnologyDetectionPrompt(configFiles)
      
      const completion = await (this.openAIService as any).openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert at detecting technologies from configuration files. Return a JSON object with:
            {
              "frameworks": [{"name": "string", "confidence": number, "version": "string"}],
              "libraries": ["library names"],
              "tools": [{"name": "string", "category": "lint|test|build|deploy|ci"}],
              "packageManagers": [{"name": "string", "configFile": "string"}],
              "primaryStack": "string"
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      let aiTech = {}
      try {
        aiTech = JSON.parse(completion.choices[0].message.content || '{}')
      } catch (parseError) {
        console.error('Failed to parse AI technology detection:', completion.choices[0].message.content)
        aiTech = {}
      }
      
      // Merge AI results with basic detection
      return {
        languages: basicTech.languages,
        frameworks: [...basicTech.frameworks, ...(aiTech.frameworks || [])],
        tools: [...basicTech.tools, ...(aiTech.tools || [])],
        packageManagers: aiTech.packageManagers || basicTech.packageManagers,
        primaryStack: aiTech.primaryStack || basicTech.primaryStack
      }
    } catch (error) {
      console.error('AI technology detection failed:', error)
      return basicTech
    }
  }

  private createTechnologyDetectionPrompt(configFiles: FileContent[]): string {
    let prompt = 'Analyze these configuration files to detect technologies:\n\n'
    
    for (const file of configFiles) {
      prompt += `File: ${file.path}\n`
      prompt += '```\n'
      prompt += file.content
      prompt += '\n```\n\n'
    }
    
    prompt += 'Identify all frameworks, libraries, tools, and the primary technology stack.'
    
    return prompt
  }

  private async generateAITestSuggestions(
    codeAnalysis: CodeAnalysis,
    technologies: TechnologyStack,
    fileContents: FileContent[]
  ): Promise<EnhancedTestSuggestion[]> {
    const prompt = this.createTestSuggestionPrompt(codeAnalysis, technologies, fileContents)
    
    try {
      const completion = await (this.openAIService as any).openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: `You are a QA expert. Generate specific, actionable test suggestions based on the code analysis. Return a JSON array of test suggestions:
            [
              {
                "id": "string",
                "title": "string",
                "description": "string",
                "category": "unit|integration|functional|performance|security|infrastructure",
                "priority": "low|medium|high|critical",
                "estimatedEffort": "string",
                "reason": "string",
                "testSteps": [
                  {
                    "id": "string",
                    "stepNumber": number,
                    "action": "string",
                    "expectedResult": "string"
                  }
                ],
                "testData": [
                  {
                    "name": "string",
                    "value": "string",
                    "description": "string"
                  }
                ],
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
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      
      try {
        const parsed = response ? JSON.parse(response) : { suggestions: [] }
        const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || [])
        
        // Add AI generated flag
        return suggestions.map((s: EnhancedTestSuggestion) => ({
          ...s,
          aiGenerated: true
        }))
      } catch (parseError) {
        console.error('Failed to parse AI response:', response)
        // Return fallback suggestions if AI parsing fails
        return [{
          id: '1',
          title: 'AI Analysis Completed',
          description: 'AI completed the analysis but could not generate specific suggestions. Consider running basic tests.',
          category: 'functional' as const,
          priority: 'medium' as const,
          estimatedEffort: '1 hour',
          reason: 'AI analysis completed with parsing issues',
          aiGenerated: true
        }]
      }
    } catch (error) {
      console.error('AI test suggestion generation failed:', error)
      // Fall back to basic suggestions
      return await super.generateTestSuggestions([], technologies)
    }
  }

  private createTestSuggestionPrompt(
    codeAnalysis: CodeAnalysis,
    technologies: TechnologyStack,
    fileContents: FileContent[]
  ): string {
    let prompt = 'Based on the following code analysis, generate specific test suggestions:\n\n'
    
    prompt += `Architecture: ${codeAnalysis.architecturePattern || 'Unknown'}\n`
    prompt += `Main Technologies: ${codeAnalysis.mainTechnologies?.join(', ') || technologies.primaryStack}\n`
    prompt += `Code Complexity: ${codeAnalysis.codeComplexity?.overall || 'Unknown'}/100\n`
    prompt += `Documentation Quality: ${codeAnalysis.documentationQuality || 'Unknown'}/100\n`
    
    if (codeAnalysis.securityConcerns && codeAnalysis.securityConcerns.length > 0) {
      prompt += '\nSecurity Concerns:\n'
      codeAnalysis.securityConcerns.forEach(concern => {
        prompt += `- ${concern.severity}: ${concern.type} - ${concern.description}\n`
      })
    }
    
    prompt += '\nSample code structures:\n'
    // Add some code samples for context
    const apiFiles = fileContents.filter(f => f.path.includes('api/') || f.path.includes('routes/'))
    const componentFiles = fileContents.filter(f => f.path.includes('component'))
    
    if (apiFiles.length > 0) {
      prompt += `\nAPI Endpoints found in: ${apiFiles.map(f => f.path).join(', ')}\n`
    }
    
    if (componentFiles.length > 0) {
      prompt += `\nUI Components found in: ${componentFiles.map(f => f.path).join(', ')}\n`
    }
    
    prompt += '\nGenerate 5-10 specific test suggestions with detailed steps, test data, and risk assessment. Focus on critical paths, security, and edge cases.'
    
    return prompt
  }
}