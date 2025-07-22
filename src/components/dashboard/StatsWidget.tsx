'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, X } from 'lucide-react'

interface DashboardStats {
  totalTestCases: number
  totalTestPlans: number
  totalTestRuns: number
  passRate: number
  recentTestRuns: number
  recentTestCases: number
  recentTestPlans: number
  activeTestRuns: number
}

interface StatsWidgetProps {
  stats: DashboardStats | null
  loading: boolean
  editMode: boolean
  onRemove?: () => void
}

export function StatsWidget({ stats, loading, editMode, onRemove }: StatsWidgetProps) {
  const getChangeIndicator = (current: number, recent: number) => {
    if (recent > 0) {
      return `+${recent} this week`
    }
    return 'No recent activity'
  }

  return (
    <div className="relative mb-8">
      {editMode && onRemove && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2 w-20"></div>
                  <div className="h-8 bg-muted rounded mb-2 w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Test Cases</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTestCases}</p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {getChangeIndicator(stats.totalTestCases, stats.recentTestCases)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Test Plans</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTestPlans}</p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {getChangeIndicator(stats.totalTestPlans, stats.recentTestPlans)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Test Runs</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTestRuns}</p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {getChangeIndicator(stats.totalTestRuns, stats.recentTestRuns)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                    <p className="text-2xl font-bold text-foreground">{stats.passRate}%</p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Based on {stats.totalTestRuns} runs
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="col-span-4 text-center text-muted-foreground">
            Failed to load statistics
          </div>
        )}
      </div>
    </div>
  )
}