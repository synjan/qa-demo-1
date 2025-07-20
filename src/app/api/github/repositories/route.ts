import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
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

    const github = GitHubService.createFromToken(token)
    const repositories = await github.getRepositories()

    return NextResponse.json(repositories)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}