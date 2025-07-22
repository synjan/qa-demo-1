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
    const { searchParams } = new URL(request.url)
    
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const state = searchParams.get('state') as 'open' | 'closed' | 'all' || 'open'
    
    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo parameters are required' }, { status: 400 })
    }
    
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
      const cached = await GitHubCacheManager.getCachedIssues(owner, repo, state, token)
      if (cached) {
        cacheStatus = 'HIT'
        const responseTime = Date.now() - startTime
        console.log(`GitHub API Cache HIT: issues ${owner}/${repo} (${state}) (${responseTime}ms)`)
        
        return NextResponse.json(cached, {
          headers: {
            'X-Cache-Status': cacheStatus,
            'X-Response-Time': `${responseTime}ms`,
            'X-Cache-Key': `${owner}/${repo}/${state}`
          }
        })
      }
      cacheStatus = 'MISS'
    }

    const github = GitHubService.createFromToken(token)
    const issues = await github.getIssues(owner, repo, state)
    
    const responseTime = Date.now() - startTime
    console.log(`GitHub API Cache ${cacheStatus}: issues ${owner}/${repo} (${state}) (${responseTime}ms)`)

    return NextResponse.json(issues, {
      headers: {
        'X-Cache-Status': cacheStatus,
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Key': `${owner}/${repo}/${state}`
      }
    })
  } catch (error) {
    console.error('Error fetching issues:', error)
    
    // Try to serve stale cache on error
    if (GitHubCacheManager.isCacheEnabled()) {
      try {
        const { searchParams } = new URL(request.url)
        const owner = searchParams.get('owner')
        const repo = searchParams.get('repo') 
        const state = searchParams.get('state') as 'open' | 'closed' | 'all' || 'open'
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') || ''
        
        if (owner && repo) {
          const staleCache = await GitHubCacheManager.getCachedIssues(owner, repo, state, token)
          if (staleCache) {
            console.log(`Serving stale cache due to API error: ${owner}/${repo} (${state})`)
            return NextResponse.json(staleCache, {
              headers: {
                'X-Cache-Status': 'STALE',
                'X-Response-Time': `${Date.now() - startTime}ms`,
                'X-Cache-Key': `${owner}/${repo}/${state}`
              }
            })
          }
        }
      } catch (cacheError) {
        console.error('Failed to serve stale cache:', cacheError)
      }
    }
    
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
  }
}