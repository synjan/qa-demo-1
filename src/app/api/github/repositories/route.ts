import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github'
import { GitHubCacheManager } from '@/lib/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let cacheStatus = 'DISABLED'
  
  try {
    const session = await getServerSession(authOptions)
    
    // Get token from session or PAT header
    let token: string | null = null
    
    if (session?.accessToken) {
      token = session.accessToken as string
    } else {
      // Check for PAT in headers
      token = request.headers.get('Authorization')?.replace('Bearer ', '') || null
    }
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 })
    }

    // Check cache first if enabled
    if (GitHubCacheManager.isCacheEnabled()) {
      const cached = await GitHubCacheManager.getCachedRepositories(token)
      if (cached) {
        cacheStatus = 'HIT'
        const responseTime = Date.now() - startTime
        console.log(`GitHub API Cache HIT: repositories (${responseTime}ms)`)
        
        return NextResponse.json(cached, {
          headers: {
            'X-Cache-Status': cacheStatus,
            'X-Response-Time': `${responseTime}ms`
          }
        })
      }
      cacheStatus = 'MISS'
    }

    const github = GitHubService.createFromToken(token)
    const repositories = await github.getRepositories()
    
    const responseTime = Date.now() - startTime
    console.log(`GitHub API Cache ${cacheStatus}: repositories (${responseTime}ms)`)

    return NextResponse.json(repositories, {
      headers: {
        'X-Cache-Status': cacheStatus,
        'X-Response-Time': `${responseTime}ms`
      }
    })
  } catch (error) {
    console.error('Error fetching repositories:', error)
    
    // Try to serve stale cache on error
    if (GitHubCacheManager.isCacheEnabled()) {
      try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') || ''
        const staleCache = await GitHubCacheManager.getCachedRepositories(token)
        if (staleCache) {
          console.log('Serving stale cache due to API error')
          return NextResponse.json(staleCache, {
            headers: {
              'X-Cache-Status': 'STALE',
              'X-Response-Time': `${Date.now() - startTime}ms`
            }
          })
        }
      } catch (cacheError) {
        console.error('Failed to serve stale cache:', cacheError)
      }
    }
    
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}