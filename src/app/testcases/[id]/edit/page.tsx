'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2,
  Loader2,
  TestTube2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { TestCase, TestStep } from '@/lib/types'

interface FormData {
  title: string
  description: string
  preconditions: string
  expectedResult: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  githubIssueUrl: string
}

interface StepFormData {
  id: string
  action: string
  expectedResult: string
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' }
]

const commonTags = [
  'ui', 'api', 'integration', 'regression', 'smoke', 'functional', 
  'performance', 'security', 'accessibility', 'mobile', 'desktop', 
  'bug', 'feature', 'enhancement', 'critical-path'
]

export default function EditTestCasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testCaseId = params.id as string
  
  // State
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    preconditions: '',
    expectedResult: '',
    priority: 'medium',
    tags: [],
    githubIssueUrl: ''
  })
  
  const [steps, setSteps] = useState<StepFormData[]>([])
  const [tagInput, setTagInput] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

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
      
      // Populate form data
      setFormData({
        title: data.title,
        description: data.description,
        preconditions: data.preconditions || '',
        expectedResult: data.expectedResult,
        priority: data.priority,
        tags: data.tags || [],
        githubIssueUrl: data.githubIssue?.url || ''
      })
      
      // Populate steps
      setSteps(data.steps.map((step: TestStep) => ({
        id: step.id,
        action: step.action,
        expectedResult: step.expectedResult
      })))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test case')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleStepChange = (index: number, field: keyof Omit<StepFormData, 'id'>, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
    setHasChanges(true)
  }

  const addStep = () => {
    const newStep: StepFormData = {
      id: `step-${steps.length + 1}`,
      action: '',
      expectedResult: ''
    }
    setSteps([...steps, newStep])
    setHasChanges(true)
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
      setHasChanges(true)
    }
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
      setSteps(newSteps)
      setHasChanges(true)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setHasChanges(true)
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
    setHasChanges(true)
  }

  const parseGitHubIssue = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/)
    if (match) {
      return {
        repository: `${match[1]}/${match[2]}`,
        number: parseInt(match[3], 10),
        url: url
      }
    }
    return null
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    
    if (steps.some(step => !step.action.trim() || !step.expectedResult.trim())) {
      setError('All test steps must have both action and expected result')
      return false
    }
    
    return true
  }

  const handleSave = async () => {
    if (!validateForm() || !testCase) return
    
    setSaving(true)
    setError(null)
    
    try {
      const githubIssue = formData.githubIssueUrl ? parseGitHubIssue(formData.githubIssueUrl) : undefined
      
      const testSteps: TestStep[] = steps.map((step, index) => ({
        id: step.id,
        stepNumber: index + 1,
        action: step.action.trim(),
        expectedResult: step.expectedResult.trim()
      }))
      
      const updatedTestCase: TestCase = {
        ...testCase,
        title: formData.title.trim(),
        description: formData.description.trim(),
        preconditions: formData.preconditions.trim() || undefined,
        steps: testSteps,
        expectedResult: formData.expectedResult.trim(),
        priority: formData.priority,
        tags: formData.tags,
        githubIssue: githubIssue,
        updatedAt: new Date().toISOString()
      }
      
      const response = await fetch(`/api/testcases/${testCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTestCase)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update test case')
      }
      
      setHasChanges(false)
      router.push('/testcases')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update test case')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !testCase) {
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
              <Button variant="ghost" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Test Case</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Modify test case details, steps, and validation criteria.
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
            
            {hasChanges && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <p className="text-yellow-800 dark:text-yellow-200">You have unsaved changes</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the core details for your test case</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter a clear, descriptive title for your test case"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Describe what this test case verifies and its purpose"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="preconditions">Preconditions</Label>
                  <Textarea
                    id="preconditions"
                    value={formData.preconditions}
                    onChange={(e) => handleFormChange('preconditions', e.target.value)}
                    placeholder="List any setup requirements or preconditions for this test"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expectedResult">Expected Final Result *</Label>
                  <Textarea
                    id="expectedResult"
                    value={formData.expectedResult}
                    onChange={(e) => handleFormChange('expectedResult', e.target.value)}
                    placeholder="Describe the overall expected outcome of this test case"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleFormChange('priority', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`}></div>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="githubUrl">GitHub Issue URL (Optional)</Label>
                    <Input
                      id="githubUrl"
                      value={formData.githubIssueUrl}
                      onChange={(e) => handleFormChange('githubIssueUrl', e.target.value)}
                      placeholder="https://github.com/owner/repo/issues/123"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Update tags to categorize and organize your test case</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter a tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(tagInput)
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={() => addTag(tagInput)} disabled={!tagInput}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Common Tags */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Common tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonTags.map(tag => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => addTag(tag)}
                          disabled={formData.tags.includes(tag)}
                          className="text-xs"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Selected tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Test Steps</CardTitle>
                    <CardDescription>Update the step-by-step actions and expected results</CardDescription>
                  </div>
                  <Button onClick={addStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Step {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            disabled={steps.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`action-${index}`}>Action *</Label>
                          <Textarea
                            id={`action-${index}`}
                            value={step.action}
                            onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                            placeholder="Describe the action to be performed"
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`expected-${index}`}>Expected Result *</Label>
                          <Textarea
                            id={`expected-${index}`}
                            value={step.expectedResult}
                            onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                            placeholder="Describe the expected outcome"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}