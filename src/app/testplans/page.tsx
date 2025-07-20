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
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  Users,
  FileText,
  Play,
  Edit,
  Trash2,
  Copy,
  Loader2
} from 'lucide-react'
import { TestPlan } from '@/lib/types'

export default function TestPlansPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [filteredTestPlans, setFilteredTestPlans] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('updated')

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

  // Fetch test plans
  useEffect(() => {
    fetchTestPlans()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = testPlans

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(testPlan =>
        testPlan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testPlan.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    setFilteredTestPlans(filtered)
  }, [testPlans, searchQuery, sortBy])

  const fetchTestPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/testplans')
      
      if (!response.ok) {
        throw new Error('Failed to fetch test plans')
      }
      
      const data = await response.json()
      setTestPlans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test plans')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestPlan = () => {
    router.push('/testplans/new')
  }

  const handleEditTestPlan = (testPlanId: string) => {
    router.push(`/testplans/${testPlanId}/edit`)
  }

  const handleRunTestPlan = (testPlanId: string) => {
    router.push(`/testplans/${testPlanId}/run`)
  }

  const handleCloneTestPlan = async (testPlan: TestPlan) => {
    try {
      const clonedPlan = {
        ...testPlan,
        id: crypto.randomUUID(),
        name: `${testPlan.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: session?.user?.name || 'Unknown User'
      }
      
      const response = await fetch('/api/testplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedPlan)
      })
      
      if (!response.ok) {
        throw new Error('Failed to clone test plan')
      }
      
      fetchTestPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone test plan')
    }
  }

  const handleDeleteTestPlan = async (testPlanId: string) => {
    if (!confirm('Are you sure you want to delete this test plan?')) return
    
    try {
      const response = await fetch(`/api/testplans/${testPlanId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete test plan')
      }
      
      fetchTestPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete test plan')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
                <h1 className="text-3xl font-bold text-foreground">Test Plans</h1>
                <p className="mt-2 text-muted-foreground">
                  Organize and execute collections of test cases for comprehensive testing.
                </p>
              </div>
              <Button onClick={handleCreateTestPlan}>
                <Plus className="h-4 w-4 mr-2" />
                Create Test Plan
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-destructive">{error}</p>
            </div>
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
                      placeholder="Search test plans..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Test Plans Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading test plans...</span>
            </div>
          ) : filteredTestPlans.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No test plans found</h3>
                <p className="text-muted-foreground mb-4">
                  {testPlans.length === 0 
                    ? "Create your first test plan to organize test cases for execution."
                    : "No test plans match your current filters."
                  }
                </p>
                <Button onClick={handleCreateTestPlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestPlans.map(testPlan => (
                <Card key={testPlan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {testPlan.name}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-3">
                          {testPlan.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <FileText className="h-4 w-4 mr-1" />
                          {testPlan.testCases.length} test cases
                        </div>
                        <Badge variant="outline">v{testPlan.version}</Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Updated: {formatDate(testPlan.updatedAt)}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          By: {testPlan.createdBy}
                        </div>
                        {testPlan.repository && (
                          <div className="text-xs text-info">
                            Repository: {testPlan.repository}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleRunTestPlan(testPlan.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditTestPlan(testPlan.id)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCloneTestPlan(testPlan)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteTestPlan(testPlan.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Summary Stats */}
          {testPlans.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Test Plan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-info">{testPlans.length}</div>
                    <div className="text-sm text-muted-foreground">Total Plans</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">
                      {testPlans.reduce((acc, plan) => acc + plan.testCases.length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Test Cases</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(testPlans.reduce((acc, plan) => acc + plan.testCases.length, 0) / testPlans.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg per Plan</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {new Set(testPlans.map(plan => plan.createdBy)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Contributors</div>
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