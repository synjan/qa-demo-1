import { TestCase } from './types'

export interface TestCaseStats {
  total: number
  byPriority: {
    high: number
    medium: number
    low: number
    critical: number
  }
  recentCount: number
}

export class TestCaseStatsUtils {
  /**
   * Calculate comprehensive statistics for test cases
   */
  static calculateStats(testCases: TestCase[]): TestCaseStats {
    const stats: TestCaseStats = {
      total: testCases.length,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
        critical: 0
      },
      recentCount: 0
    }

    // Calculate cutoff date for recent test cases (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    testCases.forEach(testCase => {
      // Count by priority - normalize various priority formats
      const priority = this.normalizePriority(testCase.priority)
      if (priority in stats.byPriority) {
        stats.byPriority[priority as keyof typeof stats.byPriority]++
      }

      // Count recent test cases
      const createdDate = new Date(testCase.createdAt)
      if (createdDate >= sevenDaysAgo) {
        stats.recentCount++
      }
    })

    return stats
  }

  /**
   * Normalize priority values to handle different formats
   * (e.g., "høy" -> "high", "kritisk" -> "critical")
   */
  private static normalizePriority(priority: string): string {
    const normalizedPriority = priority.toLowerCase().trim()
    
    // Map Norwegian/other language priorities to English
    const priorityMap: Record<string, string> = {
      'høy': 'high',
      'medium': 'medium',
      'lav': 'low',
      'low': 'low',
      'high': 'high',
      'kritisk': 'critical',
      'critical': 'critical'
    }

    return priorityMap[normalizedPriority] || 'medium'
  }

  /**
   * Get badge variant for priority level
   */
  static getPriorityBadgeVariant(priority: 'high' | 'medium' | 'low' | 'critical'): 'destructive' | 'default' | 'secondary' | 'outline' {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  /**
   * Get color classes for custom styling
   */
  static getPriorityColorClass(priority: 'high' | 'medium' | 'low' | 'critical'): string {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white border-red-600'
      case 'high':
        return 'bg-red-500 text-white border-red-500'
      case 'medium':
        return 'bg-yellow-500 text-white border-yellow-500'
      case 'low':
        return 'bg-green-500 text-white border-green-500'
      default:
        return 'bg-gray-500 text-white border-gray-500'
    }
  }
}