'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GitBranch, Star, Settings2, X } from 'lucide-react'
import { UserPreferencesManager } from '@/lib/user-preferences'

interface FavoriteRepositoriesWidgetProps {
  editMode: boolean
  onRemove?: () => void
}

export function FavoriteRepositoriesWidget({ editMode, onRemove }: FavoriteRepositoriesWidgetProps) {
  const router = useRouter()
  
  // Get favorites directly without state
  const preferences = UserPreferencesManager.getUserPreferences()
  const favoriteRepos = preferences.github.favoriteRepositories || []

  const handleRepoClick = (repoFullName: string) => {
    router.push(`/github?repo=${repoFullName}`)
  }

  const handleManageFavorites = () => {
    router.push('/settings#github')
  }

  return (
    <Card className="relative">
      {editMode && onRemove && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Favorite Repositories
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManageFavorites}
            disabled={editMode}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {favoriteRepos.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              No favorite repositories yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageFavorites}
            >
              Add Favorites
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {favoriteRepos.map((repoFullName: string) => {
              const [owner, name] = repoFullName.split('/')
              return (
                <div
                  key={repoFullName}
                  className="group relative p-3 border rounded-lg hover:bg-accent cursor-pointer transition-all"
                  onClick={() => handleRepoClick(repoFullName)}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{name}</span>
                    <span className="text-sm text-muted-foreground">
                      {owner}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}