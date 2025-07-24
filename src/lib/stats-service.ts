import { FileUtils } from './file-utils'
import { TestCase, TestPlan, TestRun, Priority } from './types'
import { calculateTestCaseStatus } from './test-execution-utils'
import {
  DashboardStats,
  StatWithTrend,
  TimeRange,
  TrendDirection,
  StatsOptions,
  StatsCacheEntry,
  TestCaseStats,
  TestPlanStats,
  TestRunStats,
  PerformanceStats,
  QualityMetrics,
  ActivityStats
} from './stats-types'

export class StatsService {
  private static cache = new Map<string, StatsCacheEntry>()
  private static CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get comprehensive dashboard statistics with caching
   */
  static async getDashboardStats(options: StatsOptions = { timeRange: 'week' }): Promise<DashboardStats> {
    const cacheKey = this.getCacheKey(options)
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached
    }

    // Load all data in parallel
    const [testCases, testPlans, testRuns] = await Promise.all([
      FileUtils.getAllTestCases(),
      FileUtils.getAllTestPlans(),
      FileUtils.getAllTestRuns()
    ])

    // Filter data by time range
    const filteredData = this.filterByTimeRange(
      { testCases, testPlans, testRuns },
      options.timeRange
    )

    // Calculate all statistics
    const stats: DashboardStats = {
      overview: this.calculateOverview(filteredData),
      testCases: await this.calculateTestCaseStats(filteredData.testCases, options),
      testPlans: await this.calculateTestPlanStats(filteredData.testPlans, filteredData.testRuns, options),
      testRuns: await this.calculateTestRunStats(filteredData.testRuns, options),
      performance: await this.calculatePerformanceStats(filteredData.testRuns, filteredData.testCases),
      quality: await this.calculateQualityMetrics(filteredData.testRuns, filteredData.testCases),
      activity: await this.calculateActivityStats(filteredData, options),
      lastUpdated: new Date().toISOString(),
      timeRange: options.timeRange
    }

    // Cache the results
    this.setCache(cacheKey, stats, options.timeRange)

