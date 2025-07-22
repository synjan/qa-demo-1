'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Loader2, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  progress: number
  status: 'initializing' | 'processing' | 'generating' | 'completing' | 'completed' | 'error'
  currentStep?: string
  totalSteps?: number
  currentStepIndex?: number
  estimatedTimeRemaining?: number
  canCancel?: boolean
  onCancel?: () => void
  className?: string
  language?: 'en' | 'no'
}

const statusMessages = {
  en: {
    initializing: 'Preparing AI prompt...',
    processing: 'Analyzing requirements...',
    generating: 'Generating test cases...',
    completing: 'Finalizing results...',
    completed: 'Generation complete!',
    error: 'Generation failed'
  },
  no: {
    initializing: 'Forbereder AI-prompt...',
    processing: 'Analyserer krav...',
    generating: 'Genererer testtilfeller...',
    completing: 'Ferdigstiller resultater...',
    completed: 'Generering fullført!',
    error: 'Generering feilet'
  }
}

export function ProgressIndicator({
  progress,
  status,
  currentStep,
  totalSteps,
  currentStepIndex,
  estimatedTimeRemaining,
  canCancel = false,
  onCancel,
  className,
  language = 'en'
}: ProgressIndicatorProps) {
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (status === 'initializing' || status === 'processing' || status === 'generating') {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status])

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
      case 'processing':
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completing':
        return <Zap className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getProgressColor = () => {
    if (status === 'error') return 'bg-red-500'
    if (status === 'completed') return 'bg-green-500'
    return 'bg-blue-500'
  }

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg bg-background', className)}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">
            {currentStep || statusMessages[language][status]}
          </span>
        </div>
        {canCancel && onCancel && status !== 'completed' && status !== 'error' && (
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            {language === 'en' ? 'Cancel' : 'Avbryt'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-2" 
          indicatorClassName={getProgressColor()}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          {totalSteps && currentStepIndex !== undefined && (
            <span>
              {language === 'en' ? 'Step' : 'Steg'} {currentStepIndex + 1} {language === 'en' ? 'of' : 'av'} {totalSteps}
            </span>
          )}
        </div>
      </div>

      {/* Time Information */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {language === 'en' ? 'Elapsed:' : 'Forløpt:'} {formatTime(timeElapsed)}
          </span>
        </div>
        {estimatedTimeRemaining && estimatedTimeRemaining > 0 && status !== 'completed' && (
          <span>
            {language === 'en' ? 'Remaining:' : 'Gjenstår:'} {formatTime(estimatedTimeRemaining)}
          </span>
        )}
      </div>

      {/* Additional Status Information */}
      {status === 'generating' && totalSteps && (
        <div className="text-xs text-muted-foreground">
          {language === 'en' 
            ? `Generating ${totalSteps} test cases with AI assistance`
            : `Genererer ${totalSteps} testtilfeller med AI-assistanse`
          }
        </div>
      )}
    </div>
  )
}

// Compact version for smaller spaces
export function CompactProgressIndicator({
  progress,
  status,
  currentStep,
  className,
  language = 'en'
}: Pick<ProgressIndicatorProps, 'progress' | 'status' | 'currentStep' | 'className' | 'language'>) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <Loader2 className="h-3 w-3 animate-spin" />
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getStatusIcon()}
      <Progress value={progress} className="flex-1 h-1" />
      <span className="text-xs text-muted-foreground min-w-8">
        {Math.round(progress)}%
      </span>
    </div>
  )
}