import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
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
    const user = await github.getUser();

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    
    if (error.status === 401) {
      return NextResponse.json(
        { message: 'Invalid GitHub token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}