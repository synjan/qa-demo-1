import { NextRequest, NextResponse } from 'next/server'
import { GitHubCacheManager } from '@/lib/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { createHash } from 'crypto'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Get token from session or header
    let token: string | null = null
    
    if (session?.accessToken) {
      token = session.accessToken as string
    } else {
      token = request.headers.get('Authorization')?.replace('Bearer ', '') || null
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const scope = searchParams.get('scope') // 'user', 'all', or specific cache type
    const userOnly = searchParams.get('user') === 'true'

    if (scope === 'all' && !userOnly) {
      // Invalidate all cache entries (admin function)
      await GitHubCacheManager.invalidateAllCache()
      return NextResponse.json({ 
        message: 'All cache entries invalidated successfully',
        scope: 'all'
      })
    } else {
      // Invalidate cache for current user only
      await GitHubCacheManager.invalidateUserCache(token)
      return NextResponse.json({ 
        message: 'User cache invalidated successfully',
        scope: 'user'
      })
    }
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}

// POST endpoint for selective invalidation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Get token from session or header
    let token: string | null = null
    
    if (session?.accessToken) {
      token = session.accessToken as string
    } else {
      token = request.headers.get('Authorization')?.replace('Bearer ', '') || null
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { type, owner, repo, state } = body

    if (type === 'repositories') {
      // Invalidate only repositories cache for user
      const cacheKey = GitHubCacheManager.getRepositoryCacheKey(token)
      console.log(`Invalidating repositories cache: ${cacheKey}`)
      await GitHubCacheManager.invalidateUserCache(token) // For now, invalidate all user cache
      
      return NextResponse.json({ 
        message: 'Repositories cache invalidated successfully',
        type: 'repositories'
      })
    } else if (type === 'issues' && owner && repo) {
      // Invalidate specific issues cache
      const issueState = state || 'open'
      const cacheKey = GitHubCacheManager.getIssuesCacheKey(owner, repo, issueState, token)
      console.log(`Invalidating issues cache: ${cacheKey}`)
      
      // For granular invalidation, we would need to implement specific methods
      // For now, invalidate all user cache
      await GitHubCacheManager.invalidateUserCache(token)
      
      return NextResponse.json({ 
        message: `Issues cache invalidated successfully for ${owner}/${repo} (${issueState})`,
        type: 'issues',
        repository: `${owner}/${repo}`,
        state: issueState
      })
    } else {
      return NextResponse.json({ 
        error: 'Invalid invalidation request. Provide type and required parameters.' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in selective cache invalidation:', error)
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}

// GET endpoint to preview what would be invalidated
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Get token from session or header
    let token: string | null = null
    
    if (session?.accessToken) {
      token = session.accessToken as string
    } else {
      token = request.headers.get('Authorization')?.replace('Bearer ', '') || null
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const scope = searchParams.get('scope')
    
    if (scope === 'user') {
      // Show what user cache would be invalidated
      const userHash = createHash('sha256').update(token).digest('hex').substring(0, 8)
      const repoKey = `repos-${userHash}`
      
      return NextResponse.json({
        scope: 'user',
        userHash,
        items: [
          { type: 'repositories', key: repoKey },
          { type: 'issues', pattern: `issues-*-*-*-${userHash}` }
        ],
        note: 'This shows what would be invalidated for the current user'
      })
    }

    return NextResponse.json({
      availableScopes: ['user', 'all'],
      currentUser: createHash('sha256').update(token).digest('hex').substring(0, 8),
      note: 'Use ?scope=user to see what would be invalidated for current user'
    })
  } catch (error) {
    console.error('Error previewing cache invalidation:', error)
    return NextResponse.json({ error: 'Failed to preview cache invalidation' }, { status: 500 })
  }
}