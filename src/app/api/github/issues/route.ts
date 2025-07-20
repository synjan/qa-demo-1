import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
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

    const github = GitHubService.createFromToken(token)
    const issues = await github.getIssues(owner, repo, state)

    return NextResponse.json(issues)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
  }
}