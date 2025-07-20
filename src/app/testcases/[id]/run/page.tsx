'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle,
  XCircle,
  SkipForward,
  AlertCircle,
  Clock,
  TestTube2,
  User,
  Calendar,
  Loader2,
  Save,
  ExternalLink
} from 'lucide-react'
import { TestCase, TestRun, TestResult, TestStepResult } from '@/lib/types'

export default function TestCaseRunnerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testCaseId = params.id as string
  
  // Core state
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [testRun, setTestRun] = useState<TestRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Execution state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null)
  
  // Results state
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [currentStepNotes, setCurrentStepNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('github_pat')
      if (!hasToken) {
        router.push('/auth/signin')
      }
    }
  }, [session, status, router])

  // Load test case
  useEffect(() => {
    if (testCaseId) {
      loadTestCase()
    }
  }, [testCaseId])

  const loadTestCase = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/testcases/${testCaseId}`)
      if (!response.ok) {
        throw new Error('Failed to load test case')
      }
      const testCaseData = await response.json()
      setTestCase(testCaseData)
      
      // Initialize test result
      initializeTestResult(testCaseData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test case')
    } finally {
      setLoading(false)
    }
  }

  const initializeTestResult = (testCaseData: TestCase) => {
    const result: TestResult = {
      testCaseId: testCaseData.id,
      status: 'skip',
      executedAt: '',
      steps: testCaseData.steps.map(step => ({
        stepId: step.id,
        status: 'skip'
      }))
    }
    setTestResult(result)
  }

  const startTestRun = async () => {
    if (!testCase || !session?.user?.name) return
    
    const newTestRun: TestRun = {
      id: crypto.randomUUID(),
      testPlanId: 'ad-hoc-single-test-case', // Special identifier for ad-hoc runs
      name: `Ad-hoc run: ${testCase.title}`,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      executedBy: session.user.name,
      results: testResult ? [testResult] : []
    }
    
    setTestRun(newTestRun)
    setIsRunning(true)
    setStartTime(new Date())
    setStepStartTime(new Date())
    setCurrentStepIndex(0)
  }

  const completeTestRun = async () => {
    if (!testRun || !testResult) return
    
    setSaving(true)
    try {
      const completedRun = {
        ...testRun,
        completedAt: new Date().toISOString(),
        status: 'completed' as const,
        results: [testResult]
      }
      
      // Save test run via API
      const response = await fetch('/api/testruns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedRun)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save test run')
      }
      
      setTestRun(completedRun)
      setIsRunning(false)
      
      // Redirect back to test cases page
      router.push('/testcases')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save test run')
    } finally {
      setSaving(false)
    }
  }

  const markStepResult = (status: 'pass' | 'fail' | 'skip' | 'blocked') => {
    if (!testCase || !testResult) return
    
    const currentStep = testCase.steps[currentStepIndex]
    
    // Update step result
    const stepResult: TestStepResult = {
      stepId: currentStep.id,
      status: status,
      notes: currentStepNotes.trim() || undefined
    }
    
    const newTestResult = { ...testResult }
    newTestResult.steps[currentStepIndex] = stepResult
    newTestResult.executedAt = new Date().toISOString()
    
    // Update overall test case status based on step results
    const stepStatuses = newTestResult.steps.map(s => s.status)
    if (stepStatuses.includes('fail')) {
      newTestResult.status = 'fail'
    } else if (stepStatuses.includes('blocked')) {
      newTestResult.status = 'blocked'
    } else if (stepStatuses.every(s => s === 'pass')) {
      newTestResult.status = 'pass'
    } else if (stepStatuses.includes('pass')) {
      newTestResult.status = 'pass' // Partial pass
    }
    
    setTestResult(newTestResult)
    
    // Move to next step or complete test case
    if (currentStepIndex < testCase.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      // All steps completed
      completeTestRun()
    }
    
    setCurrentStepNotes('')
    setStepStartTime(new Date())
  }

  const getCurrentProgress = () => {
    if (!testCase) return { completed: 0, total: 0 }
    
    const completedSteps = testResult?.steps.filter(step => step.status !== 'skip').length || 0
    return { completed: completedSteps, total: testCase.steps.length }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />
      case 'blocked': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800'
      case 'fail': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
      case 'blocked': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800'
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error Loading Test Case</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!testCase) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-12">
                <TestTube2 className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Test Case Not Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">The requested test case could not be found.</p>
                <Button onClick={() => router.push('/testcases')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Test Cases
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const currentStep = testCase.steps[currentStepIndex]
  const progress = getCurrentProgress()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Test Case Runner</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Ad-hoc execution: {testCase.title}
                </p>
              </div>
              {testCase.githubIssue && (
                <Button variant="outline" asChild>
                  <a 
                    href={testCase.githubIssue.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GitHub Issue
                  </a>
                </Button>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progress.completed} / {progress.total} steps
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {!isRunning ? (
            /* Start Test Run */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ready to Execute Test Case</CardTitle>
                    <CardDescription>
                      This will execute {testCase.steps.length} test steps for this test case.
                    </CardDescription>
                  </div>
                  <Badge className={getPriorityColor(testCase.priority)}>
                    {testCase.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Case Info */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium mb-2">{testCase.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{testCase.description}</p>
                    
                    {testCase.preconditions && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Preconditions:</span>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{testCase.preconditions}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Steps: {testCase.steps.length}</span>
                      <span>Created: {new Date(testCase.createdAt).toLocaleDateString()}</span>
                      <span>By: {testCase.createdBy}</span>
                    </div>
                    
                    {testCase.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {testCase.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={startTestRun} className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Start Test Execution
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Test Execution Interface */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Step */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Step {currentStepIndex + 1} of {testCase.steps.length}
                        </CardTitle>
                        <CardDescription>{testCase.title}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(testResult?.status || 'skip')}>
                        {testResult?.status || 'pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Current Step */}
                      {currentStep && (
                        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-sm">Action:</span>
                              <p className="text-gray-700 dark:text-gray-300 mt-1">{currentStep.action}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-sm">Expected Result:</span>
                              <p className="text-gray-700 dark:text-gray-300 mt-1">{currentStep.expectedResult}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-sm">Notes (Optional):</span>
                              <Textarea
                                value={currentStepNotes}
                                onChange={(e) => setCurrentStepNotes(e.target.value)}
                                placeholder="Add any notes about this step execution..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Step Actions */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => markStepResult('pass')} 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Pass
                        </Button>
                        <Button 
                          onClick={() => markStepResult('fail')} 
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Fail
                        </Button>
                        <Button 
                          onClick={() => markStepResult('blocked')} 
                          variant="outline" 
                          className="flex-1"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Blocked
                        </Button>
                        <Button 
                          onClick={() => markStepResult('skip')} 
                          variant="outline" 
                          className="flex-1"
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </Button>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          onClick={completeTestRun} 
                          variant="outline" 
                          size="sm"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-2" />
                              Complete Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Steps Overview */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Steps Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testCase.steps.map((step, index) => (
                        <div 
                          key={step.id}
                          className={`p-3 rounded-lg border ${
                            index === currentStepIndex 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Step {index + 1}
                            </span>
                            {getStatusIcon(testResult?.steps[index]?.status || 'skip')}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {step.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Session Info */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Session Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {session?.user?.name || 'Unknown User'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {startTime?.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {startTime && new Date().getTime() - startTime.getTime() > 0 
                          ? `${Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60)} min`
                          : '0 min'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}