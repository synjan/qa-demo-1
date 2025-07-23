import { GitHubRepository } from './types'

const FAVORITES_KEY = 'github_repo_favorites'

export class FavoritesManager {
  static getFavorites(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static isFavorite(repoId: number): boolean {
    const favorites = this.getFavorites()
    return favorites.includes(repoId.toString())
  }

  static addFavorite(repoId: number): void {
    if (typeof window === 'undefined') return
    
    const favorites = this.getFavorites()
    if (!favorites.includes(repoId.toString())) {
      favorites.push(repoId.toString())
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    }
  }

  static removeFavorite(repoId: number): void {
    if (typeof window === 'undefined') return
    
    const favorites = this.getFavorites()
    const updated = favorites.filter(id => id !== repoId.toString())
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
  }

  static toggleFavorite(repoId: number): boolean {
    if (this.isFavorite(repoId)) {
      this.removeFavorite(repoId)
      return false
    } else {
      this.addFavorite(repoId)
      return true
    }
  }

  static sortRepositoriesWithFavorites(repositories: GitHubRepository[]): GitHubRepository[] {
    const favorites = this.getFavorites()
    
    // Mark favorites and sort
    const reposWithFavorites = repositories.map(repo => ({
      ...repo,
      isFavorite: favorites.includes(repo.id.toString())
    }))

    // Sort: favorites first, then by updated_at
    return reposWithFavorites.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }
}