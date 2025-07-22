import { useState, useCallback, useRef } from 'react'
import { TestCase } from '@/lib/types'

interface StreamingState {
  isStreaming: boolean
  progress: number
  status: 'idle' | 'initializing' | 'processing' | 'generating' | 'completing' | 'completed' | 'error'
  currentStep: string
  testCases: TestCase[]
  error: string | null
  totalExpected: number
  currentIndex: number
  estimatedTimeRemaining: number
}

interface StreamingOptions {
  text: string
  options?: {
    testCount?: number
    [key: string]: unknown
  }
  onTestCase?: (testCase: TestCase, index: number) => void
  onProgress?: (progress: number, status: string) => void
  onComplete?: (testCases: TestCase[]) => void
  onError?: (error: string) => void
}

interface GitHubIssuesStreamingOptions {
  issues: {
    number: number
    title: string
    body?: string
    labels: string[]
    repository?: string
  }[]
  repository?: string
  options?: {
    testCount?: number
    [key: string]: unknown
  }
  onTestCase?: (testCase: TestCase, index: number) => void
  onProgress?: (progress: number, status: string) => void
  onComplete?: (testCases: TestCase[]) => void
  onError?: (error: string) => void
}

export function useAIStreaming() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    progress: 0,
    status: 'idle',
    currentStep: '',
    testCases: [],
    error: null,
    totalExpected: 0,
    currentIndex: 0,
    estimatedTimeRemaining: 0
  })

  const abortController = useRef<AbortController | null>(null)
  const startTime = useRef<number>(0)

  const updateState = useCallback((updates: Partial<StreamingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const estimateTimeRemaining = useCallback((current: number, total: number, elapsed: number): number => {
    if (current === 0) return 0
    const rate = current / elapsed
    const remaining = total - current
    return Math.ceil(remaining / rate)
  }, [])

  const getCurrentTotalExpected = useCallback(() => state.totalExpected, [state.totalExpected])

  const startStreaming = useCallback(async ({
    text,
    options,
    onTestCase,
    onProgress,
    onComplete,
    onError
  }: StreamingOptions) => {
    try {
      // Reset state
      setState({
        isStreaming: true,
        progress: 0,
        status: 'initializing',
        currentStep: 'Preparing AI prompt...',
        testCases: [],
        error: null,
        totalExpected: options?.testCount || 5,
        currentIndex: 0,
        estimatedTimeRemaining: 0
      })

      startTime.current = Date.now()

      // Create abort controller
      abortController.current = new AbortController()

      // Start streaming request
      const response = await fetch('/api/ai/generate-from-text-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, options }),
        signal: abortController.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to start streaming generation')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const testCases: TestCase[] = []

      updateState({
        status: 'processing',
        currentStep: 'Analyzing requirements...',
        progress: 10
      })
      onProgress?.(10, 'processing')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode and buffer the chunk
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete messages
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'start':
                  updateState({
                    status: 'generating',
                    currentStep: 'Generating test cases...',
                    progress: 20
                  })
                  onProgress?.(20, 'generating')
                  break

                case 'testcase':
                  if (data.testCase) {
                    testCases.push(data.testCase)
                    const currentIndex = data.index || testCases.length
                    const totalExpected = getCurrentTotalExpected()
                    const progress = Math.min(20 + (currentIndex / totalExpected) * 70, 95)
                    
                    // Calculate time estimation
                    const elapsed = (Date.now() - startTime.current) / 1000
                    const timeRemaining = estimateTimeRemaining(currentIndex, totalExpected, elapsed)

                    updateState({
                      testCases: [...testCases],
                      currentIndex: currentIndex,
                      progress: progress,
                      currentStep: `Generated test case ${currentIndex} of ${totalExpected}`,
                      estimatedTimeRemaining: timeRemaining
                    })
                    
                    onTestCase?.(data.testCase, currentIndex)
                    onProgress?.(progress, 'generating')
                  }
                  break

                case 'complete':
                  updateState({
                    status: 'completing',
                    currentStep: 'Finalizing results...',
                    progress: 95
                  })
                  onProgress?.(95, 'completing')

                  // Brief pause for completion animation
                  setTimeout(() => {
                    updateState({
                      status: 'completed',
                      currentStep: 'Generation complete!',
                      progress: 100,
                      isStreaming: false,
                      estimatedTimeRemaining: 0
                    })
                    onProgress?.(100, 'completed')
                    onComplete?.(testCases)
                  }, 500)
                  break

                case 'error':
                  throw new Error(data.error || 'Streaming generation failed')
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError)
            }
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Streaming failed'
      updateState({
        status: 'error',
        currentStep: 'Generation failed',
        error: errorMessage,
        isStreaming: false,
        estimatedTimeRemaining: 0
      })
      onError?.(errorMessage)
    }
  }, [updateState, estimateTimeRemaining])

  const cancelStreaming = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
    updateState({
      status: 'idle',
      currentStep: '',
      isStreaming: false,
      progress: 0,
      estimatedTimeRemaining: 0
    })
  }, [updateState])

  const startGitHubIssuesStreaming = useCallback(async ({
    issues,
    repository,
    options,
    onTestCase,
    onProgress,
    onComplete,
    onError
  }: GitHubIssuesStreamingOptions) => {
    try {
      // Reset state
      const expectedTestCases = issues.length * (options?.testCount || 1)
      setState({
        isStreaming: true,
        progress: 0,
        status: 'initializing',
        currentStep: 'Preparing GitHub issues analysis...',
        testCases: [],
        error: null,
        totalExpected: expectedTestCases,
        currentIndex: 0,
        estimatedTimeRemaining: 0
      })

      startTime.current = Date.now()

      // Create abort controller
      abortController.current = new AbortController()

      updateState({
        status: 'processing',
        currentStep: 'Processing GitHub issues...',
        progress: 10
      })
      onProgress?.(10, 'processing')

      const testCases: TestCase[] = []
      let processedIssues = 0

      // Process issues sequentially to avoid rate limiting
      for (const issue of issues) {
        if (abortController.current?.signal.aborted) {
          throw new Error('Generation was cancelled')
        }

        // Update progress
        const issueProgress = 10 + (processedIssues / issues.length) * 80
        updateState({
          status: 'generating',
          currentStep: `Processing issue #${issue.number}: ${issue.title}`,
          progress: issueProgress
        })
        onProgress?.(issueProgress, 'generating')

        try {
          // Generate test cases for this issue using the batch API
          const response = await fetch('/api/ai/generate-from-issues', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              issues: [issue],
              repository,
              options
            }),
            signal: abortController.current.signal
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to generate test cases for issue')
          }

          const data = await response.json()
          
          if (data.testCases && Array.isArray(data.testCases)) {
            for (const testCase of data.testCases) {
              testCases.push(testCase)
              const currentIndex = testCases.length
              const progress = 10 + (currentIndex / expectedTestCases) * 80
              
              // Calculate time estimation
              const elapsed = (Date.now() - startTime.current) / 1000
              const timeRemaining = estimateTimeRemaining(currentIndex, expectedTestCases, elapsed)

              updateState({
                testCases: [...testCases],
                currentIndex: currentIndex,
                progress: Math.min(progress, 90),
                currentStep: `Generated test case ${currentIndex} of ~${expectedTestCases}`,
                estimatedTimeRemaining: timeRemaining
              })
              
              onTestCase?.(testCase, currentIndex)
              onProgress?.(Math.min(progress, 90), 'generating')
            }
          }

          processedIssues++
          
          // Add delay between issues to avoid overwhelming the API
          if (processedIssues < issues.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (issueError) {
          console.warn(`Failed to process issue #${issue.number}:`, issueError)
          // Continue with other issues
        }
      }

      // Completion
      updateState({
        status: 'completing',
        currentStep: 'Finalizing results...',
        progress: 95
      })
      onProgress?.(95, 'completing')

      // Brief pause for completion animation
      setTimeout(() => {
        updateState({
          status: 'completed',
          currentStep: 'Generation complete!',
          progress: 100,
          isStreaming: false,
          estimatedTimeRemaining: 0
        })
        onProgress?.(100, 'completed')
        onComplete?.(testCases)
      }, 500)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GitHub issues streaming failed'
      updateState({
        status: 'error',
        currentStep: 'Generation failed',
        error: errorMessage,
        isStreaming: false,
        estimatedTimeRemaining: 0
      })
      onError?.(errorMessage)
    }
  }, [updateState, estimateTimeRemaining, getCurrentTotalExpected])

  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      progress: 0,
      status: 'idle',
      currentStep: '',
      testCases: [],
      error: null,
      totalExpected: 0,
      currentIndex: 0,
      estimatedTimeRemaining: 0
    })
  }, [])

  return {
    ...state,
    startStreaming,
    startGitHubIssuesStreaming,
    cancelStreaming,
    reset
  }
}