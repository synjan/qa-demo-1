import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GitHubService } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const patToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!session && !patToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = patToken || session?.accessToken;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No GitHub token available' },
        { status: 401 }
      );
    }

    const github = new GitHubService(token);
    const repository = await github.getRepository(params.owner, params.repo);

    return NextResponse.json(repository);
  } catch (error: any) {
    console.error('Error fetching repository:', error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 401) {
      return NextResponse.json(
        { message: 'Invalid GitHub token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}