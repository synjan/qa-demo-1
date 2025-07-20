'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TestTube2, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ArrowLeft,
  Download,
  Loader2
} from 'lucide-react'
import { TestCase } from '@/lib/types'

interface BatchTestResult {
  testCaseId: string
  status: 'pending' | 'running' | 'pass' | 'fail' | 'blocked' | 'skipped'
  startTime?: Date
  endTime?: Date
  currentStepIndex: number
  stepResults: Array<{
    stepIndex: number
    status: 'pass' | 'fail' | 'blocked' | 'skipped'
    notes?: string
  }>
}

interface BatchExecutionState {
  status: 'idle' | 'running' | 'paused' | 'completed'
  currentTestIndex: number
  results: BatchTestResult[]
  startTime?: Date
  endTime?: Date
}

export default function BatchTestRunner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executionState, setExecutionState] = useState<BatchExecutionState>({
    status: 'idle',
    currentTestIndex: 0,
    results: []
  })

  // Parse selected test case IDs from URL parameters
  const selectedIds = searchParams.get('ids')?.split(',') || []

  useEffect(() => {
    loadSelectedTestCases()
  }, [selectedIds])  // eslint-disable-line react-hooks/exhaustive-deps

  const loadSelectedTestCases = async () => {
    if (selectedIds.length === 0) {
      setError('No test cases selected for batch execution')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const loadedTestCases: TestCase[] = []
      
      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/testcases/${id}`)
          if (response.ok) {
            const testCase = await response.json()
            loadedTestCases.push(testCase)
          }
        } catch (err) {
          console.warn(`Failed to load test case ${id}:`, err)
        }
      }

      if (loadedTestCases.length === 0) {
        setError('Failed to load any of the selected test cases')
        return
      }

      setTestCases(loadedTestCases)
      
      // Initialize execution state
      setExecutionState({
        status: 'idle',
        currentTestIndex: 0,
        results: loadedTestCases.map(tc => ({
          testCaseId: tc.id,
          status: 'pending',
          currentStepIndex: 0,
          stepResults: []
        }))
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test cases')
    } finally {
      setLoading(false)
    }
  }

  const startBatchExecution = () => {
    setExecutionState(prev => ({
      ...prev,
      status: 'running',
      startTime: new Date(),
      results: prev.results.map((result, index) => 
        index === 0 
          ? { ...result, status: 'running', startTime: new Date() }
          : result
      )
    }))
  }

  const pauseBatchExecution = () => {
    setExecutionState(prev => ({
      ...prev,
      status: 'paused'
    }))
  }

  const resumeBatchExecution = () => {
    setExecutionState(prev => ({
      ...prev,
      status: 'running'
    }))
  }

  const stopBatchExecution = () => {
    setExecutionState(prev => ({
      ...prev,
      status: 'completed',
      endTime: new Date()
    }))
  }

  const recordStepResult = (stepIndex: number, status: 'pass' | 'fail' | 'blocked' | 'skipped', notes?: string) => {
    setExecutionState(prev => {
      const newResults = [...prev.results]
      const currentResult = { ...newResults[prev.currentTestIndex] }
      
      // Record the step result
      currentResult.stepResults = [...currentResult.stepResults]
      currentResult.stepResults[stepIndex] = { stepIndex, status, notes }
      
      // Update current step index
      const nextStepIndex = stepIndex + 1
      const currentTestCase = testCases[prev.currentTestIndex]
      
      if (nextStepIndex < currentTestCase.steps.length) {
        // Move to next step
        currentResult.currentStepIndex = nextStepIndex
      } else {
        // Test case completed, determine overall status
        const hasFailures = currentResult.stepResults.some(s => s.status === 'fail')
        const hasBlocked = currentResult.stepResults.some(s => s.status === 'blocked')
        const hasSkipped = currentResult.stepResults.some(s => s.status === 'skipped')
        
        if (hasFailures) {
          currentResult.status = 'fail'
        } else if (hasBlocked) {
          currentResult.status = 'blocked'
        } else if (hasSkipped) {
          currentResult.status = 'skipped'
        } else {
          currentResult.status = 'pass'
        }
        
        currentResult.endTime = new Date()
        
        // Move to next test case
        const nextTestIndex = prev.currentTestIndex + 1
        if (nextTestIndex < testCases.length) {
          newResults[nextTestIndex] = {
            ...newResults[nextTestIndex],
            status: 'running',
            startTime: new Date()
          }
          
          newResults[prev.currentTestIndex] = currentResult
          
          return {
            ...prev,
            currentTestIndex: nextTestIndex,
            results: newResults
          }
        } else {
          // All tests completed
          newResults[prev.currentTestIndex] = currentResult
          
          return {
            ...prev,
            status: 'completed',
            endTime: new Date(),
            results: newResults
          }
        }
      }
      
      newResults[prev.currentTestIndex] = currentResult
      return {
        ...prev,
        results: newResults
      }
    })
  }

  const skipTestCase = () => {
    setExecutionState(prev => {
      const newResults = [...prev.results]
      const currentResult = { ...newResults[prev.currentTestIndex] }
      
      currentResult.status = 'skipped'
      currentResult.endTime = new Date()
      
      // Move to next test case
      const nextTestIndex = prev.currentTestIndex + 1
      if (nextTestIndex < testCases.length) {
        newResults[nextTestIndex] = {
          ...newResults[nextTestIndex],
          status: 'running',
          startTime: new Date()
        }
        
        newResults[prev.currentTestIndex] = currentResult
        
        return {
          ...prev,
          currentTestIndex: nextTestIndex,
          results: newResults
        }
      } else {
        // All tests completed
        newResults[prev.currentTestIndex] = currentResult
        
        return {
          ...prev,
          status: 'completed',
          endTime: new Date(),
          results: newResults
        }
      }
    })
  }

  const saveBatchResults = async () => {
    try {
      const batchRunData = {
        id: `batch-${Date.now()}`,
        type: 'batch_run',
        timestamp: new Date().toISOString(),
        title: `Batch Run - ${testCases.length} Test Cases`,
        description: `Batch execution of ${testCases.length} test cases`,
        testCases: testCases.map(tc => tc.id),
        executionState,
        results: executionState.results,
        stats: getOverallStats(),
        duration: executionState.startTime && executionState.endTime 
          ? executionState.endTime.getTime() - executionState.startTime.getTime()
          : 0
      }

      const response = await fetch('/api/testruns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchRunData)
      })

      if (!response.ok) {
        throw new Error('Failed to save batch results')
      }

      return batchRunData.id
    } catch (err) {
      console.error('Error saving batch results:', err)
      throw err
    }
  }

  const exportResults = () => {
    const csvContent = [
      ['Test Case ID', 'Test Case Title', 'Status', 'Steps Passed', 'Steps Failed', 'Steps Blocked', 'Steps Skipped', 'Start Time', 'End Time', 'Duration (ms)'].join(','),
      ...executionState.results.map(result => {
        const testCase = testCases.find(tc => tc.id === result.testCaseId)
        const stepStats = {
          passed: result.stepResults.filter(s => s.status === 'pass').length,
          failed: result.stepResults.filter(s => s.status === 'fail').length,
          blocked: result.stepResults.filter(s => s.status === 'blocked').length,
          skipped: result.stepResults.filter(s => s.status === 'skipped').length
        }
        const duration = result.startTime && result.endTime 
          ? result.endTime.getTime() - result.startTime.getTime()
          : 0
        
        return [
          result.testCaseId,
          `"${testCase?.title || 'Unknown'}"`,
          result.status,
          stepStats.passed,
          stepStats.failed,
          stepStats.blocked,
          stepStats.skipped,
          result.startTime?.toISOString() || '',
          result.endTime?.toISOString() || '',
          duration
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-test-results-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Auto-save results when batch completes
  useEffect(() => {
    if (executionState.status === 'completed' && executionState.endTime) {
      saveBatchResults().catch(console.error)
    }
  }, [executionState.status, executionState.endTime])  // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-test-pass" />
      case 'fail': return <XCircle className="h-4 w-4 text-test-fail" />
      case 'blocked': return <AlertCircle className="h-4 w-4 text-test-blocked" />
      case 'running': return <Loader2 className="h-4 w-4 text-info animate-spin" />
      case 'skipped': return <Clock className="h-4 w-4 text-test-skip" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-test-pass/10 text-test-pass border-test-pass/20'
      case 'fail': return 'bg-test-fail/10 text-test-fail border-test-fail/20'
      case 'blocked': return 'bg-test-blocked/10 text-test-blocked border-test-blocked/20'
      case 'running': return 'bg-info/10 text-info border-info/20'
      case 'skipped': return 'bg-test-skip/10 text-test-skip border-test-skip/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getOverallProgress = () => {
    const completed = executionState.results.filter(r => 
      ['pass', 'fail', 'blocked', 'skipped'].includes(r.status)
    ).length
    return {
      completed,
      total: executionState.results.length,
      percentage: executionState.results.length > 0 ? (completed / executionState.results.length) * 100 : 0
    }
  }

  const getOverallStats = () => {
    const results = executionState.results
    return {
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      blocked: results.filter(r => r.status === 'blocked').length,
      skipped: results.filter(r => r.status === 'skipped').length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
            <div className="text-center">
              <TestTube2 className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Test Cases</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => router.push('/testcases')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Test Cases
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const progress = getOverallProgress()
  const stats = getOverallStats()
  const currentTestCase = testCases[executionState.currentTestIndex]
  const currentResult = executionState.results[executionState.currentTestIndex]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Batch Test Runner</h1>
                <p className="mt-2 text-muted-foreground">
                  Execute multiple test cases in sequence and track results
                </p>
              </div>
              <Button 
                onClick={() => router.push('/testcases')} 
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Test Cases
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Execution Progress</CardTitle>
                  <CardDescription>
                    {progress.completed} / {progress.total} test cases completed
                  </CardDescription>
                </div>
                <Badge variant="outline" className={getStatusColor(executionState.status)}>
                  {executionState.status.charAt(0).toUpperCase() + executionState.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-test-pass">{stats.passed}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-test-fail">{stats.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-test-blocked">{stats.blocked}</div>
                    <div className="text-sm text-muted-foreground">Blocked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-test-skip">{stats.skipped}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Control Buttons */}
          <div className="flex gap-4 mb-6">
            {executionState.status === 'idle' && (
              <Button onClick={startBatchExecution} className="flex-1 md:flex-none">
                <Play className="h-4 w-4 mr-2" />
                Start Batch Execution
              </Button>
            )}
            
            {executionState.status === 'running' && (
              <Button onClick={pauseBatchExecution} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            {executionState.status === 'paused' && (
              <>
                <Button onClick={resumeBatchExecution}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button onClick={stopBatchExecution} variant="outline">
                  Stop Execution
                </Button>
              </>
            )}

            {executionState.status === 'completed' && (
              <Button onClick={exportResults} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>

          {/* Completion Summary */}
          {executionState.status === 'completed' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-test-pass" />
                  Batch Execution Completed
                </CardTitle>
                <CardDescription>
                  All test cases have been executed. Results have been automatically saved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{testCases.length}</div>
                    <div className="text-sm text-muted-foreground">Total Test Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">
                      {executionState.results.reduce((acc, r) => acc + r.stepResults.length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Steps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">
                      {executionState.startTime && executionState.endTime 
                        ? Math.round((executionState.endTime.getTime() - executionState.startTime.getTime()) / 1000 / 60)
                        : 0}m
                    </div>
                    <div className="text-sm text-muted-foreground">Total Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-test-pass">
                      {Math.round((stats.passed / testCases.length) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Pass Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Cases List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Test Case (if running) */}
            {executionState.status === 'running' && currentTestCase && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-info" />
                    Currently Executing: {currentTestCase.title}
                  </CardTitle>
                  <CardDescription>
                    Test Case {executionState.currentTestIndex + 1} of {testCases.length} • 
                    Step {currentResult?.currentStepIndex + 1 || 1} of {currentTestCase.steps.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-muted-foreground">{currentTestCase.description}</p>
                    
                    {/* Preconditions */}
                    {currentTestCase.preconditions && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Preconditions:</h4>
                        <p className="text-muted-foreground">{currentTestCase.preconditions}</p>
                      </div>
                    )}
                    
                    {/* Current Step */}
                    {currentTestCase.steps[currentResult?.currentStepIndex || 0] && (
                      <div className="border rounded-lg p-4 bg-info/5">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-foreground">
                              Step {currentResult?.currentStepIndex + 1 || 1}
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => skipTestCase()}
                                variant="outline"
                                size="sm"
                              >
                                Skip Test Case
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-sm text-foreground">Action:</span>
                            <p className="text-foreground mt-1">
                              {currentTestCase.steps[currentResult?.currentStepIndex || 0].action}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-sm text-foreground">Expected Result:</span>
                            <p className="text-foreground mt-1">
                              {currentTestCase.steps[currentResult?.currentStepIndex || 0].expectedResult}
                            </p>
                          </div>
                          
                          {/* Step Result Buttons */}
                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              onClick={() => recordStepResult(currentResult?.currentStepIndex || 0, 'pass')}
                              className="flex-1 bg-test-pass hover:bg-test-pass/90"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Pass
                            </Button>
                            <Button
                              onClick={() => recordStepResult(currentResult?.currentStepIndex || 0, 'fail')}
                              className="flex-1 bg-test-fail hover:bg-test-fail/90"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Fail
                            </Button>
                            <Button
                              onClick={() => recordStepResult(currentResult?.currentStepIndex || 0, 'blocked')}
                              className="flex-1 bg-test-blocked hover:bg-test-blocked/90"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Blocked
                            </Button>
                            <Button
                              onClick={() => recordStepResult(currentResult?.currentStepIndex || 0, 'skipped')}
                              variant="outline"
                              className="flex-1"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Skip Step
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Step Progress */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Step Progress:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {currentTestCase.steps.map((step, index) => {
                          const stepResult = currentResult?.stepResults.find(sr => sr.stepIndex === index)
                          const isCurrent = index === (currentResult?.currentStepIndex || 0)
                          const isCompleted = stepResult !== undefined
                          
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded border text-sm ${
                                isCurrent ? 'border-primary bg-primary/5' : 
                                isCompleted ? `border-${stepResult?.status === 'pass' ? 'test-pass' : stepResult?.status === 'fail' ? 'test-fail' : stepResult?.status === 'blocked' ? 'test-blocked' : 'test-skip'}/20 bg-${stepResult?.status === 'pass' ? 'test-pass' : stepResult?.status === 'fail' ? 'test-fail' : stepResult?.status === 'blocked' ? 'test-blocked' : 'test-skip'}/5` :
                                'border-border'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {isCurrent ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/20" />
                                ) : isCompleted ? (
                                  getStatusIcon(stepResult?.status || 'pending')
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </div>
                              <span className={`truncate ${isCurrent ? 'text-foreground font-medium' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Step {index + 1}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Test Cases Overview */}
            <div className={executionState.status === 'running' ? 'lg:col-span-2' : 'lg:col-span-2'}>
              <Card>
                <CardHeader>
                  <CardTitle>Test Cases ({testCases.length})</CardTitle>
                  <CardDescription>
                    Overview of all selected test cases and their execution status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testCases.map((testCase, index) => {
                      const result = executionState.results[index]
                      const isActive = index === executionState.currentTestIndex && executionState.status === 'running'
                      
                      return (
                        <div 
                          key={testCase.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isActive ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex-shrink-0">
                              {getStatusIcon(result?.status || 'pending')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-foreground truncate">
                                {testCase.title}
                              </h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {testCase.steps.length} steps
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(result?.status || 'pending')}>
                              {result?.status || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}