'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TestTube2, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FolderOpen,
  Search,
  Filter,
  History
} from 'lucide-react'
import { getGuestSession } from '@/lib/guest-auth'

interface TestCase {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  tags: string[]
  steps: any[]
}

interface TestPlan {
  id: string
  name: string
  description: string
  testCases: string[]
  status: string
}

interface ExecutionStats {
  totalTests: number
  executed: number
  passed: number
  failed: number
  blocked: number
}

export default function TestRunnerDashboard() {
  const router = useRouter()
  const [guestSession, setGuestSession] = useState<{ sessionId: string; name: string } | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [stats, setStats] = useState<ExecutionStats>({
    totalTests: 0,
    executed: 0,
    passed: 0,
    failed: 0,
    blocked: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getGuestSession()
    if (!session) {
      router.push('/auth/signin')
      return
    }
    setGuestSession(session)
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [testCasesRes, testPlansRes, statsRes] = await Promise.all([
        fetch('/api/testcases'),
        fetch('/api/testplans'),
        fetch('/api/test-runner/stats')
      ])

      if (testCasesRes.ok) {
        const cases = await testCasesRes.json()
        setTestCases(cases.slice(0, 10)) // Show first 10 for quick access
      }

      if (testPlansRes.ok) {
        const plans = await testPlansRes.json()
        setTestPlans(plans.slice(0, 8)) // Show first 8 plans
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const calculateProgress = () => {
    if (stats.totalTests === 0) return 0
    return (stats.executed / stats.totalTests) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <TestTube2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Test Runner...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome to Test Runner</h1>
        <p className="text-blue-100 mb-4">
          Hello, {guestSession?.name}! Execute test cases and track your progress.
        </p>
        <div className="flex gap-4">
          <Button 
            variant="secondary" 
            onClick={() => router.push('/test-runner/browse')}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Search className="mr-2 h-4 w-4" />
            Browse Tests
          </Button>
          <Button 
            variant="secondary"
            onClick={() => router.push('/test-runner/history')}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <History className="mr-2 h-4 w-4" />
            Execution History
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{stats.totalTests}</p>
              </div>
              <TestTube2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Executed</p>
                <p className="text-2xl font-bold">{stats.executed}</p>
              </div>
              <Play className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Progress</CardTitle>
          <CardDescription>
            Overall execution progress across all available test cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-muted-foreground">
                {stats.executed} of {stats.totalTests} tests
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{calculateProgress().toFixed(1)}% Complete</span>
              <span>{stats.totalTests - stats.executed} Remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Test Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test Access</CardTitle>
            <CardDescription>
              Recently available test cases for immediate execution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testCases.length > 0 ? (
              <>
                {testCases.slice(0, 5).map((testCase) => (
                  <div key={testCase.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium truncate">{testCase.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getPriorityColor(testCase.priority)} text-white text-xs`}>
                          {testCase.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {testCase.steps.length} steps
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/test-runner/execute/${testCase.id}`)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/test-runner/browse')}
                >
                  View All Test Cases
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TestTube2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No test cases available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Test Plans</CardTitle>
            <CardDescription>
              Execute organized test suites and track plan progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testPlans.length > 0 ? (
              <>
                {testPlans.slice(0, 5).map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium truncate">{plan.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {plan.testCases.length} tests
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {plan.status}
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/test-runner/plans/${plan.id}`)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Execute
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/test-runner/plans')}
                >
                  View All Test Plans
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No test plans available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common testing workflows and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/test-runner/browse')}
            >
              <Search className="h-6 w-6 mb-2" />
              Browse & Filter Tests
            </Button>
            
            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/test-runner/history')}
            >
              <History className="h-6 w-6 mb-2" />
              Execution History
            </Button>
            
            <Button 
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/test-runner/reports')}
            >
              <AlertCircle className="h-6 w-6 mb-2" />
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}