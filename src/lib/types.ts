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