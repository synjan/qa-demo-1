import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const TESTRUNS_DIR = path.join(process.cwd(), 'results');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Read the test run
    const testRunPath = path.join(TESTRUNS_DIR, `${params.id}.json`);
    
    try {
      const data = await fs.readFile(testRunPath, 'utf-8');
      const testRun = JSON.parse(data);
      
      // Mark as completed
      testRun.status = 'completed';
      testRun.completedAt = new Date().toISOString();
      testRun.updatedAt = new Date().toISOString();
      
      // Calculate summary
      const summary = {
        total: testRun.results.length,
        passed: testRun.results.filter((r: any) => r.status === 'passed').length,
        failed: testRun.results.filter((r: any) => r.status === 'failed').length,
        skipped: testRun.results.filter((r: any) => r.status === 'skipped').length,
        blocked: testRun.results.filter((r: any) => r.status === 'blocked').length
      };
      
      testRun.summary = summary;
      
      // Save the updated test run
      await fs.writeFile(testRunPath, JSON.stringify(testRun, null, 2));
      
      return NextResponse.json(testRun);
    } catch (error) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error completing test run:', error);
    return NextResponse.json(
      { error: 'Failed to complete test run' },
      { status: 500 }
    );
  }
}