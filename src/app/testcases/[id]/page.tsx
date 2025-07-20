'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit,
  Play,
  ExternalLink,
  TestTube2,
  Calendar,
  User,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { TestCase } from '@/lib/types'

export default function TestCaseDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testCaseId = params.id as string
  
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('github_pat')
      if (!hasToken) {
        router.push('/auth/signin')
        return
      }
    }
    
    if (testCaseId) {
      loadTestCase()
    }
  }, [session, status, router, testCaseId])

  const loadTestCase = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/testcases/${testCaseId}`)
      if (!response.ok) {
        throw new Error('Failed to load test case')
      }
      
      const data = await response.json()
      setTestCase(data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test case')
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error Loading Test Case</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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

  if (!testCase) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{testCase.title}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Test Case Details
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/testcases/${testCase.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={() => router.push(`/testcases/${testCase.id}/run`)}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test Case Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(testCase.priority)}>
                      {testCase.priority}
                    </Badge>
                    {testCase.githubIssue && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={testCase.githubIssue.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Issue #{testCase.githubIssue.number}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{testCase.description}</p>
                </div>
                
                {testCase.preconditions && (
                  <div>
                    <h3 className="font-medium mb-2">Preconditions</h3>
                    <p className="text-gray-600 dark:text-gray-300">{testCase.preconditions}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium mb-2">Expected Final Result</h3>
                  <p className="text-gray-600 dark:text-gray-300">{testCase.expectedResult}</p>
                </div>
                
                {testCase.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {testCase.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Test Steps ({testCase.steps.length})</CardTitle>
                <CardDescription>
                  Step-by-step instructions for executing this test case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testCase.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-medium text-sm">
                          {index + 1}
                        </div>
                        <h3 className="font-medium">Step {index + 1}</h3>
                      </div>
                      
                      <div className="ml-11 space-y-3">
                        <div>
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Action:</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{step.action}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Expected Result:</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{step.expectedResult}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Created: {formatDate(testCase.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Updated: {formatDate(testCase.updatedAt)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Created by: {testCase.createdBy}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <TestTube2 className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">ID: {testCase.id}</span>
                  </div>
                  
                  {testCase.githubIssue && (
                    <div className="flex items-center md:col-span-2">
                      <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        GitHub: {testCase.githubIssue.repository}/issues/{testCase.githubIssue.number}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}