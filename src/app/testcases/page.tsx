'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { TestTube2, Search, Filter, Plus, ExternalLink, Loader2, Play, Edit, Eye, CheckSquare, Square } from 'lucide-react'
import { TestCase } from '@/lib/types'

export default function TestCasesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  
  // Batch selection states
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [showBatchActions, setShowBatchActions] = useState(false)

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

  // Apply filters
  useEffect(() => {
    let filtered = testCases

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(testCase =>
        testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testCase.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(testCase => testCase.priority === priorityFilter)
    }

    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(testCase => testCase.tags.includes(tagFilter))
    }

    setFilteredTestCases(filtered)
  }, [testCases, searchQuery, priorityFilter, tagFilter])

  const fetchTestCases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/testcases')
      
      if (!response.ok) {
        throw new Error('Failed to fetch test cases')
      }
      
      const data = await response.json()
      setTestCases(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test cases')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-priority-critical/10 text-priority-critical border-priority-critical/20'
      case 'high': return 'bg-priority-high/10 text-priority-high border-priority-high/20'
      case 'medium': return 'bg-priority-medium/10 text-priority-medium border-priority-medium/20'
      case 'low': return 'bg-priority-low/10 text-priority-low border-priority-low/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getAllTags = () => {
    const tagSet = new Set<string>()
    testCases.forEach(testCase => {
      testCase.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleRunTestCase = (testCaseId: string) => {
    router.push(`/testcases/${testCaseId}/run`)
  }

  const handleViewTestCase = (testCaseId: string) => {
    router.push(`/testcases/${testCaseId}`)
  }

  const handleEditTestCase = (testCaseId: string) => {
    router.push(`/testcases/${testCaseId}/edit`)
  }

  const handleTestCaseSelect = (testCaseId: string, checked: boolean) => {
    const newSelected = new Set(selectedTestCases)
    if (checked) {
      newSelected.add(testCaseId)
    } else {
      newSelected.delete(testCaseId)
    }
    setSelectedTestCases(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTestCases.size === filteredTestCases.length) {
      setSelectedTestCases(new Set())
    } else {
      setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.id)))
    }
  }

  const handleBatchRun = () => {
    if (selectedTestCases.size > 0) {
      const selectedIds = Array.from(selectedTestCases).join(',')
      router.push(`/testcases/batch/run?ids=${selectedIds}`)
    }
  }

  const clearSelection = () => {
    setSelectedTestCases(new Set())
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Test Cases</h1>
                <p className="mt-2 text-muted-foreground">
                  Manage your test cases library and organize testing workflows.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/testcases/new')}>
                  <TestTube2 className="h-4 w-4 mr-2" />
                  Create Test Case
                </Button>
                <Button onClick={() => router.push('/github')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate from GitHub
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBatchActions(!showBatchActions)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Batch Select
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Batch Actions Bar */}
          {showBatchActions && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTestCases.size === filteredTestCases.length && filteredTestCases.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        Select All ({selectedTestCases.size} of {filteredTestCases.length} selected)
                      </span>
                    </div>
                    {selectedTestCases.size > 0 && (
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                    )}
                  </div>
                  {selectedTestCases.size > 0 && (
                    <div className="flex gap-2">
                      <Button onClick={handleBatchRun}>
                        <Play className="h-4 w-4 mr-2" />
                        Run Selected ({selectedTestCases.size})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search test cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {getAllTags().map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Test Cases Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading test cases...</span>
            </div>
          ) : filteredTestCases.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TestTube2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No test cases found</h3>
                <p className="text-muted-foreground mb-4">
                  {testCases.length === 0 
                    ? "Get started by generating test cases from your GitHub issues."
                    : "No test cases match your current filters."
                  }
                </p>
                <Button onClick={() => router.push('/github')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Test Cases
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestCases.map(testCase => (
                <Card key={testCase.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {showBatchActions && (
                          <Checkbox
                            checked={selectedTestCases.has(testCase.id)}
                            onCheckedChange={(checked) => handleTestCaseSelect(testCase.id, checked as boolean)}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {testCase.title}
                          </CardTitle>
                          <CardDescription className="mt-2 line-clamp-3">
                            {testCase.description}
                          </CardDescription>
                        </div>
                      </div>
                      {testCase.githubIssue && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="ml-2"
                        >
                          <a 
                            href={testCase.githubIssue.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getPriorityColor(testCase.priority)}>
                          {testCase.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {testCase.steps.length} steps
                        </span>
                      </div>
                      
                      {testCase.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {testCase.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {testCase.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{testCase.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Created: {formatDate(testCase.createdAt)}</div>
                        <div>By: {testCase.createdBy}</div>
                        {testCase.githubIssue && (
                          <div>
                            Issue: #{testCase.githubIssue.number} in {testCase.githubIssue.repository}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => handleViewTestCase(testCase.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => handleEditTestCase(testCase.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          className="flex-1" 
                          onClick={() => handleRunTestCase(testCase.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Summary Stats */}
          {testCases.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Test Case Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-info">{testCases.length}</div>
                    <div className="text-sm text-muted-foreground">Total Test Cases</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-priority-critical">
                      {testCases.filter(tc => tc.priority === 'critical' || tc.priority === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Priority</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">
                      {testCases.filter(tc => tc.githubIssue).length}
                    </div>
                    <div className="text-sm text-muted-foreground">From GitHub</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">
                      {getAllTags().length}
                    </div>
                    <div className="text-sm text-muted-foreground">Unique Tags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}