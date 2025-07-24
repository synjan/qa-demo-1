'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  GripVertical,
  Loader2,
  TestTube2,
  ExternalLink,
  Copy
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
  action: string
  expectedResult: string
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-priority-low/10 text-priority-low border-priority-low/30' },
  { value: 'medium', label: 'Medium', color: 'bg-priority-medium/10 text-priority-medium border-priority-medium/30' },
  { value: 'high', label: 'High', color: 'bg-priority-high/10 text-priority-high border-priority-high/30' },
  { value: 'critical', label: 'Critical', color: 'bg-priority-critical/10 text-priority-critical border-priority-critical/30' }
]

const commonTags = [
  'ui', 'api', 'integration', 'regression', 'smoke', 'functional', 
  'performance', 'security', 'accessibility', 'mobile', 'desktop', 
  'bug', 'feature', 'enhancement', 'critical-path'
]

const testCaseTemplates = [
  {
    name: 'User Login Flow',
    description: 'Standard user authentication test',
    steps: [
      { action: 'Navigate to login page', expectedResult: 'Login page loads successfully' },
      { action: 'Enter valid username and password', expectedResult: 'Credentials are accepted' },
      { action: 'Click login button', expectedResult: 'User is redirected to dashboard' },
      { action: 'Verify user session', expectedResult: 'User remains logged in after page refresh' }
    ]
  },
  {
    name: 'API Endpoint Test',
    description: 'Basic API functionality test',
    steps: [
      { action: 'Send GET request to endpoint', expectedResult: 'Returns 200 status code' },
      { action: 'Validate response format', expectedResult: 'Response matches expected schema' },
      { action: 'Check response data', expectedResult: 'Data is accurate and complete' }
    ]
  },
  {
    name: 'Form Validation',
    description: 'Input validation and error handling',
    steps: [
      { action: 'Submit form with empty required fields', expectedResult: 'Validation errors are displayed' },
      { action: 'Enter invalid data formats', expectedResult: 'Format validation messages appear' },
      { action: 'Submit with valid data', expectedResult: 'Form submits successfully' }
    ]
  }
]

