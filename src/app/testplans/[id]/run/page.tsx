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
  Pause,
  CheckCircle,
  XCircle,
  SkipForward,
  AlertCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Loader2,
  Save
} from 'lucide-react'
import { TestPlan, TestCase, TestRun, TestResult, TestStepResult } from '@/lib/types'

export default function TestRunnerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testPlanId = params.id as string
  
  // Core state
  const [testPlan, setTestPlan] = useState<TestPlan | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testRun, setTestRun] = useState<TestRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Execution state
  const [currentTestCaseIndex, setCurrentTestCaseIndex] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null)
  
  // Results state
  const [testResults, setTestResults] = useState<TestResult[]>([])
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

  // Load test plan and test cases
  useEffect(() => {
    if (testPlanId) {
      loadTestPlan()
    }
  }, [testPlanId])

  const loadTestPlan = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load test plan
      const planResponse = await fetch(`/api/testplans/${testPlanId}`)
      if (!planResponse.ok) {
        throw new Error('Failed to load test plan')
      }
      const plan = await planResponse.json()
      setTestPlan(plan)
      
      // Load all test cases for this plan
      const casesPromises = plan.testCases.map(async (testCaseId: string) => {
        const response = await fetch(`/api/testcases/${testCaseId}`)
        if (response.ok) {
          return response.json()
        }
        return null
      })
      
      const cases = (await Promise.all(casesPromises)).filter(Boolean)
      setTestCases(cases)
      
      // Initialize test results
      initializeTestResults(cases)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test plan')
    } finally {
      setLoading(false)
    }
  }

  const initializeTestResults = (cases: TestCase[]) => {
    const results: TestResult[] = cases.map(testCase => ({
      testCaseId: testCase.id,
      status: 'skip',
      executedAt: '',
      steps: testCase.steps.map(step => ({
        stepId: step.id,
        status: 'skip'
      }))
    }))
    setTestResults(results)
  }

  const startTestRun = async () => {
    if (!testPlan || !session?.user?.name) return
    
    const newTestRun: TestRun = {
      id: crypto.randomUUID(),
      testPlanId: testPlan.id,
      name: `${testPlan.name} - ${new Date().toLocaleDateString()}`,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      executedBy: session.user.name,
      results: testResults
    }
    
    setTestRun(newTestRun)
    setIsRunning(true)
    setStartTime(new Date())
    setStepStartTime(new Date())
    setCurrentTestCaseIndex(0)
    setCurrentStepIndex(0)
  }

  const completeTestRun = async () => {
    if (!testRun) return
    
    setSaving(true)
    try {
      const completedRun = {
        ...testRun,
        completedAt: new Date().toISOString(),
        status: 'completed' as const,
        results: testResults
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
      
      // Redirect to results or test plans page
      router.push('/testplans')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save test run')
    } finally {
      setSaving(false)
    }
  }

  const markStepResult = (status: 'pass' | 'fail' | 'skip' | 'blocked') => {
    if (!testCases[currentTestCaseIndex]) return
    
    const currentTestCase = testCases[currentTestCaseIndex]
    const currentStep = currentTestCase.steps[currentStepIndex]
    
    const newResults = [...testResults]
    const testResult = newResults[currentTestCaseIndex]
    
    // Update step result
    const stepResult: TestStepResult = {
      stepId: currentStep.id,
      status: status,
      notes: currentStepNotes.trim() || undefined
    }
    
    testResult.steps[currentStepIndex] = stepResult
    testResult.executedAt = new Date().toISOString()
    
    // Update overall test case status based on step results
    const stepStatuses = testResult.steps.map(s => s.status)
    if (stepStatuses.includes('fail')) {
      testResult.status = 'fail'
    } else if (stepStatuses.includes('blocked')) {
      testResult.status = 'blocked'
    } else if (stepStatuses.every(s => s === 'pass')) {
      testResult.status = 'pass'
    } else if (stepStatuses.includes('pass')) {
      testResult.status = 'pass' // Partial pass
    }
    
    setTestResults(newResults)
    
    // Move to next step or test case
    if (currentStepIndex < currentTestCase.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else if (currentTestCaseIndex < testCases.length - 1) {
      setCurrentTestCaseIndex(currentTestCaseIndex + 1)
      setCurrentStepIndex(0)
    } else {
      // All test cases completed
      completeTestRun()
    }
    
    setCurrentStepNotes('')
    setStepStartTime(new Date())
  }

  const skipToNextTestCase = () => {
    if (currentTestCaseIndex < testCases.length - 1) {
      setCurrentTestCaseIndex(currentTestCaseIndex + 1)
      setCurrentStepIndex(0)
      setCurrentStepNotes('')
      setStepStartTime(new Date())
    }
  }

  const getCurrentProgress = () => {
    const totalSteps = testCases.reduce((acc, tc) => acc + tc.steps.length, 0)
    const completedSteps = testResults.reduce((acc, result) => 
      acc + result.steps.filter(step => step.status !== 'skip').length, 0
    )
    return { completed: completedSteps, total: totalSteps }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-test-pass" />
      case 'fail': return <XCircle className="h-4 w-4 text-test-fail" />
      case 'blocked': return <AlertCircle className="h-4 w-4 text-test-blocked" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-test-pass/10 text-test-pass border-test-pass/20'
      case 'fail': return 'bg-test-fail/10 text-test-fail border-test-fail/20'
      case 'blocked': return 'bg-test-blocked/10 text-test-blocked border-test-blocked/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Test Plan</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
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

  if (!testPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">Test Plan Not Found</h3>
                <p className="text-muted-foreground mb-4">The requested test plan could not be found.</p>
                <Button onClick={() => router.push('/testplans')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Test Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const currentTestCase = testCases[currentTestCaseIndex]
  const currentStep = currentTestCase?.steps[currentStepIndex]
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Test Runner</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Executing: {testPlan.name}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress.completed} / {progress.total} steps
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {!isRunning ? (
            /* Start Test Run */
            <Card>
              <CardHeader>
                <CardTitle>Ready to Start Test Execution</CardTitle>
                <CardDescription>
                  This will execute {testCases.length} test cases with {progress.total} total steps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Test Plan:</span>
                      <div className="font-medium">{testPlan.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Version:</span>
                      <div className="font-medium">v{testPlan.version}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Test Cases:</span>
                      <div className="font-medium">{testCases.length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Steps:</span>
                      <div className="font-medium">{progress.total}</div>
                    </div>
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
              {/* Current Test Case */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Test Case {currentTestCaseIndex + 1} of {testCases.length}
                        </CardTitle>
                        <CardDescription>{currentTestCase?.title}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(testResults[currentTestCaseIndex]?.status || 'skip')}>
                        {testResults[currentTestCaseIndex]?.status || 'pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Test Case Description */}
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">{currentTestCase?.description}</p>
                      </div>
                      
                      {/* Preconditions */}
                      {currentTestCase?.preconditions && (
                        <div>
                          <h3 className="font-medium mb-2">Preconditions</h3>
                          <p className="text-muted-foreground">{currentTestCase.preconditions}</p>
                        </div>
                      )}
                      
                      {/* Current Step */}
                      {currentStep && (
                        <div className="border rounded-lg p-4 bg-info/5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">Step {currentStepIndex + 1} of {currentTestCase.steps.length}</h3>
                            <Badge variant="outline">Current</Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-sm">Action:</span>
                              <p className="text-foreground mt-1">{currentStep.action}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-sm">Expected Result:</span>
                              <p className="text-foreground mt-1">{currentStep.expectedResult}</p>
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
                          className="flex-1 bg-test-pass hover:bg-test-pass/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Pass
                        </Button>
                        <Button 
                          onClick={() => markStepResult('fail')} 
                          className="flex-1 bg-test-fail hover:bg-test-fail/90"
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
                          onClick={skipToNextTestCase} 
                          variant="outline" 
                          size="sm"
                          disabled={currentTestCaseIndex >= testCases.length - 1}
                        >
                          Skip to Next Test Case
                        </Button>
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
                              Complete Test Run
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Test Cases Overview */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Cases Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testCases.map((testCase, index) => (
                        <div 
                          key={testCase.id}
                          className={`p-3 rounded-lg border ${
                            index === currentTestCaseIndex 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {index + 1}. {testCase.title}
                            </span>
                            {getStatusIcon(testResults[index]?.status || 'skip')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {testCase.steps.length} steps • 
                            {testResults[index]?.steps.filter(s => s.status === 'pass').length || 0} passed • 
                            {testResults[index]?.steps.filter(s => s.status === 'fail').length || 0} failed
                          </div>
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
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {session?.user?.name || 'Unknown User'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {startTime?.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
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