    return stats
  }

  /**
   * Calculate overview statistics
   */
  private static calculateOverview(data: {
    testCases: TestCase[]
    testPlans: TestPlan[]
    testRuns: TestRun[]
  }) {
    const { testCases, testPlans, testRuns } = data

    // Calculate overall pass rate
    let totalTests = 0
    let passedTests = 0

    testRuns.forEach(run => {
      if (run.results && Array.isArray(run.results)) {
        run.results.forEach(result => {
          totalTests++
          const status = calculateTestCaseStatus(result.steps || [])
          if (status === 'pass') {
            passedTests++
          }
        })
      }
    })

    const overallPassRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    const activeTestRuns = testRuns.filter(run => run.status === 'in_progress').length

    return {
      totalTestCases: testCases.length,
      totalTestPlans: testPlans.length,
      totalTestRuns: testRuns.length,
      overallPassRate,
      activeTestRuns
    }
  }

  /**
   * Calculate test case statistics with trends
   */
  private static async calculateTestCaseStats(
    testCases: TestCase[],
    options: StatsOptions
  ): Promise<TestCaseStats> {
    // Get previous period data for trends
    const previousData = await this.getPreviousPeriodTestCases(options.timeRange)
    
    // Count by priority
    const byPriority: Record<Priority, StatWithTrend> = {
      low: this.createStatWithTrend(0, 0),
      medium: this.createStatWithTrend(0, 0),
      high: this.createStatWithTrend(0, 0),
      critical: this.createStatWithTrend(0, 0)
    }

    const previousByPriority: Record<Priority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    // Count current period
    testCases.forEach(tc => {
      if (tc.priority) {
        const priority = tc.priority.toLowerCase() as Priority
        if (priority in byPriority) {
          byPriority[priority].value++
        }
      }
    })

    // Count previous period
    previousData.forEach(tc => {
      if (tc.priority) {
        const priority = tc.priority.toLowerCase() as Priority
        if (priority in previousByPriority) {
          previousByPriority[priority]++
        }
      }
    })

    // Update trends for priorities
    Object.keys(byPriority).forEach(priority => {
      const p = priority as Priority
      byPriority[p] = this.createStatWithTrend(
        byPriority[p].value,
        previousByPriority[p]
      )
    })

    // Count by creation date
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

    const created = {
      today: testCases.filter(tc => {
        try {
          return tc.createdAt && new Date(tc.createdAt) >= today
        } catch {
          return false
        }
      }).length,
      thisWeek: testCases.filter(tc => {
        try {
          return tc.createdAt && new Date(tc.createdAt) >= weekAgo
        } catch {
          return false
        }
      }).length,
      thisMonth: testCases.filter(tc => {
        try {
          return tc.createdAt && new Date(tc.createdAt) >= monthAgo
        } catch {
          return false
        }
      }).length
    }

    // Calculate average steps per test
    const totalSteps = testCases.reduce((sum, tc) => sum + (tc.steps?.length || 0), 0)
    const averageStepsPerTest = testCases.length > 0 
      ? Math.round(totalSteps / testCases.length) 
      : 0

    // Find most tested features (by tags)
    const featureCounts = new Map<string, number>()
    testCases.forEach(tc => {
      if (tc.tags && Array.isArray(tc.tags)) {
        tc.tags.forEach(tag => {
          featureCounts.set(tag, (featureCounts.get(tag) || 0) + 1)
        })
      }
    })

    const mostTestedFeatures = Array.from(featureCounts.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // For now, simulate status counts (in real app, would track execution status)
    const totalCount = testCases.length
    const byStatus = {
      pass: this.createStatWithTrend(Math.floor(totalCount * 0.7), Math.floor(previousData.length * 0.65)),
      fail: this.createStatWithTrend(Math.floor(totalCount * 0.15), Math.floor(previousData.length * 0.2)),
      skip: this.createStatWithTrend(Math.floor(totalCount * 0.05), Math.floor(previousData.length * 0.05)),
      notRun: this.createStatWithTrend(Math.floor(totalCount * 0.1), Math.floor(previousData.length * 0.1))
    }

    return {
      total: this.createStatWithTrend(testCases.length, previousData.length),
      byPriority,
      byStatus,
      created,
      averageStepsPerTest,
      mostTestedFeatures
    }
  }

  /**
   * Calculate test plan statistics
   */
  private static async calculateTestPlanStats(
    testPlans: TestPlan[],
    testRuns: TestRun[],
    options: StatsOptions
  ): Promise<TestPlanStats> {
    const previousPlans = await this.getPreviousPeriodTestPlans(options.timeRange)
    
    // Count by status (simplified - in real app would track actual status)
    const activePlans = testPlans.filter(p => {
      const hasRecentRun = testRuns.some(r => 
        r.testPlanId === p.id && 
        new Date(r.startedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      return hasRecentRun
    }).length

    const completedPlans = testPlans.length - activePlans
    
    const byStatus = {
      active: this.createStatWithTrend(activePlans, Math.floor(previousPlans.length * 0.3)),
      completed: this.createStatWithTrend(completedPlans, Math.floor(previousPlans.length * 0.6)),
      draft: this.createStatWithTrend(0, Math.floor(previousPlans.length * 0.1))
    }

    // Calculate average tests per plan
    const totalTests = testPlans.reduce((sum, plan) => {
      // Handle plans that might not have testCaseIds property
      const testCount = plan.testCaseIds?.length || 0
      return sum + testCount
    }, 0)
    const averageTestsPerPlan = testPlans.length > 0 
      ? Math.round(totalTests / testPlans.length) 
      : 0

    // Calculate completion rate
    const completionRate = testPlans.length > 0
      ? Math.round((completedPlans / testPlans.length) * 100)
      : 0
    const previousCompletionRate = previousPlans.length > 0
      ? Math.round((previousPlans.length * 0.6 / previousPlans.length) * 100)
      : 0

    // Calculate average duration (from test runs)
    const planDurations = new Map<string, number[]>()
    testRuns.forEach(run => {
      if (run.completedAt) {
        const duration = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
        const durationMinutes = duration / (1000 * 60)
        
        if (!planDurations.has(run.testPlanId)) {
          planDurations.set(run.testPlanId, [])
        }
        planDurations.get(run.testPlanId)!.push(durationMinutes)
      }
    })

    let totalDuration = 0
    let planCount = 0
    planDurations.forEach(durations => {
      if (durations.length > 0) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
        totalDuration += avgDuration
        planCount++
      }
    })

    const averageDuration = planCount > 0 ? Math.round(totalDuration / planCount) : 0

    return {
      total: this.createStatWithTrend(testPlans.length, previousPlans.length),
      byStatus,
      averageTestsPerPlan,
      completionRate: this.createStatWithTrend(completionRate, previousCompletionRate),
      averageDuration: {
        value: averageDuration,
        trend: averageDuration > 45 ? 'up' : averageDuration < 30 ? 'down' : 'stable'
      }
    }
  }

  /**
   * Calculate test run statistics
   */
  private static async calculateTestRunStats(
    testRuns: TestRun[],
    options: StatsOptions
  ): Promise<TestRunStats> {
    const previousRuns = await this.getPreviousPeriodTestRuns(options.timeRange)
    
    // Calculate pass/fail/skip rates
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    let skippedTests = 0

    const executorStats = new Map<string, { runs: number; passed: number; total: number }>()
    const failureReasons = new Map<string, number>()

    testRuns.forEach(run => {
      // Track executor stats
      const executor = run.executedBy || 'Unknown'
      if (!executorStats.has(executor)) {
        executorStats.set(executor, { runs: 0, passed: 0, total: 0 })
      }
      const execStats = executorStats.get(executor)!
      execStats.runs++

      if (run.results && Array.isArray(run.results)) {
        run.results.forEach(result => {
          totalTests++
          execStats.total++
          
          const status = calculateTestCaseStatus(result.steps || [])
          if (status === 'pass') {
            passedTests++
            execStats.passed++
          } else if (status === 'fail') {
            failedTests++
            // Track failure reasons
            const failureStep = result.steps?.find(s => s.status === 'fail')
            const reason = failureStep?.comment || 'Unknown reason'
            failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1)
          } else if (status === 'skip') {
            skippedTests++
          }
        })
      }
    })

    // Calculate rates
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    const failRate = totalTests > 0 ? Math.round((failedTests / totalTests) * 100) : 0
    const skipRate = totalTests > 0 ? Math.round((skippedTests / totalTests) * 100) : 0

    // Previous period calculations (simplified)
    const previousTotal = previousRuns.reduce((sum, run) => sum + run.results.length, 0)
    const previousPassRate = 65 // Simulated
    const previousFailRate = 25 // Simulated
    const previousSkipRate = 10 // Simulated

    // Calculate average duration
    const durations: number[] = []
    testRuns.forEach(run => {
      if (run.completedAt) {
        const duration = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
        durations.push(duration / (1000 * 60)) // Convert to minutes
      }
    })
    const averageDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    // Format executor stats
    const byExecutor = Array.from(executorStats.entries())
      .map(([executor, stats]) => ({
        executor,
        runs: stats.runs,
        passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5)

    // Format failure reasons
    const failureReasonsList = Array.from(failureReasons.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: failedTests > 0 ? Math.round((count / failedTests) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate execution trends (last 7 days)
    const trends = this.calculateExecutionTrends(testRuns, 7)

    return {
      total: this.createStatWithTrend(testRuns.length, previousRuns.length),
      passRate: this.createStatWithTrend(passRate, previousPassRate),
      failRate: this.createStatWithTrend(failRate, previousFailRate),
      skipRate: this.createStatWithTrend(skipRate, previousSkipRate),
      averageDuration: this.createStatWithTrend(averageDuration, 35), // Simulated previous
      byExecutor,
      failureReasons: failureReasonsList,
      executionTrends: trends
    }
  }

  /**
   * Calculate performance statistics
   */
  private static async calculatePerformanceStats(
    testRuns: TestRun[],
    testCases: TestCase[]
  ): Promise<PerformanceStats> {
    const testExecutionTimes = new Map<string, number[]>()

    // Collect execution times per test case
    testRuns.forEach(run => {
      if (run.results && Array.isArray(run.results)) {
        run.results.forEach(result => {
          if (result.duration) {
            if (!testExecutionTimes.has(result.testCaseId)) {
              testExecutionTimes.set(result.testCaseId, [])
            }
            testExecutionTimes.get(result.testCaseId)!.push(result.duration)
          }
        })
      }
    })

    // Calculate average execution time per test
    const testAverages: Array<{ testCaseId: string; averageTime: number }> = []
    let totalExecutionTime = 0
    let totalExecutions = 0

    testExecutionTimes.forEach((times, testCaseId) => {
      if (times.length > 0) {
        const average = times.reduce((a, b) => a + b, 0) / times.length
        testAverages.push({ testCaseId, averageTime: average })
        totalExecutionTime += times.reduce((a, b) => a + b, 0)
        totalExecutions += times.length
      }
    })

    const overallAverageTime = totalExecutions > 0
      ? totalExecutionTime / totalExecutions
      : 0

    // Sort to find slowest and fastest
    testAverages.sort((a, b) => b.averageTime - a.averageTime)

    // Get test case titles
    const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]))

    const slowestTests = testAverages.slice(0, 5).map(test => ({
      testCaseId: test.testCaseId,
      title: testCaseMap.get(test.testCaseId)?.title || 'Unknown Test',
      averageTime: Math.round(test.averageTime)
    }))

    const fastestTests = testAverages.slice(-5).reverse().map(test => ({
      testCaseId: test.testCaseId,
      title: testCaseMap.get(test.testCaseId)?.title || 'Unknown Test',
      averageTime: Math.round(test.averageTime)
    }))

    // Calculate execution time distribution
    const distribution = [
      { range: '0-30s', count: 0, percentage: 0 },
      { range: '30-60s', count: 0, percentage: 0 },
      { range: '60-120s', count: 0, percentage: 0 },
      { range: '120s+', count: 0, percentage: 0 }
    ]

    testAverages.forEach(test => {
      if (test.averageTime <= 30) {
        distribution[0].count++
      } else if (test.averageTime <= 60) {
        distribution[1].count++
      } else if (test.averageTime <= 120) {
        distribution[2].count++
      } else {
        distribution[3].count++
      }
    })

    const totalTests = testAverages.length
    distribution.forEach(range => {
      range.percentage = totalTests > 0 ? Math.round((range.count / totalTests) * 100) : 0
    })

    return {
      averageTestExecutionTime: this.createStatWithTrend(Math.round(overallAverageTime), 45),
      slowestTests,
      fastestTests,
      executionTimeDistribution: distribution
    }
  }

  /**
   * Calculate quality metrics
   */
  private static async calculateQualityMetrics(
    testRuns: TestRun[],
    testCases: TestCase[]
  ): Promise<QualityMetrics> {
    // Track test results per test case
    const testResults = new Map<string, Array<'pass' | 'fail'>>()
    const failureCounts = new Map<string, number>()

    testRuns.forEach(run => {
      if (run.results && Array.isArray(run.results)) {
        run.results.forEach(result => {
          const status = calculateTestCaseStatus(result.steps || [])
          if (status === 'pass' || status === 'fail') {
            if (!testResults.has(result.testCaseId)) {
              testResults.set(result.testCaseId, [])
              failureCounts.set(result.testCaseId, 0)
            }
            
            testResults.get(result.testCaseId)!.push(status)
            if (status === 'fail') {
              failureCounts.set(result.testCaseId, failureCounts.get(result.testCaseId)! + 1)
            }
          }
        })
      }
    })

    // Calculate flaky tests (tests that sometimes pass and sometimes fail)
    const flakyTests: QualityMetrics['flakyTests'] = []
    const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]))

    testResults.forEach((results, testCaseId) => {
      if (results.length >= 3) {
        const passes = results.filter(r => r === 'pass').length
        const fails = results.filter(r => r === 'fail').length
        
        // A test is flaky if it has both passes and fails
        if (passes > 0 && fails > 0) {
          const flakinessScore = Math.round((Math.min(passes, fails) / results.length) * 100)
          flakyTests.push({
            testCaseId,
            title: testCaseMap.get(testCaseId)?.title || 'Unknown Test',
            flakinessScore,
            lastNResults: results.slice(-5) // Last 5 results
          })
        }
      }
    })

    // Sort flaky tests by flakiness score
    flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore)

    // Calculate most failing tests
    const mostFailingTests: QualityMetrics['mostFailingTests'] = []
    
    failureCounts.forEach((failCount, testCaseId) => {
      const totalRuns = testResults.get(testCaseId)?.length || 0
      if (totalRuns > 0 && failCount > 0) {
        const failureRate = Math.round((failCount / totalRuns) * 100)
        mostFailingTests.push({
          testCaseId,
          title: testCaseMap.get(testCaseId)?.title || 'Unknown Test',
          failureRate,
          failureCount: failCount
        })
      }
    })

    // Sort by failure rate
    mostFailingTests.sort((a, b) => b.failureRate - a.failureRate)

    // Calculate coverage and effectiveness (simplified)
    const totalFeatures = 10 // This would come from your feature tracking
    const coveredFeatures = Math.min(testCases.length / 10, totalFeatures)
    const testCoverage = Math.round((coveredFeatures / totalFeatures) * 100)

    // Defect escape rate (bugs found in production vs testing)
    const defectEscapeRate = 5 // This would come from bug tracking integration

    // Test effectiveness (% of tests that find bugs)
    const testEffectiveness = 85 // This would be calculated from bug-to-test mapping

    return {
      testCoverage: this.createStatWithTrend(testCoverage, 75),
      defectEscapeRate: this.createStatWithTrend(defectEscapeRate, 8),
      testEffectiveness: this.createStatWithTrend(testEffectiveness, 80),
      flakyTests: flakyTests.slice(0, 5),
      mostFailingTests: mostFailingTests.slice(0, 5)
    }
  }

  /**
   * Calculate activity statistics
   */
  private static async calculateActivityStats(
    data: {
      testCases: TestCase[]
      testPlans: TestPlan[]
      testRuns: TestRun[]
    },
    options: StatsOptions
  ): Promise<ActivityStats> {
    const activities: ActivityStats['recentActivity'] = []
    
    // Add test case creation activities
    data.testCases.forEach(tc => {
      activities.push({
        id: `tc-created-${tc.id}`,
        type: 'test_created',
        title: tc.title,
        description: `Test case created: ${tc.title}`,
        timestamp: tc.createdAt,
        user: tc.createdBy
      })
      
      if (tc.updatedAt !== tc.createdAt) {
        activities.push({
          id: `tc-updated-${tc.id}`,
          type: 'test_updated',
          title: tc.title,
          description: `Test case updated: ${tc.title}`,
          timestamp: tc.updatedAt,
          user: tc.updatedBy
        })
      }
    })

    // Add test plan activities
    data.testPlans.forEach(plan => {
      activities.push({
        id: `tp-created-${plan.id}`,
        type: 'plan_created',
        title: plan.name,
        description: `Test plan created: ${plan.name}`,
        timestamp: plan.createdAt,
        user: plan.createdBy
      })
    })

    // Add test execution activities
    data.testRuns.forEach(run => {
      activities.push({
        id: `tr-executed-${run.id}`,
        type: 'test_executed',
        title: `Test Run #${run.id}`,
        description: `Test run executed with ${run.results.length} tests`,
        timestamp: run.startedAt,
        user: run.executedBy
      })
    })

    // Sort by timestamp and take most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivity = activities.slice(0, options.limit || 10)

    // Calculate active users
    const userActions = new Map<string, { count: number; lastActive: string }>()
    
    activities.forEach(activity => {
      const user = activity.user || 'System'
      if (!userActions.has(user)) {
        userActions.set(user, { count: 0, lastActive: activity.timestamp })
      }
      const userStat = userActions.get(user)!
      userStat.count++
      if (new Date(activity.timestamp) > new Date(userStat.lastActive)) {
        userStat.lastActive = activity.timestamp
      }
    })

    const activeUsers = Array.from(userActions.entries())
      .map(([user, stats]) => ({
        user,
        actions: stats.count,
        lastActive: stats.lastActive
      }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 5)

    // Calculate peak activity hours
    const hourCounts = new Array(24).fill(0)
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours()
      hourCounts[hour]++
    })

    const peakActivityHours = hourCounts.map((count, hour) => ({
      hour,
      activityCount: count
    })).sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 5)

    return {
      recentActivity,
      activeUsers,
      peakActivityHours
    }
  }

  /**
   * Create a stat with trend information
   */
  private static createStatWithTrend(current: number, previous: number): StatWithTrend {
    const change = current - previous
    const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0
    const trend: TrendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

    return {
      value: current,
      previousValue: previous,
      change,
      changePercent,
      trend
    }
  }

  /**
   * Filter data by time range
   */
  private static filterByTimeRange(
    data: {
      testCases: TestCase[]
      testPlans: TestPlan[]
      testRuns: TestRun[]
    },
    timeRange: TimeRange
  ) {
    const cutoffDate = this.getTimeRangeCutoff(timeRange)
    
    return {
      testCases: data.testCases.filter(tc => {
        try {
          return tc.createdAt && new Date(tc.createdAt) >= cutoffDate
        } catch {
          return false
        }
      }),
      testPlans: data.testPlans.filter(tp => {
        try {
          return tp.createdAt && new Date(tp.createdAt) >= cutoffDate
        } catch {
          return false
        }
      }),
      testRuns: data.testRuns.filter(tr => {
        try {
          return tr.startedAt && new Date(tr.startedAt) >= cutoffDate
        } catch {
          return false
        }
      })
    }
  }

  /**
   * Get cutoff date for time range
   */
  private static getTimeRangeCutoff(timeRange: TimeRange): Date {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (timeRange) {
      case 'today':
        return today
      case 'week':
        return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      case 'quarter':
        return new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
      case 'year':
        return new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      case 'all':
      default:
        return new Date(0) // Beginning of time
    }
  }

  /**
   * Get previous period data for comparison
   */
  private static async getPreviousPeriodTestCases(timeRange: TimeRange): Promise<TestCase[]> {
    const allTestCases = await FileUtils.getAllTestCases()
    const currentCutoff = this.getTimeRangeCutoff(timeRange)
    const previousCutoff = this.getPreviousPeriodCutoff(timeRange)

    return allTestCases.filter(tc => {
      const createdDate = new Date(tc.createdAt)
      return createdDate >= previousCutoff && createdDate < currentCutoff
    })
  }

  private static async getPreviousPeriodTestPlans(timeRange: TimeRange): Promise<TestPlan[]> {
    const allTestPlans = await FileUtils.getAllTestPlans()
    const currentCutoff = this.getTimeRangeCutoff(timeRange)
    const previousCutoff = this.getPreviousPeriodCutoff(timeRange)

    return allTestPlans.filter(tp => {
      const createdDate = new Date(tp.createdAt)
      return createdDate >= previousCutoff && createdDate < currentCutoff
    })
  }

  private static async getPreviousPeriodTestRuns(timeRange: TimeRange): Promise<TestRun[]> {
    const allTestRuns = await FileUtils.getAllTestRuns()
    const currentCutoff = this.getTimeRangeCutoff(timeRange)
    const previousCutoff = this.getPreviousPeriodCutoff(timeRange)

    return allTestRuns.filter(tr => {
      const startDate = new Date(tr.startedAt)
      return startDate >= previousCutoff && startDate < currentCutoff
    })
  }

  /**
   * Get previous period cutoff date
   */
  private static getPreviousPeriodCutoff(timeRange: TimeRange): Date {
    const currentCutoff = this.getTimeRangeCutoff(timeRange)
    const now = new Date()

    switch (timeRange) {
      case 'today':
        return new Date(currentCutoff.getTime() - 24 * 60 * 60 * 1000)
      case 'week':
        return new Date(currentCutoff.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(currentCutoff.getFullYear(), currentCutoff.getMonth() - 1, currentCutoff.getDate())
      case 'quarter':
        return new Date(currentCutoff.getFullYear(), currentCutoff.getMonth() - 3, currentCutoff.getDate())
      case 'year':
        return new Date(currentCutoff.getFullYear() - 1, currentCutoff.getMonth(), currentCutoff.getDate())
      case 'all':
      default:
        return new Date(0)
    }
  }

  /**
   * Calculate execution trends for the last N days
   */
  private static calculateExecutionTrends(testRuns: TestRun[], days: number) {
    const trends: Array<{
      date: string
      passed: number
      failed: number
      skipped: number
      total: number
    }> = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      let passed = 0
      let failed = 0
      let skipped = 0
      let total = 0

      testRuns.forEach(run => {
        try {
          const runDate = new Date(run.startedAt)
          if (runDate.toISOString().split('T')[0] === dateStr) {
            if (run.results && Array.isArray(run.results)) {
              run.results.forEach(result => {
                total++
                const status = calculateTestCaseStatus(result.steps || [])
                if (status === 'pass') passed++
                else if (status === 'fail') failed++
                else if (status === 'skip') skipped++
              })
            }
          }
        } catch {
          // Skip runs with invalid dates
        }
      })

      trends.push({ date: dateStr, passed, failed, skipped, total })
    }

    return trends
  }

  /**
   * Cache management
   */
  private static getCacheKey(options: StatsOptions): string {
    return `stats-${options.timeRange}-${options.groupBy || 'none'}`
  }

  private static getFromCache(key: string): DashboardStats | null {
    const entry = this.cache.get(key)
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data
    }
    return null
  }

  private static setCache(key: string, data: DashboardStats, timeRange: TimeRange): void {
    const ttl = timeRange === 'today' ? 60000 : this.CACHE_TTL // 1 minute for today, 5 minutes for others
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeRange,
      expiresAt: Date.now() + ttl
    })
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear()
  }
}