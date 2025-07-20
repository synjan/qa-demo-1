'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TestTube2, FolderOpen, GitBranch, Plus, TrendingUp, Loader2, Play, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    title: 'Generate Test Cases',
    description: 'Create test cases from GitHub issues using AI',
    icon: TestTube2,
    href: '/github',
    color: 'bg-primary'
  },
  {
    title: 'Create Test Plan',
    description: 'Build a new test plan from existing test cases',
    icon: FolderOpen,
    href: '/testplans/new',
    color: 'bg-emerald-500'
  },
  {
    title: 'Browse Issues',
    description: 'View and select GitHub issues for testing',
    icon: GitBranch,
    href: '/github',
    color: 'bg-purple-500'
  }
]

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

interface Activity {
  id: string
  type: 'test_run' | 'test_case' | 'test_plan'
  title: string
  description: string
  timestamp: string
  status: string
  metadata: any
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('github_pat')
      if (!hasToken) {
        router.push('/auth/signin')
        return
      }
    }
    
    // Load dashboard data
    loadDashboardData()
  }, [session, status, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activity?limit=5')
      ])
      
      if (!statsResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to load dashboard data')
      }
      
      const [statsData, activityData] = await Promise.all([
        statsResponse.json(),
        activityResponse.json()
      ])
      
      setStats(statsData)
      setActivity(activityData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

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

  const getChangeIndicator = (current: number, recent: number) => {
    if (recent > 0) {
      return `+${recent} this week`
    }
    return 'No recent activity'
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome to QA Test Manager. Manage your test cases, plans, and GitHub integration.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={action.href}>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Get Started
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
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
                    <Button variant="outline" size="sm" onClick={loadDashboardData}>
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
      </main>
    </div>
  )
}