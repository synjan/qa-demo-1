'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardStats, TimeRange } from '@/lib/stats-types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Activity, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TestCaseBadgesProps {
  className?: string
  timeRange?: TimeRange
  onPriorityClick?: (priority: string) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

export function TestCaseBadges({ 
  className, 
  timeRange = 'week',
  onPriorityClick,
  autoRefresh = false,
  refreshInterval = 60000 // 1 minute
}: TestCaseBadgesProps) {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadTestCaseStats()
    
    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadTestCaseStats(true)
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [timeRange, autoRefresh, refreshInterval])

  const loadTestCaseStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      
      const data: DashboardStats = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error loading test case stats:', err)
      setError('Failed to load test case statistics')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Calculate percentage distribution
  const percentages = useMemo(() => {
    if (!stats) return null
    const total = stats.testCases.total.value
    if (total === 0) return null

    return {
      critical: Math.round((stats.testCases.byPriority.critical.value / total) * 100),
      high: Math.round((stats.testCases.byPriority.high.value / total) * 100),
      medium: Math.round((stats.testCases.byPriority.medium.value / total) * 100),
      low: Math.round((stats.testCases.byPriority.low.value / total) * 100)
    }
  }, [stats])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'default'
    }
  }

  const handleBadgeClick = (priority?: string) => {
    if (priority && onPriorityClick) {
      onPriorityClick(priority)
    } else if (!priority) {
      router.push('/testcases')
    }
  }

  if (loading) {
    return (
      <div className={cn("flex flex-wrap gap-3", className)}>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground text-sm", className)}>
        <AlertTriangle className="h-4 w-4" />
        <span>{error || 'No test case data available'}</span>
        <button
          onClick={() => loadTestCaseStats()}
          className="ml-2 text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const testCaseStats = stats.testCases

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="animate-spin text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
          </div>
        )}

        {/* Total Test Cases Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-primary/20 hover:bg-primary/5"
              onClick={() => handleBadgeClick()}
            >
              <FileText className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
              <span className="font-medium">Total: {testCaseStats.total.value}</span>
              {testCaseStats.total.trend !== 'stable' && (
                <span className={cn(
                  "ml-1 flex items-center gap-0.5 text-xs",
                  testCaseStats.total.trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {getTrendIcon(testCaseStats.total.trend)}
                  {Math.abs(testCaseStats.total.changePercent)}%
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">Total Test Cases</p>
              <p>Previous: {testCaseStats.total.previousValue}</p>
              <p>Change: {testCaseStats.total.change > 0 ? '+' : ''}{testCaseStats.total.change}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Priority Badges */}
        {testCaseStats.byPriority.critical.value > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={getPriorityVariant('critical')}
                className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                onClick={() => handleBadgeClick('critical')}
              >
                <AlertTriangle className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                <span>Critical: {testCaseStats.byPriority.critical.value}</span>
                {percentages && (
                  <span className="text-xs opacity-75">({percentages.critical}%)</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">Critical Priority</p>
                <p>Previous: {testCaseStats.byPriority.critical.previousValue}</p>
                <p>Change: {testCaseStats.byPriority.critical.change > 0 ? '+' : ''}{testCaseStats.byPriority.critical.change}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {testCaseStats.byPriority.high.value > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={getPriorityVariant('high')}
                className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                onClick={() => handleBadgeClick('high')}
              >
                <AlertTriangle className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                <span>High: {testCaseStats.byPriority.high.value}</span>
                {percentages && (
                  <span className="text-xs opacity-75">({percentages.high}%)</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">High Priority</p>
                <p>Previous: {testCaseStats.byPriority.high.previousValue}</p>
                <p>Change: {testCaseStats.byPriority.high.change > 0 ? '+' : ''}{testCaseStats.byPriority.high.change}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {testCaseStats.byPriority.medium.value > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={getPriorityVariant('medium')}
                className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
                onClick={() => handleBadgeClick('medium')}
              >
                <Activity className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                <span>Medium: {testCaseStats.byPriority.medium.value}</span>
                {percentages && (
                  <span className="text-xs opacity-75">({percentages.medium}%)</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">Medium Priority</p>
                <p>Previous: {testCaseStats.byPriority.medium.previousValue}</p>
                <p>Change: {testCaseStats.byPriority.medium.change > 0 ? '+' : ''}{testCaseStats.byPriority.medium.change}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {testCaseStats.byPriority.low.value > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={getPriorityVariant('low')}
                className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                onClick={() => handleBadgeClick('low')}
              >
                <Activity className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                <span>Low: {testCaseStats.byPriority.low.value}</span>
                {percentages && (
                  <span className="text-xs opacity-75">({percentages.low}%)</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">Low Priority</p>
                <p>Previous: {testCaseStats.byPriority.low.previousValue}</p>
                <p>Change: {testCaseStats.byPriority.low.change > 0 ? '+' : ''}{testCaseStats.byPriority.low.change}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Recent Test Cases Badge */}
        {testCaseStats.created.thisWeek > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="group flex items-center gap-2 px-3 py-1.5 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-secondary/80"
              >
                <Calendar className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                <span>Recent: {testCaseStats.created.thisWeek}</span>
                <ChevronRight className="h-3 w-3 opacity-50 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">Recently Created</p>
                <p>Today: {testCaseStats.created.today}</p>
                <p>This Week: {testCaseStats.created.thisWeek}</p>
                <p>This Month: {testCaseStats.created.thisMonth}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}