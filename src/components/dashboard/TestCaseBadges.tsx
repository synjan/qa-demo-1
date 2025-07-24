'use client'

import { useEffect, useState } from 'react'
import { TestCase } from '@/lib/types'
import { TestCaseStats, TestCaseStatsUtils } from '@/lib/testcase-stats'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, AlertTriangle, FileText, Calendar } from 'lucide-react'

interface TestCaseBadgesProps {
  className?: string
}

export function TestCaseBadges({ className }: TestCaseBadgesProps) {
  const [stats, setStats] = useState<TestCaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTestCaseStats()
  }, [])

  const loadTestCaseStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/testcases')
      if (!response.ok) {
        throw new Error('Failed to fetch test cases')
      }
      
      const testCases: TestCase[] = await response.json()
      const calculatedStats = TestCaseStatsUtils.calculateStats(testCases)
      setStats(calculatedStats)
    } catch (err) {
      console.error('Error loading test case stats:', err)
      setError('Failed to load test case statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex gap-4 ${className}`}>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground text-sm ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <span>{error || 'No test case data available'}</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {/* Total Test Cases Badge */}
      <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
        <FileText className="h-4 w-4" />
        <span className="font-medium">Total: {stats.total}</span>
      </Badge>

      {/* Priority Badges */}
      {stats.byPriority.critical > 0 && (
        <Badge 
          variant={TestCaseStatsUtils.getPriorityVariant('critical')} 
          className="flex items-center gap-2 px-3 py-1"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Critical: {stats.byPriority.critical}</span>
        </Badge>
      )}

      {stats.byPriority.high > 0 && (
        <Badge 
          variant={TestCaseStatsUtils.getPriorityVariant('high')} 
          className="flex items-center gap-2 px-3 py-1"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>High: {stats.byPriority.high}</span>
        </Badge>
      )}

      {stats.byPriority.medium > 0 && (
        <Badge 
          variant={TestCaseStatsUtils.getPriorityVariant('medium')} 
          className="flex items-center gap-2 px-3 py-1"
        >
          <Activity className="h-4 w-4" />
          <span>Medium: {stats.byPriority.medium}</span>
        </Badge>
      )}

      {stats.byPriority.low > 0 && (
        <Badge 
          variant={TestCaseStatsUtils.getPriorityVariant('low')} 
          className="flex items-center gap-2 px-3 py-1"
        >
          <Activity className="h-4 w-4" />
          <span>Low: {stats.byPriority.low}</span>
        </Badge>
      )}

      {/* Recent Test Cases Badge */}
      {stats.recent > 0 && (
        <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
          <Calendar className="h-4 w-4" />
          <span>Recent: {stats.recent}</span>
        </Badge>
      )}
    </div>
  )
}