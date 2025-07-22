import { NextRequest, NextResponse } from 'next/server'
import { GitHubCacheManager } from '@/lib/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Basic authentication check - you might want to add admin role check here
    if (!session) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '')
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
    }

    const stats = await GitHubCacheManager.getStats()
    const performanceSummary = GitHubCacheManager.getPerformanceSummary()
    
    // Calculate additional metrics
    const totalRequests = stats.hits + stats.misses
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests * 100).toFixed(2) : '0.00'
    const averageEntrySize = stats.entries > 0 ? Math.round(stats.size / stats.entries) : 0
    
    // Format size in human readable format
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const enhancedStats = {
      ...stats,
      hitRate: `${hitRate}%`,
      totalRequests,
      averageEntrySize: formatBytes(averageEntrySize),
      totalSize: formatBytes(stats.size),
      lastCleanup: new Date(stats.lastCleanup).toISOString(),
      cacheEnabled: GitHubCacheManager.isCacheEnabled(),
      performance: {
        hitRate: performanceSummary.cacheHitRate,
        averageHitResponseTime: `${performanceSummary.averageHitResponseTime.toFixed(2)}ms`,
        apiCallsSaved: performanceSummary.estimatedApiCallsSaved,
        timeSaved: `${(performanceSummary.estimatedTimeSaved / 1000).toFixed(2)}s`,
        avgResponseTimeMs: stats.avgResponseTime
      },
      ttlSettings: {
        repositories: process.env.GITHUB_CACHE_REPO_TTL ? 
          `${process.env.GITHUB_CACHE_REPO_TTL}s` : '900s (15min)',
        issues: process.env.GITHUB_CACHE_ISSUE_TTL ? 
          `${process.env.GITHUB_CACHE_ISSUE_TTL}s` : '300s (5min)'
      }
    }

    return NextResponse.json(enhancedStats)
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    return NextResponse.json({ error: 'Failed to fetch cache statistics' }, { status: 500 })
  }
}

// Endpoint to trigger cache cleanup manually
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Basic authentication check
    if (!session) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '')
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
    }

    await GitHubCacheManager.cleanupExpiredEntries()
    const updatedStats = await GitHubCacheManager.getStats()

    return NextResponse.json({
      message: 'Cache cleanup completed successfully',
      stats: updatedStats
    })
  } catch (error) {
    console.error('Error during cache cleanup:', error)
    return NextResponse.json({ error: 'Failed to cleanup cache' }, { status: 500 })
  }
}