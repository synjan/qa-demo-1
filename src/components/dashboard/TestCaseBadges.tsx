'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { TestCase } from '@/lib/types'
import { TestCaseStats, TestCaseStatsUtils } from '@/lib/testcase-stats'
import { TestTube2, Calendar, Target, AlertTriangle, AlertOctagon, MinusCircle } from 'lucide-react'

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
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-6 w-20 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="text-muted-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error loading stats
        </Badge>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Total Test Cases */}
      <Badge variant="default" className="bg-primary text-primary-foreground">
        <TestTube2 className="h-3 w-3 mr-1" />
        Total: {stats.total}
      </Badge>

      {/* High Priority */}
      {stats.byPriority.high > 0 && (
        <Badge 
          variant="destructive" 
          className="bg-red-500 hover:bg-red-600 border-red-500"
        >
          <AlertOctagon className="h-3 w-3 mr-1" />
          High: {stats.byPriority.high}
        </Badge>
      )}

      {/* Critical Priority */}
      {stats.byPriority.critical > 0 && (
        <Badge 
          variant="destructive" 
          className="bg-red-600 hover:bg-red-700 border-red-600"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical: {stats.byPriority.critical}
        </Badge>
      )}

      {/* Medium Priority */}
      {stats.byPriority.medium > 0 && (
        <Badge 
          variant="default" 
          className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-white"
        >
          <Target className="h-3 w-3 mr-1" />
          Medium: {stats.byPriority.medium}
        </Badge>
      )}

      {/* Low Priority */}
      {stats.byPriority.low > 0 && (
        <Badge 
          variant="secondary" 
          className="bg-green-500 hover:bg-green-600 border-green-500 text-white"
        >
          <MinusCircle className="h-3 w-3 mr-1" />
          Low: {stats.byPriority.low}
        </Badge>
      )}

      {/* Recent Test Cases (Last 7 Days) */}
      {stats.recentCount > 0 && (
        <Badge variant="outline" className="border-blue-300 text-blue-600">
          <Calendar className="h-3 w-3 mr-1" />
          Recent (7d): {stats.recentCount}
        </Badge>
      )}
    </div>
  )
}