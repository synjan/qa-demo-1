'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TestTube2, 
  Play, 
  Search, 
  Filter, 
  Clock,
  ArrowUpDown,
  Eye
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
          <TestTube2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading test cases...</p>
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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
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
              Showing {filteredTests.length} of {testCases.length} test cases
            </p>
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
        </CardContent>
      </Card>

      {/* Test Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTests.length > 0 ? (
          filteredTests.map((testCase) => (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
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

      {/* Load More / Pagination could go here */}
      {filteredTests.length > 20 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Test Cases
          </Button>
        </div>
      )}
    </div>
  )
}