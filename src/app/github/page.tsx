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
import { GitBranch, Search, Filter, Loader2, Plus, ExternalLink } from 'lucide-react'
import { GitHubRepository, GitHubIssue } from '@/lib/types'
import { getGitHubToken } from '@/lib/auth'

export default function GitHubBrowser() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set())
  
  // Loading states
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [generatingTestCases, setGeneratingTestCases] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [issueState, setIssueState] = useState<'open' | 'closed' | 'all'>('open')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  
  // Error handling
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

  // Fetch repositories on component mount
  useEffect(() => {
    if (session || getGitHubToken()) {
      fetchRepositories()
    }
  }, [session])

  const getAuthHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    const token = getGitHubToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  const fetchRepositories = async () => {
    setLoadingRepos(true)
    setError(null)
    
    try {
      const response = await fetch('/api/github/repositories', {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }
      
      const repos = await response.json()
      setRepositories(repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories')
    } finally {
      setLoadingRepos(false)
    }
  }

  const fetchIssues = async (repo: GitHubRepository) => {
    setLoadingIssues(true)
    setError(null)
    setSelectedIssues(new Set())
    
    try {
      const params = new URLSearchParams({
        owner: repo.owner.login,
        repo: repo.name,
        state: issueState
      })
      
      const response = await fetch(`/api/github/issues?${params}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch issues')
      }
      
      const fetchedIssues = await response.json()
      setIssues(fetchedIssues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues')
      setIssues([])
    } finally {
      setLoadingIssues(false)
    }
  }

  const handleRepositorySelect = (repo: GitHubRepository) => {
    setSelectedRepo(repo)
    fetchIssues(repo)
  }

  const handleIssueSelect = (issueNumber: number, selected: boolean) => {
    const newSelected = new Set(selectedIssues)
    if (selected) {
      newSelected.add(issueNumber)
    } else {
      newSelected.delete(issueNumber)
    }
    setSelectedIssues(newSelected)
  }

  const handleSelectAll = () => {
    const filteredIssues = getFilteredIssues()
    if (selectedIssues.size === filteredIssues.length) {
      setSelectedIssues(new Set())
    } else {
      setSelectedIssues(new Set(filteredIssues.map(issue => issue.number)))
    }
  }

  const generateTestCases = async () => {
    if (!selectedRepo || selectedIssues.size === 0) return
    
    setGeneratingTestCases(true)
    setError(null)
    
    try {
      const response = await fetch('/api/testcases/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          issueNumbers: Array.from(selectedIssues),
          repository: selectedRepo.name,
          owner: selectedRepo.owner.login
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate test cases')
      }
      
      const result = await response.json()
      
      // Show success message and redirect to test cases
      alert(`Successfully generated ${result.testCases.length} test cases!`)
      router.push('/testcases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test cases')
    } finally {
      setGeneratingTestCases(false)
    }
  }

  const getFilteredIssues = () => {
    return issues.filter(issue => {
      const matchesSearch = searchQuery === '' || 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.body && issue.body.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesLabels = selectedLabels.length === 0 ||
        selectedLabels.some(label => issue.labels.some(issueLabel => issueLabel.name === label))
      
      return matchesSearch && matchesLabels
    })
  }

  const getAllLabels = () => {
    const labelSet = new Set<string>()
    issues.forEach(issue => {
      issue.labels.forEach(label => {
        labelSet.add(label.name)
      })
    })
    return Array.from(labelSet).sort()
  }

  const filteredIssues = getFilteredIssues()

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
            <h1 className="text-3xl font-bold text-foreground">GitHub Issues</h1>
            <p className="mt-2 text-muted-foreground">
              Browse your GitHub repositories and generate test cases from issues using AI.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Repository Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GitBranch className="h-5 w-5 mr-2" />
                    Repositories
                  </CardTitle>
                  <CardDescription>
                    Select a repository to view its issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingRepos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading repositories...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {repositories.map(repo => (
                        <div
                          key={repo.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedRepo?.id === repo.id
                              ? 'bg-primary/5 border-primary shadow-md'
                              : 'bg-card border-border hover:bg-accent hover:border-accent-foreground hover:shadow-sm'
                          }`}
                          onClick={() => handleRepositorySelect(repo)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-foreground truncate">
                                {repo.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {repo.owner.login}
                              </div>
                            </div>
                            {repo.private && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                          {repo.description && (
                            <div className="text-sm text-muted-foreground mt-3 line-clamp-2">
                              {repo.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Issues List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Issues</CardTitle>
                      <CardDescription>
                        {selectedRepo 
                          ? `Issues from ${selectedRepo.name} (${filteredIssues.length})`
                          : 'Select a repository to view issues'
                        }
                      </CardDescription>
                    </div>
                    {selectedIssues.size > 0 && (
                      <Button 
                        onClick={generateTestCases}
                        disabled={generatingTestCases}
                        className="ml-4"
                      >
                        {generatingTestCases ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Test Cases ({selectedIssues.size})
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Filters */}
                  {selectedRepo && (
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search issues..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Select value={issueState} onValueChange={(value: any) => setIssueState(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {issues.length > 0 && (
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                          >
                            {selectedIssues.size === filteredIssues.length ? 'Deselect All' : 'Select All'}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {selectedIssues.size} of {filteredIssues.length} selected
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedRepo ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Select a repository to view its issues</p>
                    </div>
                  ) : loadingIssues ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading issues...</span>
                    </div>
                  ) : filteredIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No issues found matching your criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredIssues.map(issue => (
                        <div
                          key={issue.id}
                          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent"
                        >
                          <Checkbox
                            checked={selectedIssues.has(issue.number)}
                            onCheckedChange={(checked) => 
                              handleIssueSelect(issue.number, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm text-foreground truncate">
                                #{issue.number} {issue.title}
                              </h3>
                              <Badge 
                                variant={issue.state === 'open' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {issue.state}
                              </Badge>
                            </div>
                            {issue.body && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {issue.body.substring(0, 150)}...
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-wrap gap-1">
                                {issue.labels.slice(0, 3).map(label => (
                                  <Badge 
                                    key={label.id} 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ 
                                      backgroundColor: `#${label.color}20`,
                                      borderColor: `#${label.color}40`
                                    }}
                                  >
                                    {label.name}
                                  </Badge>
                                ))}
                                {issue.labels.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{issue.labels.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={issue.html_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
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
        </div>
      </main>
    </div>
  )
}