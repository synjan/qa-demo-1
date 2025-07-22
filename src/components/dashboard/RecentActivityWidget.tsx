'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TestTube2, FolderOpen, CheckCircle, Play, Clock, Loader2, X } from 'lucide-react'

interface Activity {
  id: string
  type: 'test_run' | 'test_case' | 'test_plan'
  title: string
  description: string
  timestamp: string
  status: string
  metadata: any
}

interface RecentActivityWidgetProps {
  activity: Activity[]
  loading: boolean
  onRefresh: () => void
  editMode: boolean
  onRemove?: () => void
}

export function RecentActivityWidget({ activity, loading, onRefresh, editMode, onRemove }: RecentActivityWidgetProps) {
  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'test_run':
        if (status === 'completed') return <CheckCircle className="h-4 w-4 text-success" />
        if (status === 'in_progress') return <Play className="h-4 w-4 text-info" />
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'test_case':
        return <TestTube2 className="h-4 w-4 text-info" />
      case 'test_plan':
        return <FolderOpen className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'test_run': return 'Test Run'
      case 'test_case': return 'Test Case'
      case 'test_plan': return 'Test Plan'
      default: return type
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="relative">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest test cases, plans, and runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-muted rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-2 w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(item.type, item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getActivityTypeLabel(item.type)}
                      </Badge>
                      {item.status === 'completed' && item.type === 'test_run' && (
                        <Badge className="text-xs bg-success/10 text-success border-success/20">
                          {item.metadata.passedCount}/{item.metadata.testCount} passed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(item.timestamp)}</span>
                      {item.metadata.stepCount && (
                        <span>• {item.metadata.stepCount} steps</span>
                      )}
                      {item.metadata.testCaseCount && (
                        <span>• {item.metadata.testCaseCount} test cases</span>
                      )}
                      {item.metadata.priority && (
                        <Badge variant="outline" className="text-xs">
                          {item.metadata.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <Loader2 className="h-3 w-3 mr-2" />
                  Refresh Activity
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No recent activity</p>
              <p className="text-sm">Start by creating test cases or connecting to GitHub</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}