'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GitBranch, Search, Star, StarOff, Loader2 } from 'lucide-react'
import { GitHubRepository } from '@/lib/types'

interface FavoriteRepositoriesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  favoriteRepositories: string[]
  onUpdateFavorites: (favorites: string[]) => void
}

export function FavoriteRepositoriesModal({ 
  open, 
  onOpenChange, 
  favoriteRepositories, 
  onUpdateFavorites 
}: FavoriteRepositoriesModalProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRepos, setSelectedRepos] = useState<string[]>(favoriteRepositories)
  const [error, setError] = useState<string | null>(null)

  // Load repositories when modal opens
  useEffect(() => {
    if (open) {
      setSelectedRepos(favoriteRepositories)
      fetchRepositories()
    }
  }, [open, favoriteRepositories])

  const getAuthHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Try to get token from localStorage first
    const token = typeof window !== 'undefined' ? localStorage.getItem('github_pat') : null
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  const fetchRepositories = async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  const handleToggleFavorite = (repoFullName: string) => {
    const newSelected = selectedRepos.includes(repoFullName)
      ? selectedRepos.filter(name => name !== repoFullName)
      : [...selectedRepos, repoFullName]
    
    setSelectedRepos(newSelected)
  }

  const handleSelectAll = () => {
    const filteredRepos = getFilteredRepositories()
    if (selectedRepos.length === repositories.length) {
      setSelectedRepos([])
    } else {
      setSelectedRepos(filteredRepos.map(repo => repo.full_name))
    }
  }

  const handleSave = () => {
    onUpdateFavorites(selectedRepos)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedRepos(favoriteRepositories) // Reset to original
    onOpenChange(false)
  }

  const getFilteredRepositories = () => {
    return repositories.filter(repo =>
      searchQuery === '' ||
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const filteredRepositories = getFilteredRepositories()
  const hasChanges = JSON.stringify(selectedRepos.sort()) !== JSON.stringify(favoriteRepositories.sort())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Manage Favorite Repositories
          </DialogTitle>
          <DialogDescription>
            Select repositories you use frequently for quick access
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={loading || filteredRepositories.length === 0}
            >
              {selectedRepos.length === repositories.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Status Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {selectedRepos.length} of {repositories.length} repositories selected as favorites
            </span>
            {searchQuery && (
              <span>
                Showing {filteredRepositories.length} of {repositories.length} repositories
              </span>
            )}
          </div>

          {/* Repository List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading repositories...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRepositories}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : filteredRepositories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No repositories found</p>
                {searchQuery && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRepositories.map(repo => {
                  const isFavorite = selectedRepos.includes(repo.full_name)
                  
                  return (
                    <div
                      key={repo.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isFavorite 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => handleToggleFavorite(repo.full_name)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(repo.full_name)
                        }}
                      >
                        {isFavorite ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                        )}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">{repo.name}</span>
                          <span className="text-sm text-muted-foreground truncate">
                            {repo.owner.login}
                          </span>
                          {repo.private && (
                            <Badge variant="secondary" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                        
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {repo.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                          <span>📝 {repo.open_issues_count} issues</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? (
              <span className="text-orange-600">You have unsaved changes</span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Favorites ({selectedRepos.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}