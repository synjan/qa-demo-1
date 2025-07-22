'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Search, GitBranch, Star, Eye, Users, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { GitHubRepository } from '@/lib/types'

interface RepositoryPickerProps {
  onRepositorySelect: (repository: GitHubRepository | null) => void
  selectedRepository: GitHubRepository | null
  disabled?: boolean
  className?: string
}

export function RepositoryPicker({ 
  onRepositorySelect, 
  selectedRepository, 
  disabled = false,
  className = "" 
}: RepositoryPickerProps) {
  const { data: session } = useSession()
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [filteredRepositories, setFilteredRepositories] = useState<GitHubRepository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'updated_at' | 'stars' | 'forks'>('updated_at')
  const [showOnlyWithIssues, setShowOnlyWithIssues] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchRepositories = useCallback(async () => {
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

      const response = await fetch('/api/github/repositories', {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`)
      }

      const data = await response.json()
      setRepositories(data)
    } catch (err) {
      console.error('Error fetching repositories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }, [session?.accessToken])

  // Filter and sort repositories
  useEffect(() => {
    let filtered = [...repositories]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply issues filter
    if (showOnlyWithIssues) {
      filtered = filtered.filter(repo => repo.has_issues && repo.open_issues_count > 0)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'stars':
          return b.stargazers_count - a.stargazers_count
        case 'forks':
          return b.forks_count - a.forks_count
        default:
          return 0
      }
    })

    setFilteredRepositories(filtered)
  }, [repositories, searchQuery, sortBy, showOnlyWithIssues])

  // Load repositories on mount
  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const handleRepositorySelect = (repo: GitHubRepository) => {
    onRepositorySelect(repo)
    setOpen(false)
  }

  const handleClearSelection = () => {
    onRepositorySelect(null)
    setSearchQuery('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          <span>GitHub Repository</span>
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
            onClick={fetchRepositories}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranch className="h-4 w-4" />
        <span>GitHub Repository</span>
      </div>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={disabled || loading}
            >
              {selectedRepository ? (
                <div className="flex items-center gap-2 truncate">
                  <GitBranch className="h-4 w-4" />
                  <span className="truncate">{selectedRepository.full_name}</span>
                  {selectedRepository.private && (
                    <Badge variant="secondary" className="h-4 text-xs px-1">
                      Private
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Select repository...</span>
                </div>
              )}
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitBranch className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[600px] p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="flex h-11"
                />
              </div>

              <div className="flex items-center gap-2 border-b px-3 py-2 text-sm">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_at">Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stars">Stars</SelectItem>
                    <SelectItem value="forks">Forks</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showOnlyWithIssues ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyWithIssues(!showOnlyWithIssues)}
                  className="h-8 text-xs"
                >
                  With Issues
                </Button>
              </div>

              <CommandList>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading repositories...</span>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No repositories found.</CommandEmpty>
                    <CommandGroup>
                      {filteredRepositories.map((repo) => (
                        <CommandItem
                          key={repo.id}
                          value={repo.full_name}
                          onSelect={() => handleRepositorySelect(repo)}
                          className="flex items-start gap-3 py-3"
                        >
                          <GitBranch className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{repo.name}</span>
                              {repo.private && (
                                <Badge variant="secondary" className="h-4 text-xs px-1">
                                  Private
                                </Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {repo.stargazers_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  <span>{repo.stargazers_count}</span>
                                </div>
                              )}
                              {repo.forks_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <GitBranch className="h-3 w-3" />
                                  <span>{repo.forks_count}</span>
                                </div>
                              )}
                              {repo.open_issues_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>{repo.open_issues_count} issues</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Updated {formatDate(repo.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedRepository && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearSelection}
            disabled={disabled}
          >
            ×
          </Button>
        )}
      </div>

      {selectedRepository && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          <div className="flex items-center justify-between">
            <span>
              {selectedRepository.open_issues_count} open issues • {selectedRepository.stargazers_count} stars
            </span>
            <span>Updated {formatDate(selectedRepository.updated_at)}</span>
          </div>
        </div>
      )}
    </div>
  )
}