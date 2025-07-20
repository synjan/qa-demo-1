'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Search,
  Calendar,
  User,
  FileText,
  Play,
  Eye
} from 'lucide-react'
import { getGuestSession } from '@/lib/guest-auth'

interface StepResult {
  stepId: string
  status: 'pass' | 'fail' | 'blocked' | 'skipped' | 'pending'
  notes: string
  actualResult: string
  timestamp: string
}

interface TestExecution {
  id: string
  testCaseId: string
  executedBy: string
  startedAt: string
  completedAt?: string
  status: 'in_progress' | 'completed' | 'aborted'
  overallResult: 'pass' | 'fail' | 'blocked' | 'skipped' | 'pending'
  stepResults: StepResult[]
  notes: string
  savedAt: string
}

interface TestCase {
  id: string
  title: string
  priority: string
}

export default function ExecutionHistory() {
  const router = useRouter()
  const [executions, setExecutions] = useState<TestExecution[]>([])
  const [testCases, setTestCases] = useState<Map<string, TestCase>>(new Map())
  const [filteredExecutions, setFilteredExecutions] = useState<TestExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [guestSession, setGuestSession] = useState<{ sessionId: string; name: string } | null>(null)

  useEffect(() => {
    const session = getGuestSession()
    if (!session) {
      router.push('/auth/signin')
      return
    }
    setGuestSession(session)
    loadExecutionHistory(session.name)
  }, [router])

  useEffect(() => {
    filterExecutions()
  }, [executions, searchTerm, statusFilter, resultFilter])

  const loadExecutionHistory = async (executedBy: string) => {
    setLoading(true)
    try {
      // Load executions for this user
      const executionsResponse = await fetch(`/api/test-runner/executions?executedBy=${encodeURIComponent(executedBy)}`)
      
      if (executionsResponse.ok) {
        const executionsData = await executionsResponse.json()
        setExecutions(executionsData.executions)
        
        // Load test case details for the executions
        const testCaseIds = [...new Set(executionsData.executions.map((exec: TestExecution) => exec.testCaseId))]
        await loadTestCaseDetails(testCaseIds)
      }
    } catch (error) {
      console.error('Failed to load execution history:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTestCaseDetails = async (testCaseIds: string[]) => {
    const testCaseMap = new Map<string, TestCase>()
    
    // Load test case details in parallel
    const promises = testCaseIds.map(async (id) => {
      try {
        const response = await fetch(`/api/testcases/${id}`)
        if (response.ok) {
          const testCase = await response.json()
          testCaseMap.set(id, {
            id: testCase.id,
            title: testCase.title,
            priority: testCase.priority
          })
        }
      } catch (error) {
        console.warn(`Failed to load test case ${id}:`, error)
      }
    })
    
    await Promise.all(promises)
    setTestCases(testCaseMap)
  }

  const filterExecutions = () => {
    let filtered = executions.filter(execution => {
      const testCase = testCases.get(execution.testCaseId)
      const testTitle = testCase?.title || 'Unknown Test'
      
      const matchesSearch = searchTerm === '' || 
        testTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.notes.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || execution.status === statusFilter
      const matchesResult = resultFilter === 'all' || execution.overallResult === resultFilter
      
      return matchesSearch && matchesStatus && matchesResult
    })
    
    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    
    setFilteredExecutions(filtered)
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />
      case 'blocked': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'pass': return 'bg-green-500'
      case 'fail': return 'bg-red-500'
      case 'blocked': return 'bg-orange-500'
      case 'skipped': return 'bg-gray-500'
      default: return 'bg-gray-400'
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
    return new Date(dateString).toLocaleString()
  }

  const calculateExecutionTime = (execution: TestExecution) => {
    if (!execution.completedAt) return 'In Progress'
    
    const start = new Date(execution.startedAt).getTime()
    const end = new Date(execution.completedAt).getTime()
    const duration = end - start
    
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const getCompletionStats = (execution: TestExecution) => {
    const total = execution.stepResults.length
    const completed = execution.stepResults.filter(step => step.status !== 'pending').length
    const passed = execution.stepResults.filter(step => step.status === 'pass').length
    const failed = execution.stepResults.filter(step => step.status === 'fail').length
    
    return { total, completed, passed, failed }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading execution history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Execution History</h1>
        <p className="text-muted-foreground mt-2">
          View your previous test executions and results
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{executions.length}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {executions.filter(e => e.overallResult === 'pass').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {executions.filter(e => e.overallResult === 'fail').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {executions.filter(e => e.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by test name or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="aborted">Aborted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="pass">Passed</SelectItem>
                <SelectItem value="fail">Failed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredExecutions.length} of {executions.length} executions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Execution List */}
      <div className="space-y-4">
        {filteredExecutions.length > 0 ? (
          filteredExecutions.map((execution) => {
            const testCase = testCases.get(execution.testCaseId)
            const stats = getCompletionStats(execution)
            
            return (
              <Card key={execution.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Main Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {testCase?.title || 'Unknown Test Case'}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          {getResultIcon(execution.overallResult)}
                          <Badge className={`${getResultColor(execution.overallResult)} text-white text-xs`}>
                            {execution.overallResult}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(execution.startedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {calculateExecutionTime(execution)}
                        </div>
                        {testCase?.priority && (
                          <Badge className={`${getPriorityColor(testCase.priority)} text-white text-xs`}>
                            {testCase.priority}
                          </Badge>
                        )}
                      </div>
                      
                      {execution.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {execution.notes}
                        </p>
                      )}
                    </div>

                    {/* Progress Stats */}
                    <div>
                      <h4 className="font-medium mb-2">Step Progress</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Steps:</span>
                          <span>{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span>{stats.completed}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Passed:</span>
                          <span>{stats.passed}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Failed:</span>
                          <span>{stats.failed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/test-runner/execution/${execution.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {execution.status === 'in_progress' && (
                        <Button 
                          size="sm"
                          onClick={() => router.push(`/test-runner/execute/${execution.testCaseId}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/test-runner/execute/${execution.testCaseId}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Re-run Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No execution history found</h3>
            <p className="text-muted-foreground mb-4">
              {executions.length === 0 
                ? "You haven't executed any test cases yet."
                : "No executions match your current filters."
              }
            </p>
            <Button onClick={() => router.push('/test-runner/browse')}>
              Browse Test Cases
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}