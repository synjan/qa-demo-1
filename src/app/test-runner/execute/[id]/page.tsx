'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  ArrowLeft,
  ArrowRight,
  SkipForward,
  Save,
  Play,
  Timer,
  Pause,
  RotateCcw,
  Camera,
  Paperclip
} from 'lucide-react'
import { getGuestSession } from '@/lib/guest-auth'

interface TestCase {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  preconditions: string
  expectedResult: string
  steps: Array<{
    id: string
    stepNumber: number
    action: string
    expectedResult: string
  }>
  tags: string[]
}

interface StepResult {
  stepId: string
  status: 'pass' | 'fail' | 'blocked' | 'skipped' | 'pending'
  notes: string
  actualResult: string
  timestamp: string
}

interface TestExecution {
  testCaseId: string
  executedBy: string
  startedAt: string
  completedAt?: string
  status: 'in_progress' | 'completed' | 'aborted'
  overallResult: 'pass' | 'fail' | 'blocked' | 'skipped' | 'pending'
  stepResults: StepResult[]
  notes: string
}

export default function ExecuteTest() {
  const router = useRouter()
  const params = useParams()
  const testCaseId = params.id as string
  
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [execution, setExecution] = useState<TestExecution | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepResults, setStepResults] = useState<StepResult[]>([])
  const [currentStepNotes, setCurrentStepNotes] = useState('')
  const [currentActualResult, setCurrentActualResult] = useState('')
  const [overallNotes, setOverallNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadTestCase()
    initializeExecution()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [testCaseId])

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTimerRunning])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault()
          updateStepResult('pass')
          break
        case 'f':
          e.preventDefault()
          updateStepResult('fail')
          break
        case 'b':
          e.preventDefault()
          updateStepResult('blocked')
          break
        case 's':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            updateStepResult('skipped')
          }
          break
        case 'arrowright':
          e.preventDefault()
          if (currentStepIndex < (testCase?.steps.length || 0) - 1) {
            navigateToStep(currentStepIndex + 1)
          }
          break
        case 'arrowleft':
          e.preventDefault()
          if (currentStepIndex > 0) {
            navigateToStep(currentStepIndex - 1)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentStepIndex, testCase])

  const loadTestCase = async () => {
    try {
      const response = await fetch(`/api/testcases/${testCaseId}`)
      if (response.ok) {
        const testCaseData = await response.json()
        setTestCase(testCaseData)
        
        // Initialize step results
        const initialStepResults = testCaseData.steps.map((step: any) => ({
          stepId: step.id,
          status: 'pending' as const,
          notes: '',
          actualResult: '',
          timestamp: ''
        }))
        setStepResults(initialStepResults)
      }
    } catch (error) {
      console.error('Failed to load test case:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeExecution = () => {
    const guestSession = getGuestSession()
    if (!guestSession) {
      router.push('/auth/signin')
      return
    }

    const newExecution: TestExecution = {
      testCaseId,
      executedBy: guestSession.name,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      overallResult: 'pending',
      stepResults: [],
      notes: ''
    }
    
    setExecution(newExecution)
    setIsTimerRunning(true)
    setStepStartTime(new Date())
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setElapsedTime(0)
    setIsTimerRunning(false)
  }

  const updateStepResult = (status: StepResult['status']) => {
    if (!testCase) return

    const updatedResults = [...stepResults]
    updatedResults[currentStepIndex] = {
      ...updatedResults[currentStepIndex],
      status,
      notes: currentStepNotes,
      actualResult: currentActualResult,
      timestamp: new Date().toISOString()
    }
    
    setStepResults(updatedResults)
    
    // Auto-advance to next step if not the last step
    if (currentStepIndex < testCase.steps.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1)
        setCurrentStepNotes('')
        setCurrentActualResult('')
      }, 500)
    }
  }

  const navigateToStep = (index: number) => {
    if (index >= 0 && index < (testCase?.steps.length || 0)) {
      setCurrentStepIndex(index)
      setCurrentStepNotes(stepResults[index]?.notes || '')
      setCurrentActualResult(stepResults[index]?.actualResult || '')
    }
  }

  const calculateOverallResult = (): TestExecution['overallResult'] => {
    const completedSteps = stepResults.filter(result => result.status !== 'pending')
    
    if (completedSteps.length === 0) return 'pending'
    
    const hasFailure = completedSteps.some(result => result.status === 'fail')
    const hasBlocked = completedSteps.some(result => result.status === 'blocked')
    const allPassed = completedSteps.every(result => result.status === 'pass' || result.status === 'skipped')
    
    if (hasFailure) return 'fail'
    if (hasBlocked) return 'blocked'
    if (allPassed && completedSteps.length === testCase?.steps.length) return 'pass'
    
    return 'pending'
  }

  const getProgress = () => {
    if (!testCase) return 0
    const completedSteps = stepResults.filter(result => result.status !== 'pending').length
    return (completedSteps / testCase.steps.length) * 100
  }

  const saveExecution = async (isComplete: boolean = false) => {
    if (!execution || !testCase) return

    setSaving(true)
    try {
      const overallResult = calculateOverallResult()
      const updatedExecution: TestExecution = {
        ...execution,
        stepResults,
        notes: overallNotes,
        overallResult,
        status: isComplete ? 'completed' : 'in_progress',
        completedAt: isComplete ? new Date().toISOString() : undefined
      }

      const response = await fetch('/api/test-runner/executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedExecution)
      })

      if (response.ok) {
        if (isComplete) {
          router.push('/test-runner/history')
        }
      }
    } catch (error) {
      console.error('Failed to save execution:', error)
    } finally {
      setSaving(false)
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

  const getStatusIcon = (status: StepResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />
      case 'blocked': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'skipped': return <SkipForward className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/test-runner">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/test-runner/browse">Browse Tests</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Execute Test</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!testCase) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-12 text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Test Case Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The requested test case could not be loaded.
          </p>
          <Button onClick={() => router.push('/test-runner/browse')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Card>
      </div>
    )
  }

  const currentStep = testCase.steps[currentStepIndex]
  const currentStepResult = stepResults[currentStepIndex]

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/test-runner">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/test-runner/browse">Browse Tests</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{testCase.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/test-runner/browse')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{testCase.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${getPriorityColor(testCase.priority)} text-white`}>
                {testCase.priority}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {testCase.steps.length}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <Card className="px-4 py-2">
            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
              <div className="flex items-center gap-1 border-l pl-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={toggleTimer}
                    >
                      {isTimerRunning ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={resetTimer}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Timer</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Card>
          
          <Button onClick={() => saveExecution(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Progress'}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Execution Progress</span>
              <span>{Math.round(getProgress())}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Execution Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Case Info */}
          <Card>
            <CardHeader>
              <CardTitle>Test Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{testCase.description}</p>
              </div>
              
              {testCase.preconditions && (
                <div>
                  <h4 className="font-medium mb-2">Preconditions</h4>
                  <p className="text-sm text-muted-foreground">{testCase.preconditions}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Expected Final Result</h4>
                <p className="text-sm text-muted-foreground">{testCase.expectedResult}</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Step */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step {currentStepIndex + 1}: Execute Action</span>
                {getStatusIcon(currentStepResult?.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Action to Perform</h4>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <p className="text-sm">{currentStep.action}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Expected Result</h4>
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <p className="text-sm">{currentStep.expectedResult}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Actual Result</h4>
                <Textarea
                  placeholder="Describe what actually happened when you performed this step..."
                  value={currentActualResult}
                  onChange={(e) => setCurrentActualResult(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Notes (Optional)</h4>
                <Textarea
                  placeholder="Any additional notes or observations..."
                  value={currentStepNotes}
                  onChange={(e) => setCurrentStepNotes(e.target.value)}
                />
              </div>

              {/* Step Actions */}
              <div className="flex gap-2 pt-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => updateStepResult('pass')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Pass
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <kbd className="text-xs">P</kbd> Mark as Passed
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => updateStepResult('fail')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Fail
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <kbd className="text-xs">F</kbd> Mark as Failed
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => updateStepResult('blocked')}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Blocked
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <kbd className="text-xs">B</kbd> Mark as Blocked
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => updateStepResult('skipped')}
                      variant="outline"
                      className="flex-1"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <kbd className="text-xs">S</kbd> Skip Step
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => navigateToStep(currentStepIndex - 1)}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <kbd className="text-xs">←</kbd> Go to previous step
              </TooltipContent>
            </Tooltip>
            
            {currentStepIndex < testCase.steps.length - 1 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigateToStep(currentStepIndex + 1)}
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <kbd className="text-xs">→</kbd> Go to next step
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => saveExecution(true)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Test
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <kbd className="text-xs">⌘</kbd> + <kbd className="text-xs">Enter</kbd> Complete test
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Sidebar - Step Overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step Overview</CardTitle>
              <CardDescription>
                Click on any step to navigate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testCase.steps.map((step, index) => (
                  <Button
                    key={step.id}
                    variant={index === currentStepIndex ? "default" : "ghost"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => navigateToStep(index)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {getStatusIcon(stepResults[index]?.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          Step {index + 1}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {step.action.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Test Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add overall notes about this test execution..."
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}