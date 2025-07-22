'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  GitBranch, 
  Key, 
  Shield, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Settings,
  Star,
  Plus,
  X
} from 'lucide-react'
import { UserPreferences, UserPreferencesManager } from '@/lib/user-preferences'
import { FavoriteRepositoriesModal } from '@/components/modals/FavoriteRepositoriesModal'

interface GitHubSettingsProps {
  preferences: UserPreferences
  onChange: (updates: Partial<UserPreferences>) => void
}

export function GitHubSettings({ preferences, onChange }: GitHubSettingsProps) {
  const [accessToken, setAccessToken] = useState(preferences.github.accessToken || '')
  const [showToken, setShowToken] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(false)
  const [repositories, setRepositories] = useState<any[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)

  const handleTokenChange = (value: string) => {
    setAccessToken(value)
    setTokenValid(null) // Reset validation status
    onChange({
      github: {
        ...preferences.github,
        accessToken: value
      }
    })
  }

  const handleIntegrationTypeChange = (value: 'oauth' | 'pat') => {
    onChange({
      github: {
        ...preferences.github,
        preferredIntegration: value
      }
    })
  }

  const handleAutoSyncChange = (checked: boolean) => {
    onChange({
      github: {
        ...preferences.github,
        autoSync: checked
      }
    })
  }

  const handleUpdateFavorites = (favorites: string[]) => {
    onChange({
      github: {
        ...preferences.github,
        favoriteRepositories: favorites
      }
    })
  }

  const handleRemoveFavorite = (repoName: string) => {
    const updatedFavorites = preferences.github.favoriteRepositories.filter(
      name => name !== repoName
    )
    handleUpdateFavorites(updatedFavorites)
  }

  const handleDefaultRepositoryChange = (value: string) => {
    onChange({
      github: {
        ...preferences.github,
        defaultRepository: value
      }
    })
  }

  const validateToken = async () => {
    if (!accessToken || !UserPreferencesManager.validateGitHubToken(accessToken)) {
      setTokenValid(false)
      return
    }

    setValidating(true)
    try {
      const response = await fetch('/api/github/repositories', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const repos = await response.json()
        setRepositories(repos)
        setTokenValid(true)
      } else {
        setTokenValid(false)
      }
    } catch (error) {
      setTokenValid(false)
    } finally {
      setValidating(false)
    }
  }

  const loadRepositories = async () => {
    if (!accessToken) return

    setLoadingRepos(true)
    try {
      const response = await fetch('/api/github/repositories', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const repos = await response.json()
        setRepositories(repos)
      }
    } catch (error) {
      console.error('Failed to load repositories:', error)
    } finally {
      setLoadingRepos(false)
    }
  }

  useEffect(() => {
    if (accessToken && tokenValid) {
      loadRepositories()
    }
  }, [accessToken, tokenValid])

  return (
    <div className="space-y-6">
      {/* Integration Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Configure how you connect to GitHub for issue and repository access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="integration-type">Authentication Method</Label>
            <Select 
              value={preferences.github.preferredIntegration} 
              onValueChange={handleIntegrationTypeChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select authentication method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oauth">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    OAuth (Recommended)
                  </div>
                </SelectItem>
                <SelectItem value="pat">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Personal Access Token
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              OAuth provides secure, scoped access. Personal Access Tokens offer more control but require manual management.
            </p>
          </div>

          <Separator />

          {/* Personal Access Token Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="github-token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Personal Access Token
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="github-token"
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateToken}
                  disabled={validating || !accessToken}
                >
                  {validating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Validate'
                  )}
                </Button>
              </div>
              
              {/* Token Status */}
              {accessToken && (
                <div className="flex items-center gap-2 mt-2">
                  {tokenValid === true && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Token is valid</span>
                    </>
                  )}
                  {tokenValid === false && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">Invalid or expired token</span>
                    </>
                  )}
                </div>
              )}
              
              <div className="mt-2">
                <Button variant="link" className="h-auto p-0 text-sm">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Create new token on GitHub
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Repository Settings
          </CardTitle>
          <CardDescription>
            Configure default repository and synchronization preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="default-repo">Default Repository</Label>
            <Select 
              value={preferences.github.defaultRepository || ''} 
              onValueChange={handleDefaultRepositoryChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={repositories.length > 0 ? "Select default repository" : "Load repositories first"} />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem key={repo.full_name} value={repo.full_name}>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      {repo.full_name}
                      {repo.private && (
                        <Badge variant="secondary" className="text-xs">Private</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingRepos && (
              <p className="text-sm text-muted-foreground mt-1">
                <RefreshCw className="h-3 w-3 animate-spin inline mr-1" />
                Loading repositories...
              </p>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-sync" className="text-base font-medium">
                Auto-sync with GitHub
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync test cases with GitHub issues and pull requests
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={preferences.github.autoSync}
              onCheckedChange={handleAutoSyncChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorite Repositories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Favorite Repositories
          </CardTitle>
          <CardDescription>
            Manage your frequently used repositories for quick access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {preferences.github.favoriteRepositories.length} favorites
              </span>
              {preferences.github.favoriteRepositories.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {preferences.github.favoriteRepositories.length}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFavoritesModal(true)}
            >
              <Plus className="h-3 w-3 mr-2" />
              Manage Favorites
            </Button>
          </div>

          {preferences.github.favoriteRepositories.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preferences.github.favoriteRepositories.map((repoName) => (
                <div key={repoName} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{repoName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveFavorite(repoName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No favorite repositories yet</p>
              <p className="text-xs">Click "Manage Favorites" to add repositories</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Access */}
      {repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Repositories</CardTitle>
            <CardDescription>
              Repositories accessible with your current authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repositories.slice(0, 5).map((repo) => (
                <div key={repo.full_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{repo.name}</p>
                      <p className="text-sm text-muted-foreground">{repo.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {repo.private && (
                      <Badge variant="secondary" className="text-xs">Private</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {repo.open_issues_count} issues
                    </Badge>
                  </div>
                </div>
              ))}
              
              {repositories.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {repositories.length - 5} more repositories...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Favorite Repositories Modal */}
      <FavoriteRepositoriesModal
        open={showFavoritesModal}
        onOpenChange={setShowFavoritesModal}
        favoriteRepositories={preferences.github.favoriteRepositories}
        onUpdateFavorites={handleUpdateFavorites}
      />
    </div>
  )
}