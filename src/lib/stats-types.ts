import { Priority } from './types'

// Time range options for stats filtering
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'

// Trend direction for metrics
export type TrendDirection = 'up' | 'down' | 'stable'

// Basic stat with trend information
export interface StatWithTrend {
  value: number
  previousValue: number
  change: number
  changePercent: number
  trend: TrendDirection
}

// Test case statistics
export interface TestCaseStats {
  total: StatWithTrend
  byPriority: Record<Priority, StatWithTrend>
  byStatus: {
    pass: StatWithTrend
    fail: StatWithTrend
    skip: StatWithTrend
    notRun: StatWithTrend
  }
  created: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  averageStepsPerTest: number
  mostTestedFeatures: Array<{
    feature: string
    count: number
  }>
}

// Test plan statistics
export interface TestPlanStats {
  total: StatWithTrend
  byStatus: {
    active: StatWithTrend
    completed: StatWithTrend
    draft: StatWithTrend
  }
  averageTestsPerPlan: number
  completionRate: StatWithTrend
  averageDuration: {
    value: number // in minutes
    trend: TrendDirection
  }
}

// Test run statistics
export interface TestRunStats {
  total: StatWithTrend
  passRate: StatWithTrend
  failRate: StatWithTrend
  skipRate: StatWithTrend
  averageDuration: StatWithTrend // in minutes
  byExecutor: Array<{
    executor: string
    runs: number
    passRate: number
  }>
  failureReasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
  executionTrends: Array<{
    date: string
    passed: number
    failed: number
    skipped: number
    total: number
  }>
}

// Performance metrics
export interface PerformanceStats {
  averageTestExecutionTime: StatWithTrend // in seconds
  slowestTests: Array<{
    testCaseId: string
    title: string
    averageTime: number // in seconds
  }>
  fastestTests: Array<{
    testCaseId: string
    title: string
    averageTime: number // in seconds
  }>
  executionTimeDistribution: Array<{
    range: string // e.g., "0-30s", "30-60s", "60s+"
    count: number
    percentage: number
  }>
}

// Quality metrics
export interface QualityMetrics {
  testCoverage: StatWithTrend // percentage
  defectEscapeRate: StatWithTrend // percentage
  testEffectiveness: StatWithTrend // percentage
  flakyTests: Array<{
    testCaseId: string
    title: string
    flakinessScore: number // 0-100
    lastNResults: Array<'pass' | 'fail'>
  }>
  mostFailingTests: Array<{
    testCaseId: string
    title: string
    failureRate: number
    failureCount: number
  }>
}

// Activity statistics
export interface ActivityStats {
  recentActivity: Array<{
    id: string
    type: 'test_created' | 'test_updated' | 'test_executed' | 'plan_created' | 'plan_completed'
    title: string
    description: string
    timestamp: string
    user?: string
  }>
  activeUsers: Array<{
    user: string
    actions: number
    lastActive: string
  }>
  peakActivityHours: Array<{
    hour: number // 0-23
    activityCount: number
  }>
}

// Comprehensive dashboard statistics
export interface DashboardStats {
  overview: {
    totalTestCases: number
    totalTestPlans: number
    totalTestRuns: number
    overallPassRate: number
    activeTestRuns: number
  }
  testCases: TestCaseStats
  testPlans: TestPlanStats
  testRuns: TestRunStats
  performance: PerformanceStats
  quality: QualityMetrics
  activity: ActivityStats
  lastUpdated: string
  timeRange: TimeRange
}

// Stats calculation options
export interface StatsOptions {
  timeRange: TimeRange
  includeDeleted?: boolean
  groupBy?: 'day' | 'week' | 'month'
  limit?: number
}

// Cache entry for stats
export interface StatsCacheEntry {
  data: DashboardStats
  timestamp: number
  timeRange: TimeRange
  expiresAt: number
}

// Utility type for time-series data
export interface TimeSeriesData {
  timestamp: string
  value: number
  label?: string
}

// Utility type for distribution data
export interface DistributionData {
  label: string
  value: number
  percentage: number
  color?: string
}