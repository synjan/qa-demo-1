import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { TestCase, TestPlan, TestRun } from './types'

export class FileSystemError extends Error {
  constructor(message: string, public operation: string, public filePath?: string) {
    super(message)
    this.name = 'FileSystemError'
  }
}

export class FileUtils {
  private static testCasesDir = path.join(process.cwd(), 'testcases')
  private static testPlansDir = path.join(process.cwd(), 'testplans')
  private static resultsDir = path.join(process.cwd(), 'results')

  // Ensure directories exist
  static async ensureDirectories(): Promise<void> {
    try {
      await Promise.all([
        fs.mkdir(this.testCasesDir, { recursive: true }),
        fs.mkdir(this.testPlansDir, { recursive: true }),
        fs.mkdir(this.resultsDir, { recursive: true })
      ])
    } catch (error) {
      throw new FileSystemError('Failed to create directories', 'ensureDirectories')
    }
  }

  // Test Case Operations
  static async saveTestCase(testCase: TestCase): Promise<void> {
    await this.ensureDirectories()
    
    const filename = `${testCase.id}.md`
    const filePath = path.join(this.testCasesDir, filename)
    
    try {
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
      await fs.writeFile(filePath, fileContent, 'utf-8')
    } catch (error) {
      throw new FileSystemError(
        `Failed to save test case: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveTestCase',
        filePath
      )
    }
  }

  static async loadTestCase(testCaseId: string): Promise<TestCase | null> {
    const filename = `${testCaseId}.md`
    const filePath = path.join(this.testCasesDir, filename)
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data, content } = matter(fileContent)
      
      // Validate that required fields exist in frontmatter
      if (!data.id || !data.title) {
        throw new Error('Invalid test case format: missing required frontmatter fields')
      }
      
      // Parse steps from markdown content
      const steps = this.parseStepsFromMarkdown(content)
      
      // Reconstruct the TestCase object
      const testCase: TestCase = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        preconditions: data.preconditions,
        steps: steps,
        expectedResult: data.expectedResult || '',
        priority: data.priority || 'medium',
        tags: data.tags || [],
        githubIssue: data.githubIssue,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy
      }
      
      return testCase
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null // File doesn't exist
      }
      throw new FileSystemError(
        `Failed to load test case: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'loadTestCase',
        filePath
      )
    }
  }