export default function NewTestCasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
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
  
  const [steps, setSteps] = useState<StepFormData[]>([
    { action: '', expectedResult: '' }
  ])
  
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

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

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (index: number, field: keyof StepFormData, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const addStep = () => {
    setSteps([...steps, { action: '', expectedResult: '' }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
      setSteps(newSteps)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const applyTemplate = (template: typeof testCaseTemplates[0]) => {
    setSteps(template.steps)
    setShowTemplates(false)
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
    if (!validateForm()) return
    
    setSaving(true)
    setError(null)
    
    try {
      const testCaseId = crypto.randomUUID()
      const githubIssue = formData.githubIssueUrl ? parseGitHubIssue(formData.githubIssueUrl) : undefined
      
      const testSteps: TestStep[] = steps.map((step, index) => ({
        id: `step-${index + 1}`,
        stepNumber: index + 1,
        action: step.action.trim(),
        expectedResult: step.expectedResult.trim()
      }))
      
      const testCase: TestCase = {
        id: testCaseId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        preconditions: formData.preconditions.trim() || undefined,
        steps: testSteps,
        expectedResult: formData.expectedResult.trim(),
        priority: formData.priority,
        tags: formData.tags,
        githubIssue: githubIssue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: session?.user?.name || 'Unknown User'
      }
      
      const response = await fetch('/api/testcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create test case')
      }
      
      router.push('/testcases')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test case')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="hover:bg-accent transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <TestTube2 className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">
                    Create Test Case
                  </h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Build a comprehensive test case with detailed steps and validation criteria.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Templates */}
            <Card className="bg-card border-2 border-border transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">Quick Start Templates</CardTitle>
                    <CardDescription className="text-muted-foreground">Choose a template to get started quickly</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="bg-background hover:bg-accent border-2 border-border hover:border-primary transition-all duration-200"
                  >
                    {showTemplates ? 'Hide' : 'Show'} Templates
                  </Button>
                </div>
              </CardHeader>
              {showTemplates && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {testCaseTemplates.map((template, index) => (
                      <div 
                        key={index} 
                        className="bg-card border-2 border-border rounded-lg p-4 hover:bg-accent hover:border-primary cursor-pointer transition-all duration-200"
                        onClick={() => applyTemplate(template)}
                      >
                        <h3 className="font-medium mb-2 text-card-foreground">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {template.steps.length} steps
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Basic Information */}
            <Card className="bg-card border-2 border-border transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-card-foreground">Basic Information</CardTitle>
                <CardDescription className="text-muted-foreground">Provide the core details for your test case</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground font-medium">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter a clear, descriptive title for your test case"
                    className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-black dark:text-white font-medium">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Describe what this test case verifies and its purpose"
                    className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="preconditions" className="text-black dark:text-white font-medium">Preconditions</Label>
                  <Textarea
                    id="preconditions"
                    value={formData.preconditions}
                    onChange={(e) => handleFormChange('preconditions', e.target.value)}
                    placeholder="List any setup requirements or preconditions for this test"
                    className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expectedResult" className="text-black dark:text-white font-medium">Expected Final Result *</Label>
                  <Textarea
                    id="expectedResult"
                    value={formData.expectedResult}
                    onChange={(e) => handleFormChange('expectedResult', e.target.value)}
                    placeholder="Describe the overall expected outcome of this test case"
                    className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-black dark:text-white font-medium">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleFormChange('priority', value)}>
                      <SelectTrigger className="mt-1 bg-background border-2 border-input text-foreground hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring transition-all duration-200">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-2 border-border">
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
                    <Label htmlFor="githubUrl" className="text-black dark:text-white font-medium">GitHub Issue URL (Optional)</Label>
                    <Input
                      id="githubUrl"
                      value={formData.githubIssueUrl}
                      onChange={(e) => handleFormChange('githubIssueUrl', e.target.value)}
                      placeholder="https://github.com/owner/repo/issues/123"
                      className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-card border-2 border-border transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-card-foreground">Tags</CardTitle>
                <CardDescription className="text-muted-foreground">Add tags to categorize and organize your test case</CardDescription>
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
                      className="flex-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                    />
                    <Button 
                      onClick={() => addTag(tagInput)} 
                      disabled={!tagInput}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Common Tags */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Common tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonTags.map(tag => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => addTag(tag)}
                          disabled={formData.tags.includes(tag)}
                          className="text-xs bg-background hover:bg-accent border border-border hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Selected tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200" 
                            onClick={() => removeTag(tag)}
                          >
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
            <Card className="bg-card border-2 border-border transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">Test Steps</CardTitle>
                    <CardDescription className="text-muted-foreground">Define the step-by-step actions and expected results</CardDescription>
                  </div>
                  <Button 
                    onClick={addStep}
                    className="bg-primary hover:bg-primary/90 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="bg-muted/50 border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-foreground">{index + 1}</span>
                          </div>
                          <h3 className="font-medium text-foreground">Step {index + 1}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                            className="hover:bg-accent disabled:opacity-50 transition-all duration-200"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                            className="hover:bg-accent disabled:opacity-50 transition-all duration-200"
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            disabled={steps.length === 1}
                            className="hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`action-${index}`} className="text-foreground font-medium">Action *</Label>
                          <Textarea
                            id={`action-${index}`}
                            value={step.action}
                            onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                            placeholder="Describe the action to be performed"
                            rows={2}
                            className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`expected-${index}`} className="text-foreground font-medium">Expected Result *</Label>
                          <Textarea
                            id={`expected-${index}`}
                            value={step.expectedResult}
                            onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                            placeholder="Describe the expected outcome"
                            rows={2}
                            className="mt-1 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
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
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="bg-background hover:bg-accent border-2 border-border hover:border-primary transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Test Case...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Test Case
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