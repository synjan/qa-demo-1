"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Plus, 
  Play, 
  Edit, 
  Trash2, 
  Copy, 
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  FileText,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TestPlan {
  id: string
  name: string
  description: string
  testCases: string[]
  createdAt: string
  updatedAt: string
  status: 'active' | 'archived' | 'draft'
  owner: string
  lastExecuted?: string
  stats: {
    total: number
    passed: number
    failed: number
    pending: number
  }
}

export default function TestPlansPage() {
  const router = useRouter()
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('updated')

  useEffect(() => {
    // Simulate loading test plans
    const loadTestPlans = async () => {
      setLoading(true)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      const mockPlans: TestPlan[] = [
        {
          id: '1',
          name: 'Regression Test Suite',
          description: 'Complete regression testing for all critical features',
          testCases: ['tc1', 'tc2', 'tc3', 'tc4', 'tc5'],
          createdAt: '2025-07-20T10:00:00Z',
          updatedAt: '2025-07-22T14:30:00Z',
          status: 'active',
          owner: 'Test User',
          lastExecuted: '2025-07-22T14:30:00Z',
          stats: {
            total: 5,
            passed: 3,
            failed: 1,
            pending: 1
          }
        },
        {
          id: '2',
          name: 'Smoke Test Suite',
          description: 'Quick validation of core functionality',
          testCases: ['tc6', 'tc7', 'tc8'],
          createdAt: '2025-07-18T09:00:00Z',
          updatedAt: '2025-07-21T11:00:00Z',
          status: 'active',
          owner: 'Test User',
          lastExecuted: '2025-07-21T11:00:00Z',
          stats: {
            total: 3,
            passed: 3,
            failed: 0,
            pending: 0
          }
        },
        {
          id: '3',
          name: 'New Feature Test Plan',
          description: 'Test cases for the upcoming release features',
          testCases: ['tc9', 'tc10'],
          createdAt: '2025-07-22T16:00:00Z',
          updatedAt: '2025-07-22T16:00:00Z',
          status: 'draft',
          owner: 'Test User',
          stats: {
            total: 2,
            passed: 0,
            failed: 0,
            pending: 2
          }
        }
      ]
      
      setTestPlans(mockPlans)
      setLoading(false)
    }

    loadTestPlans()
  }, [])

  const filteredPlans = testPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (sortBy === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return 0
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'draft': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'archived': return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default: return ''
    }
  }

  const getCompletionRate = (stats: TestPlan['stats']) => {
    const executed = stats.passed + stats.failed
    return stats.total > 0 ? Math.round((executed / stats.total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading test plans...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Test Plans</h1>
            <p className="text-muted-foreground mt-1">Organize and execute test suites efficiently</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Test Plan
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search test plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Showing {sortedPlans.length} of {testPlans.length} test plans
        </p>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {plan.testCases.length} tests
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-medium">{getCompletionRate(plan.stats)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${getCompletionRate(plan.stats)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{plan.stats.passed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>{plan.stats.failed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>{plan.stats.pending}</span>
                    </div>
                  </div>

                  {plan.lastExecuted && (
                    <p className="text-xs text-muted-foreground">
                      Last run: {new Date(plan.lastExecuted).toLocaleDateString()}
                    </p>
                  )}

                  <Button 
                    className="w-full gap-2" 
                    onClick={() => router.push(`/test-runner/execute-plan/${plan.id}`)}
                  >
                    <Play className="h-4 w-4" />
                    Execute Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-lg border">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4">Plan Name</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Tests</th>
                  <th className="text-left p-4">Progress</th>
                  <th className="text-left p-4">Last Run</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlans.map((plan) => (
                  <tr key={plan.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {plan.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                    </td>
                    <td className="p-4">{plan.testCases.length}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${getCompletionRate(plan.stats)}%` }}
                          />
                        </div>
                        <span className="text-sm">{getCompletionRate(plan.stats)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {plan.lastExecuted 
                        ? new Date(plan.lastExecuted).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/test-runner/execute-plan/${plan.id}`)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {sortedPlans.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No test plans found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? "Try adjusting your filters or search query"
              : "Create your first test plan to organize test execution"
            }
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Test Plan
          </Button>
        </Card>
      )}
    </div>
  )
}