  // Helper method to parse steps from markdown content
  private static parseStepsFromMarkdown(content: string): any[] {
    const steps: any[] = []
    
    try {
      // Look for test steps section
      const stepSectionMatch = content.match(/## Test Steps([\s\S]*?)(?=## Expected Final Result|$)/)
      if (!stepSectionMatch) {
        return steps
      }
      
      const stepContent = stepSectionMatch[1]
      
      // Use a more flexible regex pattern
      const stepBlocks = stepContent.split(/(?=### Step \d+)/).filter(block => block.trim())
      
      for (let i = 0; i < stepBlocks.length; i++) {
        const block = stepBlocks[i]
        
        // Extract step number
        const stepNumMatch = block.match(/### Step (\d+)/)
        if (!stepNumMatch) continue
        
        const stepNumber = parseInt(stepNumMatch[1], 10)
        
        // Extract action - look for content after **Action:** until **Expected Result:**
        const actionMatch = block.match(/\*\*Action:\*\*\s*([^*]+?)(?=\*\*Expected Result:\*\*)/s)
        const expectedMatch = block.match(/\*\*Expected Result:\*\*\s*([^*]+?)(?=###|$)/s)
        
        if (actionMatch && expectedMatch) {
          steps.push({
            id: `step-${stepNumber}`,
            stepNumber: stepNumber,
            action: actionMatch[1].trim(),
            expectedResult: expectedMatch[1].trim()
          })
        }
      }
      
      return steps
      
    } catch (error) {
      console.error('Error parsing steps:', error)
      return steps
    }
  }

  static async getAllTestCases(): Promise<TestCase[]> {
    await this.ensureDirectories()
    
    try {
      const files = await fs.readdir(this.testCasesDir)
      const testCaseFiles = files.filter(file => file.endsWith('.md'))
      
      const testCases: TestCase[] = []
      
      for (const file of testCaseFiles) {
        try {
          const testCaseId = path.basename(file, '.md')
          const testCase = await this.loadTestCase(testCaseId)
          if (testCase) {
            testCases.push(testCase)
          }
        } catch (error) {
          console.error(`Error loading test case ${file}:`, error)
          // Continue with other files
        }
      }
      
      return testCases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      throw new FileSystemError(
        `Failed to load test cases: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getAllTestCases'
      )
    }
  }

  static async deleteTestCase(testCaseId: string): Promise<boolean> {
    const filename = `${testCaseId}.md`
    const filePath = path.join(this.testCasesDir, filename)
    
    try {
      await fs.unlink(filePath)
      return true
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return false // File doesn't exist
      }
      throw new FileSystemError(
        `Failed to delete test case: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deleteTestCase',
        filePath
      )
    }
  }

  // Test Plan Operations
  static async saveTestPlan(testPlan: TestPlan): Promise<void> {
    await this.ensureDirectories()
    
    const filename = `${testPlan.id}.json`
    const filePath = path.join(this.testPlansDir, filename)
    
    try {
      const jsonContent = JSON.stringify(testPlan, null, 2)
      await fs.writeFile(filePath, jsonContent, 'utf-8')
    } catch (error) {
      throw new FileSystemError(
        `Failed to save test plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveTestPlan',
        filePath
      )
    }
  }

  static async loadTestPlan(testPlanId: string): Promise<TestPlan | null> {
    const filename = `${testPlanId}.json`
    const filePath = path.join(this.testPlansDir, filename)
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const testPlan = JSON.parse(fileContent) as TestPlan
      
      // Validate required fields
      if (!testPlan.id || !testPlan.name || !Array.isArray(testPlan.testCases)) {
        throw new Error('Invalid test plan format')
      }
      
      return testPlan
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null // File doesn't exist
      }
      throw new FileSystemError(
        `Failed to load test plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'loadTestPlan',
        filePath
      )
    }
  }

  static async getAllTestPlans(): Promise<TestPlan[]> {
    await this.ensureDirectories()
    
    try {
      const files = await fs.readdir(this.testPlansDir)
      const testPlanFiles = files.filter(file => file.endsWith('.json'))
      
      const testPlans: TestPlan[] = []
      
      for (const file of testPlanFiles) {
        try {
          const testPlanId = path.basename(file, '.json')
          const testPlan = await this.loadTestPlan(testPlanId)
          if (testPlan) {
            testPlans.push(testPlan)
          }
        } catch (error) {
          console.error(`Error loading test plan ${file}:`, error)
          // Continue with other files
        }
      }
      
      return testPlans.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      throw new FileSystemError(
        `Failed to load test plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getAllTestPlans'
      )
    }
  }

  static async deleteTestPlan(testPlanId: string): Promise<boolean> {
    const filename = `${testPlanId}.json`
    const filePath = path.join(this.testPlansDir, filename)
    
    try {
      await fs.unlink(filePath)
      return true
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return false // File doesn't exist
      }
      throw new FileSystemError(
        `Failed to delete test plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deleteTestPlan',
        filePath
      )
    }
  }

  // Test Run Operations
  static async saveTestRun(testRun: TestRun): Promise<void> {
    await this.ensureDirectories()
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${testRun.id}-${timestamp}.json`
    const filePath = path.join(this.resultsDir, filename)
    
    try {
      const jsonContent = JSON.stringify(testRun, null, 2)
      await fs.writeFile(filePath, jsonContent, 'utf-8')
    } catch (error) {
      throw new FileSystemError(
        `Failed to save test run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveTestRun',
        filePath
      )
    }
  }

  static async getAllTestRuns(): Promise<TestRun[]> {
    await this.ensureDirectories()
    
    try {
      const files = await fs.readdir(this.resultsDir)
      const testRunFiles = files.filter(file => file.endsWith('.json'))
      
      const testRuns: TestRun[] = []
      
      for (const file of testRunFiles) {
        try {
          const filePath = path.join(this.resultsDir, file)
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const testRun = JSON.parse(fileContent) as TestRun
          
          if (testRun.id && testRun.testPlanId) {
            testRuns.push(testRun)
          }
        } catch (error) {
          console.error(`Error loading test run ${file}:`, error)
          // Continue with other files
        }
      }
      
      return testRuns.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    } catch (error) {
      throw new FileSystemError(
        `Failed to load test runs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getAllTestRuns'
      )
    }
  }

  // Utility Methods
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  static async getFileStats(filePath: string) {
    try {
      return await fs.stat(filePath)
    } catch (error) {
      throw new FileSystemError(
        `Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getFileStats',
        filePath
      )
    }
  }

  // Search and Filter
  static async searchTestCases(query: string, tags?: string[]): Promise<TestCase[]> {
    const allTestCases = await this.getAllTestCases()
    
    return allTestCases.filter(testCase => {
      const matchesQuery = query === '' || 
        testCase.title.toLowerCase().includes(query.toLowerCase()) ||
        testCase.description.toLowerCase().includes(query.toLowerCase())
      
      const matchesTags = !tags || tags.length === 0 ||
        tags.some(tag => testCase.tags.includes(tag))
      
      return matchesQuery && matchesTags
    })
  }

  // Dashboard Statistics
  static async getDashboardStats() {
    try {
      const [testCases, testPlans, testRuns] = await Promise.all([
        this.getAllTestCases(),
        this.getAllTestPlans(),
        this.getAllTestRuns()
      ])

      // Calculate pass rate from test runs
      let totalTests = 0
      let passedTests = 0

      testRuns.forEach(run => {
        run.results.forEach(result => {
          totalTests++
          if (result.status === 'pass') {
            passedTests++
          }
        })
      })

      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

      // Get recent activity counts (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentTestRuns = testRuns.filter(run => 
        new Date(run.startedAt) >= sevenDaysAgo
      ).length

      const recentTestCases = testCases.filter(testCase => 
        new Date(testCase.createdAt) >= sevenDaysAgo
      ).length

      const recentTestPlans = testPlans.filter(plan => 
        new Date(plan.createdAt) >= sevenDaysAgo
      ).length

      return {
        totalTestCases: testCases.length,
        totalTestPlans: testPlans.length,
        totalTestRuns: testRuns.length,
        passRate: passRate,
        recentTestRuns: recentTestRuns,
        recentTestCases: recentTestCases,
        recentTestPlans: recentTestPlans,
        activeTestRuns: testRuns.filter(run => run.status === 'in_progress').length
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalTestCases: 0,
        totalTestPlans: 0,
        totalTestRuns: 0,
        passRate: 0,
        recentTestRuns: 0,
        recentTestCases: 0,
        recentTestPlans: 0,
        activeTestRuns: 0
      }
    }
  }

  // Recent Activity for Dashboard
  static async getRecentActivity(limit: number = 10) {
    try {
      const [testCases, testPlans, testRuns] = await Promise.all([
        this.getAllTestCases(),
        this.getAllTestPlans(),
        this.getAllTestRuns()
      ])

      const activities: any[] = []

      // Add test runs
      testRuns.slice(0, limit).forEach(run => {
        activities.push({
          id: run.id,
          type: 'test_run',
          title: run.name,
          description: `Executed by ${run.executedBy}`,
          timestamp: run.startedAt,
          status: run.status,
          metadata: {
            testPlanId: run.testPlanId,
            testCount: run.results.length,
            passedCount: run.results.filter(r => r.status === 'pass').length
          }
        })
      })

      // Add test cases (most recent)
      testCases.slice(0, Math.floor(limit / 2)).forEach(testCase => {
        activities.push({
          id: testCase.id,
          type: 'test_case',
          title: testCase.title,
          description: `Created by ${testCase.createdBy}`,
          timestamp: testCase.createdAt,
          status: 'created',
          metadata: {
            priority: testCase.priority,
            stepCount: testCase.steps.length,
            tags: testCase.tags
          }
        })
      })

      // Add test plans (most recent)
      testPlans.slice(0, Math.floor(limit / 3)).forEach(plan => {
        activities.push({
          id: plan.id,
          type: 'test_plan',
          title: plan.name,
          description: `Created by ${plan.createdBy}`,
          timestamp: plan.createdAt,
          status: 'created',
          metadata: {
            version: plan.version,
            testCaseCount: plan.testCases.length
          }
        })
      })

      // Sort by timestamp (most recent first) and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }
}