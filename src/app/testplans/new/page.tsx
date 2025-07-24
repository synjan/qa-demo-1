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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Save, 
  TestTube2, 
  Search,
  Loader2,
  Plus
} from 'lucide-react'
import { TestCase, TestPlan } from '@/lib/types'

export default function NewTestPlanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0')
  const [repository, setRepository] = useState('')
  
  // Test cases state
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch test cases
  useEffect(() => {
    fetchTestCases()
  }, [])

  const fetchTestCases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/testcases')
      
      if (!response.ok) {
        throw new Error('Failed to fetch test cases')
      }
      
      const data = await response.json()
      setAllTestCases(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test cases')
    } finally {
      setLoading(false)
    }
  }

  const handleTestCaseToggle = (testCaseId: string, checked: boolean) => {
    const newSelected = new Set(selectedTestCases)
    if (checked) {
      newSelected.add(testCaseId)
    } else {
      newSelected.delete(testCaseId)
    }
    setSelectedTestCases(newSelected)
  }

  const handleSelectAll = () => {
    const filteredTestCases = getFilteredTestCases()
    if (selectedTestCases.size === filteredTestCases.length) {
      setSelectedTestCases(new Set())
    } else {
      setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.id)))
    }
  }

  const getFilteredTestCases = () => {
    return allTestCases.filter(testCase =>
      searchQuery === '' ||
      testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Test plan name is required')
      return
    }

    if (selectedTestCases.size === 0) {
      setError('Please select at least one test case')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const testPlan: TestPlan = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        version: version.trim(),
        testCases: Array.from(selectedTestCases),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: session?.user?.name || 'Unknown User',
        repository: repository.trim() || undefined
      }

      const response = await fetch('/api/testplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPlan)
      })

      if (!response.ok) {
        throw new Error('Failed to create test plan')
      }

      router.push('/testplans')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test plan')
    } finally {
      setSaving(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-priority-critical/10 text-priority-critical border-priority-critical/30'
      case 'high': return 'bg-priority-high/10 text-priority-high border-priority-high/30'
      case 'medium': return 'bg-priority-medium/10 text-priority-medium border-priority-medium/30'
      case 'low': return 'bg-priority-low/10 text-priority-low border-priority-low/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const filteredTestCases = getFilteredTestCases()

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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
                <h1 className="text-3xl font-bold text-foreground">Create Test Plan</h1>
                <p className="mt-2 text-muted-foreground">
                  Organize test cases into a comprehensive test plan for execution.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Plan Details */}
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Test Plan Details</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Provide basic information about your test plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter test plan name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose and scope of this test plan"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="version" className="text-foreground font-medium">Version</Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="1.0"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="repository" className="text-foreground font-medium">Repository (Optional)</Label>
                    <Input
                      id="repository"
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      placeholder="owner/repo"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Selected Test Cases</h3>
                    <Badge variant="outline">
                      {selectedTestCases.size} selected
                    </Badge>
                  </div>
                  {selectedTestCases.size === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No test cases selected. Choose test cases from the list on the right.
                    </p>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {selectedTestCases.size} test case{selectedTestCases.size === 1 ? '' : 's'} will be included in this plan.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !name.trim() || selectedTestCases.size === 0}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Test Plan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Test Plan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Case Selection */}
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">Select Test Cases</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Choose which test cases to include in this plan
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search test cases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-2 border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
                      />
                    </div>
                  </div>
                  {filteredTestCases.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="bg-background hover:bg-accent border-2 border-border hover:border-primary transition-all duration-200"
                    >
                      {selectedTestCases.size === filteredTestCases.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                    <span className="ml-2 text-foreground">Loading test cases...</span>
                  </div>
                ) : filteredTestCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    {allTestCases.length === 0 ? (
                      <>
                        <p>No test cases found</p>
                        <p className="text-sm">Create test cases first to build test plans</p>
                      </>
                    ) : (
                      <p>No test cases match your search</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredTestCases.map(testCase => (
                      <div
                        key={testCase.id}
                        className="flex items-start space-x-3 p-3 border-2 border-border rounded-lg hover:bg-accent hover:border-primary transition-all duration-200"
                      >
                        <Checkbox
                          checked={selectedTestCases.has(testCase.id)}
                          onCheckedChange={(checked) => 
                            handleTestCaseToggle(testCase.id, checked as boolean)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {testCase.title}
                            </h3>
                            <Badge className={getPriorityColor(testCase.priority)}>
                              {testCase.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {testCase.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {testCase.steps.length} steps
                            </span>
                            {testCase.githubIssue && (
                              <Badge variant="outline" className="text-xs bg-background border-border text-foreground">
                                #{testCase.githubIssue.number}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}