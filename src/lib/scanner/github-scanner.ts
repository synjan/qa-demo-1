import { Octokit } from '@octokit/rest'
import { 
  ScanResults, 
  RepositoryOverview, 
  CodeMetrics, 
  TechnologyStack, 
  FileStructure,
  TestCaseSuggestion,
  LanguageStats,
  Framework,
  Tool,
  PackageManager,
  DirectoryInfo,
  FileItem
} from '@/lib/types'

export class GitHubScanner {
  private octokit: Octokit
  private owner: string
  private repo: string
  private startTime: number = 0
  private progressCallback?: (progress: number, step: string) => void

  constructor(token: string, repositoryUrl: string) {
    this.octokit = new Octokit({ auth: token })
    
    // Parse repository URL or owner/repo format
    const parts = this.parseRepositoryUrl(repositoryUrl)
    this.owner = parts.owner
    this.repo = parts.repo
  }

  private parseRepositoryUrl(url: string): { owner: string; repo: string } {
    // Handle various formats:
    // - https://github.com/owner/repo
    // - github.com/owner/repo
    // - owner/repo
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^github\.com\//, '')
    const parts = cleanUrl.replace(/\.git$/, '').split('/')
    
    if (parts.length >= 2) {
      return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] }
    }
    
    throw new Error('Invalid repository URL format')
  }

  setProgressCallback(callback: (progress: number, step: string) => void) {
    this.progressCallback = callback
  }

  private updateProgress(progress: number, step: string) {
    if (this.progressCallback) {
      this.progressCallback(progress, step)
    }
  }

  async scan(): Promise<ScanResults> {
    this.startTime = Date.now()
    
    try {
      this.updateProgress(0, 'Fetching repository information...')
      const repository = await this.getRepository()
      
      this.updateProgress(20, 'Analyzing file structure...')
      const files = await this.getFiles()
      
      this.updateProgress(40, 'Calculating code metrics...')
      const metrics = await this.analyzeCodeMetrics(files)
      
      this.updateProgress(60, 'Detecting technologies...')
      const technologies = await this.detectTechnologies(files)
      
      this.updateProgress(80, 'Analyzing file structure...')
      const fileStructure = await this.analyzeFileStructure(files)
      
      this.updateProgress(90, 'Generating test suggestions...')
      const testSuggestions = await this.generateTestSuggestions(files, technologies)
      
      const overview: RepositoryOverview = {
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description || undefined,
        primaryLanguage: repository.language || technologies.languages[0]?.name || 'Unknown',
        totalFiles: files.length,
        totalLines: metrics.totalLinesOfCode,
        lastModified: new Date(repository.updated_at),
        stargazersCount: repository.stargazers_count
      }
      
      this.updateProgress(100, 'Scan completed!')
      
      return {
        overview,
        metrics,
        technologies,
        fileStructure,
        testSuggestions,
        scanDuration: Date.now() - this.startTime
      }
    } catch (error) {
      throw new Error(`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getRepository() {
    const { data } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo
    })
    return data
  }

  private async getFiles(): Promise<FileItem[]> {
    
    async function fetchTree(octokit: Octokit, owner: string, repo: string, sha: string) {
      const { data } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: sha,
        recursive: 'true'
      })
      
      return data.tree.filter(item => item.type === 'blob')
    }
    
    // Get default branch
    const { data: repo } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo
    })
    
    const tree = await fetchTree(this.octokit, this.owner, this.repo, repo.default_branch)
    return tree
  }

  private async analyzeCodeMetrics(files: FileItem[]): Promise<CodeMetrics> {
    const languageMap = new Map<string, { count: number; lines: number }>()
    let totalLines = 0
    let codeLines = 0
    let commentLines = 0
    let blankLines = 0
    
    // Simple language detection based on file extensions
    const languageExtensions: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown'
    }
    
    for (const file of files) {
      const ext = file.path.substring(file.path.lastIndexOf('.'))
      const language = languageExtensions[ext] || 'Other'
      
      if (!languageMap.has(language)) {
        languageMap.set(language, { count: 0, lines: 0 })
      }
      
      const stats = languageMap.get(language)!
      stats.count++
      // Estimate lines based on file size (rough approximation)
      const estimatedLines = Math.max(1, Math.round((file.size || 0) / 40))
      stats.lines += estimatedLines
      totalLines += estimatedLines
      
      // Rough estimates for code metrics
      codeLines += Math.round(estimatedLines * 0.7)
      commentLines += Math.round(estimatedLines * 0.15)
      blankLines += Math.round(estimatedLines * 0.15)
    }
    
    const languages: LanguageStats[] = Array.from(languageMap.entries())
      .map(([name, stats]) => ({
        name,
        fileCount: stats.count,
        lineCount: stats.lines,
        percentage: Math.round((stats.count / files.length) * 100)
      }))
      .sort((a, b) => b.fileCount - a.fileCount)
    
    // Calculate basic quality metrics
    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'))
    const hasTests = files.some(f => f.path.includes('test') || f.path.includes('spec'))
    const documentationCoverage = hasReadme ? 50 : 0 + (hasTests ? 25 : 0)
    
    return {
      totalFiles: files.length,
      totalLinesOfCode: totalLines,
      codeLines,
      commentLines,
      blankLines,
      languages,
      maintainabilityIndex: Math.min(100, 50 + (hasReadme ? 20 : 0) + (hasTests ? 30 : 0)),
      documentationCoverage,
      complexityScore: Math.max(0, 30 - (files.length / 100)) // Lower is better
    }
  }

  private async detectTechnologies(files: FileItem[]): Promise<TechnologyStack> {
    const frameworks: Framework[] = []
    const tools: Tool[] = []
    const packageManagers: PackageManager[] = []
    
    // Check for common framework indicators
    const fileNames = files.map(f => f.path.toLowerCase())
    
    // Package managers
    if (fileNames.includes('package.json')) {
      packageManagers.push({ name: 'npm/yarn', configFile: 'package.json' })
      
      // Try to detect frameworks from package.json would require fetching file content
      // For MVP, we'll use simple heuristics
      if (fileNames.some(f => f.includes('react'))) {
        frameworks.push({ name: 'React', confidence: 90 })
      }
      if (fileNames.some(f => f.includes('.vue'))) {
        frameworks.push({ name: 'Vue', confidence: 90 })
      }
      if (fileNames.includes('angular.json')) {
        frameworks.push({ name: 'Angular', confidence: 95 })
      }
      if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
        frameworks.push({ name: 'Next.js', confidence: 95 })
      }
    }
    
    if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py')) {
      packageManagers.push({ name: 'pip', configFile: 'requirements.txt' })
      frameworks.push({ name: 'Python', confidence: 90 })
    }
    
    if (fileNames.includes('pom.xml')) {
      packageManagers.push({ name: 'Maven', configFile: 'pom.xml' })
      frameworks.push({ name: 'Java', confidence: 90 })
    }
    
    if (fileNames.includes('go.mod')) {
      packageManagers.push({ name: 'Go Modules', configFile: 'go.mod' })
      frameworks.push({ name: 'Go', confidence: 90 })
    }
    
    // Detect tools
    if (fileNames.includes('.eslintrc.js') || fileNames.includes('.eslintrc.json')) {
      tools.push({ name: 'ESLint', category: 'lint' })
    }
    if (fileNames.includes('jest.config.js') || fileNames.includes('jest.config.ts')) {
      tools.push({ name: 'Jest', category: 'test' })
    }
    if (fileNames.includes('webpack.config.js')) {
      tools.push({ name: 'Webpack', category: 'build' })
    }
    if (fileNames.includes('dockerfile')) {
      tools.push({ name: 'Docker', category: 'deploy' })
    }
    if (fileNames.includes('.github/workflows')) {
      tools.push({ name: 'GitHub Actions', category: 'ci' })
    }
    
    // Get languages from metrics
    const metrics = await this.analyzeCodeMetrics(files)
    const primaryStack = frameworks.length > 0 
      ? `${frameworks[0].name} + ${metrics.languages[0]?.name || 'Unknown'}`
      : metrics.languages[0]?.name || 'Unknown'
    
    return {
      languages: metrics.languages,
      frameworks,
      tools,
      packageManagers,
      primaryStack
    }
  }

  private async analyzeFileStructure(files: FileItem[]): Promise<FileStructure> {
    const directories = new Map<string, DirectoryInfo>()
    let maxDepth = 0
    
    for (const file of files) {
      const parts = file.path.split('/')
      maxDepth = Math.max(maxDepth, parts.length - 1)
      
      // Analyze each directory in the path
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/')
        const dirName = parts[i]
        
        if (!directories.has(dirPath)) {
          directories.set(dirPath, {
            name: dirName,
            path: dirPath,
            fileCount: 0,
            type: this.classifyDirectory(dirName)
          })
        }
        
        directories.get(dirPath)!.fileCount++
      }
    }
    
    // Calculate structure score based on organization
    const hasSourceDir = Array.from(directories.values()).some(d => d.type === 'source')
    const hasTestDir = Array.from(directories.values()).some(d => d.type === 'test')
    const hasDocsDir = Array.from(directories.values()).some(d => d.type === 'docs')
    
    const structureScore = Math.min(100, 
      40 + // Base score
      (hasSourceDir ? 20 : 0) +
      (hasTestDir ? 20 : 0) +
      (hasDocsDir ? 10 : 0) +
      (maxDepth <= 5 ? 10 : 0) // Bonus for not too deep
    )
    
    return {
      totalDirectories: directories.size,
      maxDepth,
      structureScore,
      directories: Array.from(directories.values()).sort((a, b) => b.fileCount - a.fileCount)
    }
  }

  private classifyDirectory(name: string): DirectoryInfo['type'] {
    const lowerName = name.toLowerCase()
    
    if (lowerName === 'src' || lowerName === 'lib' || lowerName === 'app' || lowerName === 'components') {
      return 'source'
    }
    if (lowerName.includes('test') || lowerName.includes('spec') || lowerName === '__tests__') {
      return 'test'
    }
    if (lowerName === 'docs' || lowerName === 'documentation') {
      return 'docs'
    }
    if (lowerName === 'config' || lowerName === '.github' || lowerName === 'scripts') {
      return 'config'
    }
    
    return 'other'
  }

  private async generateTestSuggestions(
    files: FileItem[], 
    technologies: TechnologyStack
  ): Promise<TestCaseSuggestion[]> {
    const suggestions: TestCaseSuggestion[] = []
    
    // Basic test suggestions based on structure
    const hasTests = files.some(f => f.path.includes('test') || f.path.includes('spec'))
    
    if (!hasTests) {
      suggestions.push({
        id: '1',
        title: 'Set up basic test infrastructure',
        description: 'No test files detected. Consider setting up a testing framework.',
        category: 'infrastructure',
        priority: 'high',
        estimatedEffort: '2 hours',
        reason: 'Testing is essential for code quality'
      })
    }
    
    // Framework-specific suggestions
    if (technologies.frameworks.some(f => f.name === 'React')) {
      suggestions.push({
        id: '2',
        title: 'Test React component rendering',
        description: 'Verify that main React components render without errors',
        category: 'functional',
        priority: 'medium',
        estimatedEffort: '30 minutes',
        reason: 'React applications should have component tests'
      })
    }
    
    // API endpoint testing
    if (files.some(f => f.path.includes('api/') || f.path.includes('routes/'))) {
      suggestions.push({
        id: '3',
        title: 'Test API endpoints',
        description: 'Verify API endpoints return correct status codes and data',
        category: 'integration',
        priority: 'high',
        estimatedEffort: '1 hour',
        reason: 'API endpoints detected in repository'
      })
    }
    
    // Authentication testing
    if (files.some(f => f.path.includes('auth') || f.path.includes('login'))) {
      suggestions.push({
        id: '4',
        title: 'Test authentication flow',
        description: 'Verify login, logout, and session management',
        category: 'functional',
        priority: 'critical',
        estimatedEffort: '1 hour',
        reason: 'Authentication components detected'
      })
    }
    
    return suggestions
  }
}