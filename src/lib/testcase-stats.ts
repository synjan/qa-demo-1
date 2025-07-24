import { TestCase } from './types'

export interface TestCaseStats {
  total: number
  byPriority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  recent: number
}

export class TestCaseStatsUtils {
  private static normalizePriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    // Handle multilingual priorities and normalize them
    const normalizedPriority = priority.toLowerCase().trim()
    
    // Map various priority names to standard values
    switch (normalizedPriority) {
      case 'low':
      case 'lav':
      case 'niedrig':
      case 'bas':
        return 'low'
      case 'medium':
      case 'middels':
      case 'mittel':
      case 'moyen':
        return 'medium'
      case 'high':
      case 'høy':
      case 'hoch':
      case 'élevé':
        return 'high'
      case 'critical':
      case 'kritisk':
      case 'kritisch':
      case 'critique':
        return 'critical'
      default:
        return 'medium' // Default fallback
    }
  }

  static calculateStats(testCases: TestCase[]): TestCaseStats {
    const stats: TestCaseStats = {
      total: testCases.length,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      recent: 0
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    testCases.forEach((testCase) => {
      // Count by priority (using static method call - bug fix applied!)
      const priority = TestCaseStatsUtils.normalizePriority(testCase.priority)
      stats.byPriority[priority]++

      // Count recent test cases (created in last 7 days)
      const createdDate = new Date(testCase.createdAt)
      if (createdDate >= sevenDaysAgo) {
        stats.recent++
      }
    })

    return stats
  }

  static getPriorityColor(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'low':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  static getPriorityVariant(priority: 'low' | 'medium' | 'high' | 'critical'): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (priority) {
      case 'low':
        return 'outline'
      case 'medium':
        return 'secondary'
      case 'high':
      case 'critical':
        return 'destructive'
      default:
        return 'default'
    }
  }
}