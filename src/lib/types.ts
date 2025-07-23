export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  labels: Array<{
    id: number
    name: string
    color: string
    description: string | null
  }>
  user: {
    login: string
    avatar_url: string
  }
  assignee?: {
    login: string
    avatar_url: string
  } | null
  comments: number
  created_at: string
  updated_at: string
  html_url: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
  description: string | null
  html_url: string
  updated_at: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  has_issues: boolean
  isFavorite?: boolean
}

export interface TestCase {
  id: string
  title: string
  description: string
  preconditions?: string
  steps: TestStep[]
  expectedResult: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  githubIssue?: {
    number: number
    url: string
    repository: string
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface TestStep {
  id: string
  stepNumber: number
  action: string
  expectedResult: string
}

export interface TestPlan {
  id: string
  name: string
  description: string
  version: string
  testCases: string[] // Array of test case IDs
  createdAt: string
  updatedAt: string
  createdBy: string
  repository?: string
}

export interface TestRun {
  id: string
  testPlanId: string
  name: string
  startedAt: string
  completedAt?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'paused'
  executedBy: string
  results: TestResult[]
}

export interface TestResult {
  testCaseId: string
  status: 'pass' | 'fail' | 'skip' | 'blocked'
  executedAt: string
  executionTime?: number // in seconds
  notes?: string
  screenshots?: string[]
  steps: TestStepResult[]
}

export interface TestStepResult {
  stepId: string
  status: 'pass' | 'fail' | 'skip' | 'blocked'
  actualResult?: string
  notes?: string
}

export interface DashboardStats {
  totalTestCases: number
  totalTestPlans: number
  recentTestRuns: number
  passRate: number
  activeTestRuns: number
}

export interface ScanSession {
  id: string
  repositoryUrl: string
  repository: string
  status: 'pending' | 'scanning' | 'analyzing' | 'completed' | 'failed'
  progress: number
  startedAt: Date
  completedAt?: Date
  currentStep?: string
  error?: string
  results?: ScanResults
  userEmail?: string
}

export interface ScanResults {
  overview: RepositoryOverview
  metrics: CodeMetrics
  technologies: TechnologyStack
  fileStructure: FileStructure
  testSuggestions: TestCaseSuggestion[]
  scanDuration: number
}

export interface RepositoryOverview {
  name: string
  fullName: string
  description?: string
  primaryLanguage: string
  totalFiles: number
  totalLines: number
  lastModified: Date
  stargazersCount: number
}

export interface CodeMetrics {
  totalFiles: number
  totalLinesOfCode: number
  codeLines: number
  commentLines: number
  blankLines: number
  languages: LanguageStats[]
  maintainabilityIndex: number
  documentationCoverage: number
  complexityScore: number
}

export interface LanguageStats {
  name: string
  fileCount: number
  lineCount: number
  percentage: number
}

export interface TechnologyStack {
  languages: LanguageStats[]
  frameworks: Framework[]
  tools: Tool[]
  packageManagers: PackageManager[]
  primaryStack: string
}

export interface Framework {
  name: string
  confidence: number
}

export interface Tool {
  name: string
  category: 'lint' | 'test' | 'build' | 'deploy' | 'ci'
}

export interface PackageManager {
  name: string
  configFile: string
}

export interface FileStructure {
  totalDirectories: number
  maxDepth: number
  structureScore: number
  directories: DirectoryInfo[]
}

export interface DirectoryInfo {
  name: string
  path: string
  fileCount: number
  type: 'source' | 'test' | 'docs' | 'config' | 'other'
}

export interface TestCaseSuggestion {
  id: string
  title: string
  description: string
  category: 'unit' | 'integration' | 'functional' | 'performance' | 'security' | 'infrastructure'
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedEffort: string
  reason: string
}

export interface EnhancedTestSuggestion extends TestCaseSuggestion {
  testSteps?: TestStep[]
  testData?: TestDataSuggestion[]
  coverage?: string[]
  riskLevel?: 'low' | 'medium' | 'high'
  aiGenerated?: boolean
}

export interface TestDataSuggestion {
  name: string
  value: string
  description?: string
}

export interface CodeAnalysis {
  architecturePattern?: string
  codeComplexity?: ComplexityMetrics
  securityConcerns?: SecurityIssue[]
  testingApproach?: TestingStrategy
  documentationQuality?: number
  mainTechnologies?: string[]
  codePatterns?: CodePattern[]
  apiEndpoints?: APIEndpoint[]
  databaseOperations?: DatabaseOperation[]
  businessLogic?: BusinessLogicPattern[]
  integrations?: ExternalIntegration[]
  riskAssessment?: RiskAssessment
}

export interface ComplexityMetrics {
  overall: number // 0-100
  fileComplexity: { [key: string]: number }
  suggestions: string[]
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  description: string
  file?: string
  recommendation: string
}

export interface TestingStrategy {
  currentApproach: string
  frameworks: string[]
  coverage?: number
  recommendations: string[]
}

export interface CodePattern {
  pattern: string
  description: string
  occurrences: number
  quality: 'good' | 'neutral' | 'poor'
}

export interface FileContent {
  path: string
  content: string
  language?: string
  size: number
}

export interface CodeSample {
  file: string
  content: string
  startLine?: number
  endLine?: number
  purpose?: string
}

export interface FileItem {
  path: string
  type: string
  size?: number
  sha: string
}

export interface APIEndpoint {
  path: string
  method: string
  file: string
  line?: number
  parameters?: APIParameter[]
  authentication?: boolean
  description?: string
  testPriority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface APIParameter {
  name: string
  type: string
  required: boolean
  description?: string
  example?: string
}

export interface DatabaseOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'query'
  entity: string
  file: string
  line?: number
  complexity: 'simple' | 'moderate' | 'complex'
  description?: string
}

export interface BusinessLogicPattern {
  name: string
  type: 'validation' | 'calculation' | 'workflow' | 'transformation'
  file: string
  complexity: number // 0-100
  description: string
  testingNotes?: string
}

export interface ExternalIntegration {
  service: string
  type: 'api' | 'database' | 'messaging' | 'storage'
  file: string
  operations: string[]
  authMethod?: string
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: RiskFactor[]
  testingPriorities: TestingPriority[]
}

export interface RiskFactor {
  area: string
  risk: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  mitigation: string
}

export interface TestingPriority {
  area: string
  priority: number // 1-10
  reason: string
  suggestedTests: string[]
}

export interface DetailedTestCase extends EnhancedTestSuggestion {
  apiEndpoint?: string
  httpMethod?: string
  requestBody?: any
  expectedResponse?: any
  setupSteps?: string[]
  teardownSteps?: string[]
  testCode?: string
}