'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TestCardSkeleton, TableRowSkeleton } from '@/components/ui/loading-skeletons'
import { 
  TestTube2, 
  Play, 
  Search, 
  Filter, 
  Clock,
  ArrowUpDown,
  Eye,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Trash2,
  CheckSquare
} from 'lucide-react'

interface TestCase {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  tags: string[]
  steps: any[]
  createdAt: string
  updatedAt: string
}

export default function BrowseTests() {
  const router = useRouter()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [filteredTests, setFilteredTests] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updated')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    loadTestCases()
  }, [])

  useEffect(() => {
    filterAndSortTests()
  }, [testCases, searchTerm, priorityFilter, tagFilter, sortBy])

  const loadTestCases = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/testcases')
      if (response.ok) {
        const cases = await response.json()
        setTestCases(cases)
        
        // Extract unique tags
        const tags = new Set<string>()
        cases.forEach((testCase: TestCase) => {
          testCase.tags.forEach(tag => tags.add(tag))
        })
        setAvailableTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Failed to load test cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTests = () => {
    let filtered = testCases.filter(testCase => {
      const matchesSearch = searchTerm === '' || 
        testCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testCase.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPriority = priorityFilter === 'all' || testCase.priority === priorityFilter
      
      const matchesTag = tagFilter === 'all' || testCase.tags.includes(tagFilter)
      
      return matchesSearch && matchesPriority && matchesTag
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    setFilteredTests(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const toggleTestSelection = (testId: string) => {
    const newSelected = new Set(selectedTests)
    if (newSelected.has(testId)) {
      newSelected.delete(testId)
    } else {
      newSelected.add(testId)
    }
    setSelectedTests(newSelected)
  }

  const selectAllVisible = () => {
    const visibleTestIds = paginatedTests.map(test => test.id)
    const newSelected = new Set(selectedTests)
    visibleTestIds.forEach(id => newSelected.add(id))
    setSelectedTests(newSelected)
  }

  const deselectAll = () => {
    setSelectedTests(new Set())
  }

  const bulkAddToTestPlan = () => {
    // TODO: Implement bulk add to test plan
    console.log('Adding tests to plan:', Array.from(selectedTests))
  }

  const bulkDelete = () => {
    // TODO: Implement bulk delete
    console.log('Deleting tests:', Array.from(selectedTests))
  }

  // Pagination
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage)
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Test Cases</h1>
          <p className="text-muted-foreground mt-2">
            Search, filter, and execute available test cases
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TestCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Browse Test Cases</h1>
        <p className="text-muted-foreground mt-2">
          Search, filter, and execute available test cases
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="created">Recently Created</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedTests.length} of {filteredTests.length} test cases
              {selectedTests.size > 0 && ` (${selectedTests.size} selected)`}
            </p>
            <div className="flex items-center gap-2">
              {selectedTests.size > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={bulkAddToTestPlan}
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Add to Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={deselectAll}
                  >
                    Deselect All
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setPriorityFilter('all')
                  setTagFilter('all')
                  setSortBy('updated')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedTests.size > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{selectedTests.size} test(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={selectAllVisible}>
                Select All Visible
              </Button>
              <Button size="sm" variant="outline" onClick={bulkAddToTestPlan}>
                <FolderOpen className="h-4 w-4 mr-1" />
                Add to Test Plan
              </Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Test Cases Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedTests.length > 0 ? (
            paginatedTests.map((testCase) => (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedTests.has(testCase.id)}
                  onCheckedChange={() => toggleTestSelection(testCase.id)}
                />
              </div>
              <CardHeader className="pb-3 pl-12">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {testCase.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {testCase.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {testCase.steps.length} steps
                    </div>
                    <span>Updated {formatDate(testCase.updatedAt)}</span>
                  </div>

                  {/* Priority and Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getPriorityColor(testCase.priority)} text-white text-xs`}>
                      {testCase.priority}
                    </Badge>
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

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={() => router.push(`/test-runner/execute/${testCase.id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Execute Test
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/test-runner/view/${testCase.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <TestTube2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No test cases found</h3>
              <p className="text-muted-foreground">
                {testCases.length === 0 
                  ? "No test cases are available."
                  : "Try adjusting your search filters to find test cases."
                }
              </p>
            </Card>
          </div>
        )}
      </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {paginatedTests.length > 0 ? (
            <Card>
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 w-12">
                      <Checkbox
                        checked={paginatedTests.every(test => selectedTests.has(test.id))}
                        onCheckedChange={(checked) => {
                          if (checked) selectAllVisible()
                          else deselectAll()
                        }}
                      />
                    </th>
                    <th className="p-4 font-medium">Test Case</th>
                    <th className="p-4 font-medium">Priority</th>
                    <th className="p-4 font-medium">Steps</th>
                    <th className="p-4 font-medium">Updated</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTests.map((testCase) => (
                    <tr key={testCase.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedTests.has(testCase.id)}
                          onCheckedChange={() => toggleTestSelection(testCase.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{testCase.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {testCase.description}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getPriorityColor(testCase.priority)} text-white text-xs`}>
                          {testCase.priority}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {testCase.steps.length} steps
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(testCase.updatedAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/test-runner/execute/${testCase.id}`)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/test-runner/view/${testCase.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <TestTube2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No test cases found</h3>
              <p className="text-muted-foreground">
                {testCases.length === 0 
                  ? "No test cases are available."
                  : "Try adjusting your search filters to find test cases."
                }
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              if (totalPages <= 5) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              }
              // Show first, last, and surrounding pages
              if (pageNum === 1 || pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              }
              if (pageNum === 2 && currentPage > 3) {
                return <span key={pageNum} className="px-2">...</span>
              }
              if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key={pageNum} className="px-2">...</span>
              }
              return null
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}