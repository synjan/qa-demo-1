'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  X,
  FileText,
  FolderOpen,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { DashboardStats, TimeRange } from '@/lib/stats-types'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface StatsWidgetProps {
  timeRange?: TimeRange
  loading: boolean
  editMode: boolean
  onRemove?: () => void
}

export function StatsWidget({ timeRange = 'week', loading, editMode, onRemove }: StatsWidgetProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [timeRange])

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`)
      if (!response.ok) throw new Error('Failed to load stats')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError('Failed to load statistics')
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', size = 'h-4 w-4') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={size} />
      case 'down':
        return <TrendingDown className={size} />
      default:
        return <Minus className={size} />
    }
  }

  const getChangeColor = (trend: 'up' | 'down' | 'stable', isPositiveGood = true) => {
    if (trend === 'stable') return 'text-muted-foreground'
    if (trend === 'up') return isPositiveGood ? 'text-green-600' : 'text-red-600'
    return isPositiveGood ? 'text-red-600' : 'text-green-600'
  }

  const formatChange = (change: number, percent: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change} (${sign}${percent}%)`
  }

  return (
    <div className="relative">
        {editMode && onRemove && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 z-50 h-6 w-6 p-0 rounded-full shadow-md"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2 w-20"></div>
                    <div className="h-8 bg-muted rounded mb-2 w-16"></div>
                    <div className="h-2 bg-muted rounded mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-4 text-center text-muted-foreground py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Test Cases Card */}
              <Card className="group relative overflow-hidden cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:scale-110" />
                          <p className="text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">Test Cases</p>
                        </div>
                        {stats.testCases.total.trend !== 'stable' && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            getChangeColor(stats.testCases.total.trend)
                          )}>
                            {stats.testCases.total.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(stats.testCases.total.changePercent)}%
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-3xl font-bold transition-all duration-200 group-hover:scale-110 origin-left">{stats.overview.totalTestCases}</p>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-muted-foreground/80">
                          {formatChange(stats.testCases.total.change, stats.testCases.total.changePercent)}
                        </p>
                      </div>

                      {/* Mini distribution chart */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Distribution</span>
                          <span className="text-muted-foreground">
                            {stats.testCases.created.thisWeek} new this week
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden flex transition-all duration-300 group-hover:h-3 group-hover:shadow-inner">
                          {stats.testCases.byPriority.critical.value > 0 && (
                            <div 
                              className="bg-red-500 h-full transition-all duration-300 hover:bg-red-600"
                              style={{
                                width: `${(stats.testCases.byPriority.critical.value / stats.overview.totalTestCases) * 100}%`
                              }}
                            />
                          )}
                          {stats.testCases.byPriority.high.value > 0 && (
                            <div 
                              className="bg-orange-500 h-full transition-all duration-300 hover:bg-orange-600"
                              style={{
                                width: `${(stats.testCases.byPriority.high.value / stats.overview.totalTestCases) * 100}%`
                              }}
                            />
                          )}
                          {stats.testCases.byPriority.medium.value > 0 && (
                            <div 
                              className="bg-yellow-500 h-full transition-all duration-300 hover:bg-yellow-600"
                              style={{
                                width: `${(stats.testCases.byPriority.medium.value / stats.overview.totalTestCases) * 100}%`
                              }}
                            />
                          )}
                          {stats.testCases.byPriority.low.value > 0 && (
                            <div 
                              className="bg-green-500 h-full transition-all duration-300 hover:bg-green-600"
                              style={{
                                width: `${(stats.testCases.byPriority.low.value / stats.overview.totalTestCases) * 100}%`
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
              </Card>
              
              {/* Test Plans Card */}
              <Card className="group relative overflow-hidden cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:scale-110" />
                          <p className="text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">Test Plans</p>
                        </div>
                        {stats.testPlans.total.trend !== 'stable' && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            getChangeColor(stats.testPlans.total.trend)
                          )}>
                            {stats.testPlans.total.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(stats.testPlans.total.changePercent)}%
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-3xl font-bold transition-all duration-200 group-hover:scale-110 origin-left">{stats.overview.totalTestPlans}</p>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-muted-foreground/80">
                          {formatChange(stats.testPlans.total.change, stats.testPlans.total.changePercent)}
                        </p>
                      </div>

                      {/* Completion rate */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">{stats.testPlans.completionRate.value}%</span>
                        </div>
                        <Progress value={stats.testPlans.completionRate.value} className="h-2 transition-all duration-300 group-hover:h-3" />
                      </div>
                    </CardContent>
              </Card>
              
              {/* Test Runs Card */}
              <Card className="group relative overflow-hidden cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:scale-110" />
                          <p className="text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">Test Runs</p>
                        </div>
                        {stats.testRuns.total.trend !== 'stable' && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            getChangeColor(stats.testRuns.total.trend)
                          )}>
                            {stats.testRuns.total.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(stats.testRuns.total.changePercent)}%
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-3xl font-bold transition-all duration-200 group-hover:scale-110 origin-left">{stats.overview.totalTestRuns}</p>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-muted-foreground/80">
                          {stats.overview.activeTestRuns} active
                        </p>
                      </div>

                      {/* Recent activity sparkline */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Recent activity</span>
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex items-end gap-0.5 h-8 transition-all duration-300 group-hover:h-10">
                          {stats.testRuns.executionTrends.slice(-7).map((day, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-primary/20 rounded-t transition-all duration-300 hover:bg-primary/30"
                              style={{
                                height: `${day.total > 0 ? (day.total / Math.max(...stats.testRuns.executionTrends.map(d => d.total))) * 100 : 5}%`,
                                minHeight: '2px'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
              </Card>
              
              {/* Pass Rate Card */}
              <Card className="group relative overflow-hidden cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:scale-110" />
                          <p className="text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">Pass Rate</p>
                        </div>
                        {stats.testRuns.passRate.trend !== 'stable' && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            getChangeColor(stats.testRuns.passRate.trend, true)
                          )}>
                            {stats.testRuns.passRate.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(stats.testRuns.passRate.changePercent)}%
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-3xl font-bold transition-all duration-200 group-hover:scale-110 origin-left">{stats.overview.overallPassRate}%</p>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-muted-foreground/80">
                          Based on {stats.overview.totalTestRuns} runs
                        </p>
                      </div>

                      {/* Pass/Fail distribution */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Success rate</span>
                          <span className={cn(
                            "font-medium",
                            stats.overview.overallPassRate >= 80 ? 'text-green-600' : 
                            stats.overview.overallPassRate >= 60 ? 'text-yellow-600' : 
                            'text-red-600'
                          )}>
                            {stats.overview.overallPassRate >= 80 ? 'Good' : 
                             stats.overview.overallPassRate >= 60 ? 'Fair' : 
                             'Needs Improvement'}
                          </span>
                        </div>
                        <div className="h-2 bg-red-500/20 rounded-full overflow-hidden transition-all duration-300 group-hover:h-3 group-hover:shadow-inner">
                          <div 
                            className="bg-green-500 h-full transition-all duration-500 hover:bg-green-600"
                            style={{ width: `${stats.overview.overallPassRate}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
              </Card>
            </>
          )}
        </div>
    </div>
  )
}