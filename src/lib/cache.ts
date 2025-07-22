import { promises as fs } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

export interface CacheEntry<T> {
  data: T
  metadata: {
    timestamp: number
    ttl: number
    etag?: string
    lastModified?: string
    userHash: string
    key: string
  }
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  entries: number
  lastCleanup: number
  apiSavings: number // Estimated API calls saved
  avgResponseTime: number // Average response time for cache hits (ms)
  totalResponseTime: number // Total response time across all operations
  operationCount: number // Total operations for average calculation
}

export class GitHubCacheManager {
  private static readonly CACHE_DIR = join(process.cwd(), '.cache', 'github')
  private static readonly REPOS_DIR = join(this.CACHE_DIR, 'repositories')
  private static readonly ISSUES_DIR = join(this.CACHE_DIR, 'issues')
  private static readonly STATS_FILE = join(this.CACHE_DIR, 'stats.json')
  
  // Default TTL values (in milliseconds)
  private static readonly DEFAULT_REPO_TTL = 15 * 60 * 1000 // 15 minutes
  private static readonly DEFAULT_ISSUE_TTL = 5 * 60 * 1000 // 5 minutes
  
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    lastCleanup: Date.now(),
    apiSavings: 0,
    avgResponseTime: 0,
    totalResponseTime: 0,
    operationCount: 0
  }

  /**
   * Initialize cache directories and load stats
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.REPOS_DIR, { recursive: true })
      await fs.mkdir(this.ISSUES_DIR, { recursive: true })
      await this.loadStats()
    } catch (error) {
      console.error('Failed to initialize cache:', error)
    }
  }

  /**
   * Generate cache key for repositories
   */
  static getRepositoryCacheKey(userToken: string): string {
    const userHash = this.hashUserToken(userToken)
    return `repos-${userHash}`
  }

  /**
   * Generate cache key for issues
   */
  static getIssuesCacheKey(
    owner: string, 
    repo: string, 
    state: string, 
    userToken: string
  ): string {
    const userHash = this.hashUserToken(userToken)
    return `issues-${owner}-${repo}-${state}-${userHash}`
  }

  /**
   * Get cached repositories
   */
  static async getCachedRepositories<T>(userToken: string): Promise<T | null> {
    const startTime = Date.now()
    const key = this.getRepositoryCacheKey(userToken)
    const filePath = join(this.REPOS_DIR, `${key}.json`)
    
    const result = await this.getCacheEntry(filePath, this.getRepoTTL())
    
    if (result) {
      const responseTime = Date.now() - startTime
      this.recordCacheHit(responseTime, 'repositories')
    }
    
    return result
  }

  /**
   * Cache repositories data
   */
  static async setCachedRepositories<T>(
    userToken: string, 
    data: T, 
    etag?: string
  ): Promise<void> {
    const key = this.getRepositoryCacheKey(userToken)
    const filePath = join(this.REPOS_DIR, `${key}.json`)
    const userHash = this.hashUserToken(userToken)
    
    await this.setCacheEntry(filePath, data, {
      ttl: this.getRepoTTL(),
      etag,
      userHash,
      key
    })
  }

  /**
   * Get cached issues
   */
  static async getCachedIssues<T>(
    owner: string, 
    repo: string, 
    state: string, 
    userToken: string
  ): Promise<T | null> {
    const startTime = Date.now()
    const key = this.getIssuesCacheKey(owner, repo, state, userToken)
    const filePath = join(this.ISSUES_DIR, `${key}.json`)
    
    const result = await this.getCacheEntry(filePath, this.getIssueTTL())
    
    if (result) {
      const responseTime = Date.now() - startTime
      this.recordCacheHit(responseTime, 'issues')
    }
    
    return result
  }

  /**
   * Cache issues data
   */
  static async setCachedIssues<T>(
    owner: string, 
    repo: string, 
    state: string, 
    userToken: string, 
    data: T, 
    etag?: string
  ): Promise<void> {
    const key = this.getIssuesCacheKey(owner, repo, state, userToken)
    const filePath = join(this.ISSUES_DIR, `${key}.json`)
    const userHash = this.hashUserToken(userToken)
    
    await this.setCacheEntry(filePath, data, {
      ttl: this.getIssueTTL(),
      etag,
      userHash,
      key
    })
  }

  /**
   * Generic method to get cache entry
   */
  private static async getCacheEntry<T>(filePath: string, ttl: number): Promise<T | null> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const cacheEntry: CacheEntry<T> = JSON.parse(fileContent)
      
      // Check if cache entry is still valid
      const now = Date.now()
      const age = now - cacheEntry.metadata.timestamp
      
      if (age > ttl) {
        // Cache expired, delete file
        await fs.unlink(filePath).catch(() => {}) // Ignore deletion errors
        this.updateStats({ misses: 1 })
        return null
      }
      
      this.updateStats({ hits: 1 })
      return cacheEntry.data
    } catch (error) {
      // File doesn't exist or invalid JSON
      this.updateStats({ misses: 1 })
      return null
    }
  }

  /**
   * Generic method to set cache entry
   */
  private static async setCacheEntry<T>(
    filePath: string, 
    data: T, 
    options: {
      ttl: number
      etag?: string
      userHash: string
      key: string
    }
  ): Promise<void> {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        metadata: {
          timestamp: Date.now(),
          ttl: options.ttl,
          etag: options.etag,
          userHash: options.userHash,
          key: options.key
        }
      }
      
      const content = JSON.stringify(cacheEntry, null, 2)
      await fs.writeFile(filePath, content, 'utf-8')
      
      // Update stats
      const stats = await fs.stat(filePath)
      this.updateStats({ 
        entries: 1, 
        size: stats.size 
      })
    } catch (error) {
      console.error('Failed to write cache entry:', error)
    }
  }

  /**
   * Get cache entry metadata (useful for ETag validation)
   */
  static async getCacheMetadata(filePath: string): Promise<CacheEntry<unknown>['metadata'] | null> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const cacheEntry: CacheEntry<unknown> = JSON.parse(fileContent)
      return cacheEntry.metadata
    } catch (error) {
      return null
    }
  }

  /**
   * Invalidate cache for specific user
   */
  static async invalidateUserCache(userToken: string): Promise<void> {
    const userHash = this.hashUserToken(userToken)
    
    try {
      // Remove repository cache
      const repoKey = `repos-${userHash}.json`
      await fs.unlink(join(this.REPOS_DIR, repoKey)).catch(() => {})
      
      // Remove all issue caches for this user
      const issueFiles = await fs.readdir(this.ISSUES_DIR)
      const userIssueFiles = issueFiles.filter(file => file.includes(`-${userHash}.json`))
      
      await Promise.all(
        userIssueFiles.map(file => 
          fs.unlink(join(this.ISSUES_DIR, file)).catch(() => {})
        )
      )
      
      console.log(`Invalidated cache for user ${userHash}`)
    } catch (error) {
      console.error('Failed to invalidate user cache:', error)
    }
  }

  /**
   * Invalidate all cache entries
   */
  static async invalidateAllCache(): Promise<void> {
    try {
      await Promise.all([
        this.clearDirectory(this.REPOS_DIR),
        this.clearDirectory(this.ISSUES_DIR)
      ])
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        size: 0,
        entries: 0,
        lastCleanup: Date.now(),
        apiSavings: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
        operationCount: 0
      }
      await this.saveStats()
      
      console.log('All cache entries invalidated')
    } catch (error) {
      console.error('Failed to invalidate all cache:', error)
    }
  }

  /**
   * Cleanup expired cache entries
   */
  static async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now()
    
    // Only run cleanup every hour
    if (now - this.stats.lastCleanup < 60 * 60 * 1000) {
      return
    }
    
    try {
      await Promise.all([
        this.cleanupDirectory(this.REPOS_DIR, this.getRepoTTL()),
        this.cleanupDirectory(this.ISSUES_DIR, this.getIssueTTL())
      ])
      
      this.stats.lastCleanup = now
      await this.saveStats()
      
      console.log('Cache cleanup completed')
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<CacheStats> {
    await this.updateCacheSize()
    return { ...this.stats }
  }

  /**
   * Clear specific directory
   */
  private static async clearDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath)
      await Promise.all(
        files.map(file => fs.unlink(join(dirPath, file)).catch(() => {}))
      )
    } catch (error) {
      // Directory might not exist, ignore
    }
  }

  /**
   * Cleanup expired entries in directory
   */
  private static async cleanupDirectory(dirPath: string, ttl: number): Promise<void> {
    try {
      const files = await fs.readdir(dirPath)
      const now = Date.now()
      
      for (const file of files) {
        const filePath = join(dirPath, file)
        const metadata = await this.getCacheMetadata(filePath)
        
        if (metadata && (now - metadata.timestamp) > ttl) {
          await fs.unlink(filePath).catch(() => {})
        }
      }
    } catch (error) {
      // Directory might not exist, ignore
    }
  }

  /**
   * Update cache statistics
   */
  private static updateStats(updates: Partial<CacheStats>): void {
    this.stats = { ...this.stats, ...updates }
    // Save stats periodically (every 10 hits/misses)
    if ((this.stats.hits + this.stats.misses) % 10 === 0) {
      this.saveStats().catch(console.error)
    }
  }

  /**
   * Calculate current cache size
   */
  private static async updateCacheSize(): Promise<void> {
    try {
      let totalSize = 0
      let totalEntries = 0
      
      const directories = [this.REPOS_DIR, this.ISSUES_DIR]
      
      for (const dir of directories) {
        try {
          const files = await fs.readdir(dir)
          for (const file of files) {
            const filePath = join(dir, file)
            const stats = await fs.stat(filePath)
            totalSize += stats.size
            totalEntries++
          }
        } catch (error) {
          // Directory might not exist
        }
      }
      
      this.stats.size = totalSize
      this.stats.entries = totalEntries
    } catch (error) {
      console.error('Failed to update cache size:', error)
    }
  }

  /**
   * Load stats from file
   */
  private static async loadStats(): Promise<void> {
    try {
      const content = await fs.readFile(this.STATS_FILE, 'utf-8')
      this.stats = { ...this.stats, ...JSON.parse(content) }
    } catch (error) {
      // Stats file doesn't exist, use defaults
    }
  }

  /**
   * Save stats to file
   */
  private static async saveStats(): Promise<void> {
    try {
      await fs.writeFile(this.STATS_FILE, JSON.stringify(this.stats, null, 2))
    } catch (error) {
      console.error('Failed to save cache stats:', error)
    }
  }

  /**
   * Hash user token for privacy
   */
  private static hashUserToken(token: string): string {
    return createHash('sha256').update(token).digest('hex').substring(0, 8)
  }

  /**
   * Get repository cache TTL from environment
   */
  private static getRepoTTL(): number {
    const envTTL = process.env.GITHUB_CACHE_REPO_TTL
    return envTTL ? parseInt(envTTL, 10) * 1000 : this.DEFAULT_REPO_TTL
  }

  /**
   * Get issue cache TTL from environment
   */
  private static getIssueTTL(): number {
    const envTTL = process.env.GITHUB_CACHE_ISSUE_TTL
    return envTTL ? parseInt(envTTL, 10) * 1000 : this.DEFAULT_ISSUE_TTL
  }

  /**
   * Check if caching is enabled
   */
  static isCacheEnabled(): boolean {
    return process.env.GITHUB_CACHE_ENABLED !== 'false'
  }

  /**
   * Record cache hit with performance metrics
   */
  private static recordCacheHit(responseTime: number, type: string): void {
    this.stats.apiSavings++
    this.stats.totalResponseTime += responseTime
    this.stats.operationCount++
    this.stats.avgResponseTime = this.stats.totalResponseTime / this.stats.operationCount
    
    // Log performance for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache HIT: ${type} (${responseTime}ms) - Total API savings: ${this.stats.apiSavings}`)
    }
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    cacheHitRate: number
    averageHitResponseTime: number
    estimatedApiCallsSaved: number
    estimatedTimeSaved: number
  } {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) : 0
    
    // Estimate time saved (assuming API calls take ~300ms on average)
    const estimatedApiTime = 300
    const estimatedTimeSaved = this.stats.apiSavings * estimatedApiTime

    return {
      cacheHitRate: hitRate,
      averageHitResponseTime: this.stats.avgResponseTime,
      estimatedApiCallsSaved: this.stats.apiSavings,
      estimatedTimeSaved // in milliseconds
    }
  }

  /**
   * Log cache performance summary
   */
  static logPerformanceSummary(): void {
    const summary = this.getPerformanceSummary()
    const timeSavedSeconds = (summary.estimatedTimeSaved / 1000).toFixed(2)
    
    console.log('=== GitHub Cache Performance Summary ===')
    console.log(`Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(2)}%`)
    console.log(`Average Cache Response Time: ${summary.averageHitResponseTime.toFixed(2)}ms`)
    console.log(`API Calls Saved: ${summary.estimatedApiCallsSaved}`)
    console.log(`Estimated Time Saved: ${timeSavedSeconds}s`)
    console.log(`Total Cache Entries: ${this.stats.entries}`)
    console.log(`Cache Size: ${(this.stats.size / 1024).toFixed(2)}KB`)
    console.log('=====================================')
  }
}

// Initialize cache on module load
GitHubCacheManager.initialize().catch(console.error)