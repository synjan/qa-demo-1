'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Play, 
  Clock,
  CheckCircle,
  FileText,
  Tag
} from 'lucide-react'

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
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function ViewTestCase() {
  const router = useRouter()
  const params = useParams()
  const testCaseId = params.id as string
  
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTestCase()
  }, [testCaseId])

  const loadTestCase = async () => {
    try {
      const response = await fetch(`/api/testcases/${testCaseId}`)
      if (response.ok) {
        const testCaseData = await response.json()
        setTestCase(testCaseData)
      }
    } catch (error) {
      console.error('Failed to load test case:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading test case...</p>
        </div>
      </div>
    )
  }

  if (!testCase) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/test-runner/browse')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{testCase.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${getPriorityColor(testCase.priority)} text-white`}>
                {testCase.priority}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {testCase.steps.length} steps
              </span>
              <span className="text-sm text-muted-foreground">
                Created {formatDate(testCase.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => router.push(`/test-runner/execute/${testCase.id}`)}
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          Execute Test
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>Test Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{testCase.description}</p>
              </div>
              
              {testCase.preconditions && (
                <div>
                  <h4 className="font-medium mb-2">Preconditions</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm">{testCase.preconditions}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Expected Final Result</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm">{testCase.expectedResult}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Test Steps</CardTitle>
              <CardDescription>
                Follow these steps during test execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testCase.steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h5 className="font-medium mb-1">Action</h5>
                          <p className="text-sm text-muted-foreground">
                            {step.action}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Expected Result</h5>
                          <p className="text-sm text-muted-foreground">
                            {step.expectedResult}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Estimated time: {Math.ceil(testCase.steps.length * 2)} minutes
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {testCase.steps.length} steps to complete
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created by {testCase.createdBy}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {testCase.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {testCase.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => router.push(`/test-runner/execute/${testCase.id}`)}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Test
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/test-runner/browse')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Browse
              </Button>
            </CardContent>
          </Card>

          {/* Test Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Test Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge className={`${getPriorityColor(testCase.priority)} text-white text-xs`}>
                  {testCase.priority}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Steps:</span>
                <span>{testCase.steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(testCase.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(testCase.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}