'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Tag, 
  User, 
  Calendar,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GitHubIssue, GitHubRepository } from '@/lib/types'

interface IssueSelectorProps {
  repository: GitHubRepository | null
  selectedIssues: GitHubIssue[]
  onIssueSelectionChange: (issues: GitHubIssue[]) => void
  disabled?: boolean
  className?: string
}

export function IssueSelector({ 
  repository, 
  selectedIssues, 
  onIssueSelectionChange, 
  disabled = false,
  className = "" 
}: IssueSelectorProps) {
  const { data: session } = useSession()
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<GitHubIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<'all' | 'open' | 'closed'>('open')
  const [labelFilter, setLabelFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'comments'>('updated')
  const [showFilters, setShowFilters] = useState(false)

  const fetchIssues = useCallback(async () => {
    if (!repository) {
      setIssues([])
      setFilteredIssues([])
      return
    }

    if (!session?.accessToken && typeof window !== 'undefined') {
      const pat = localStorage.getItem('github_pat')
      if (!pat && !session?.accessToken) {
        setError('No GitHub authentication found. Please sign in or provide a Personal Access Token.')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      // Add PAT header if no session token
      if (!session?.accessToken && typeof window !== 'undefined') {
        const pat = localStorage.getItem('github_pat')
        if (pat) {
          headers['Authorization'] = `Bearer ${pat}`
        }
      }

      const [owner, repo] = repository.full_name.split('/')
      const response = await fetch(
        `/api/github/issues?owner=${owner}&repo=${repo}&state=${stateFilter}`, 
        {
          method: 'GET',
          headers
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.status}`)
      }

      const data = await response.json()
      setIssues(data)
    } catch (err) {
      console.error('Error fetching issues:', err)
      setError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }, [repository, session?.accessToken, stateFilter])

  // Filter and sort issues
  useEffect(() => {
    let filtered = [...issues]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.body && issue.body.toLowerCase().includes(searchQuery.toLowerCase())) ||
        issue.number.toString().includes(searchQuery)
      )
    }

    // Apply label filter
    if (labelFilter !== 'all') {
      filtered = filtered.filter(issue => 
        issue.labels.some(label => label.name === labelFilter)
      )
    }

    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(issue => !issue.assignee)
      } else {
        filtered = filtered.filter(issue => 
          issue.assignee?.login === assigneeFilter
        )
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'comments':
          return b.comments - a.comments
        default:
          return 0
      }
    })

    setFilteredIssues(filtered)
  }, [issues, searchQuery, labelFilter, assigneeFilter, sortBy])

  // Load issues when repository changes
  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const handleIssueToggle = (issue: GitHubIssue, checked: boolean) => {
    if (checked) {
      onIssueSelectionChange([...selectedIssues, issue])
    } else {
      onIssueSelectionChange(selectedIssues.filter(i => i.id !== issue.id))
    }
  }

  const handleSelectAll = () => {
    onIssueSelectionChange(filteredIssues)
  }

  const handleClearAll = () => {
    onIssueSelectionChange([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getUniqueLabels = () => {
    const labels = new Set<string>()
    issues.forEach(issue => {
      issue.labels.forEach(label => labels.add(label.name))
    })
    return Array.from(labels).sort()
  }

  const getUniqueAssignees = () => {
    const assignees = new Set<string>()
    issues.forEach(issue => {
      if (issue.assignee) {
        assignees.add(issue.assignee.login)
      }
    })
    return Array.from(assignees).sort()
  }

  if (!repository) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>GitHub Issues</span>
        </div>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-8 rounded-lg text-center">
          Select a repository first to load issues
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>GitHub Issues</span>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchIssues}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>GitHub Issues ({filteredIssues.length})</span>
          {selectedIssues.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedIssues.length} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            disabled={disabled}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            disabled={disabled || loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues by title, body, or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              disabled={disabled || loading}
            />
          </div>
          <Select value={stateFilter} onValueChange={(value: any) => setStateFilter(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <div className="flex gap-2 text-sm">
            <Select value={labelFilter} onValueChange={setLabelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Labels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labels</SelectItem>
                {getUniqueLabels().map(label => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {getUniqueAssignees().map(assignee => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Selection Actions */}
      {filteredIssues.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All ({filteredIssues.length})
          </Button>
          {selectedIssues.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <X className="h-3 w-3 mr-1" />
              Clear Selection
            </Button>
          )}
        </div>
      )}

      {/* Issues List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading issues...</span>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No issues found matching your criteria
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-0">
                {filteredIssues.map((issue, index) => {
                  const isSelected = selectedIssues.some(i => i.id === issue.id)
                  return (
                    <div 
                      key={issue.id}
                      className={`flex items-start gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleIssueToggle(issue, !!checked)}
                        disabled={disabled}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-start gap-2">
                          <h4 className="font-medium text-sm leading-5 line-clamp-2">
                            #{issue.number} {issue.title}
                          </h4>
                          {issue.state === 'closed' && (
                            <Badge variant="outline" className="h-4 text-xs px-1 flex-shrink-0">
                              Closed
                            </Badge>
                          )}
                        </div>

                        {issue.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {issue.body.substring(0, 150)}...
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatDate(issue.created_at)}</span>
                          </div>
                          
                          {issue.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{issue.assignee.login}</span>
                            </div>
                          )}
                          
                          {issue.comments > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{issue.comments} comments</span>
                            </div>
                          )}
                        </div>

                        {issue.labels.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {issue.labels.slice(0, 3).map((label) => (
                              <Badge
                                key={label.id}
                                variant="outline"
                                className="h-4 text-xs px-1"
                                style={{
                                  backgroundColor: `#${label.color}20`,
                                  borderColor: `#${label.color}60`,
                                  color: `#${label.color}`
                                }}
                              >
                                {label.name}
                              </Badge>
                            ))}
                            {issue.labels.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{issue.labels.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}