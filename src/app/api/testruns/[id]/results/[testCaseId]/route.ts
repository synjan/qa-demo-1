import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const TESTRUNS_DIR = path.join(process.cwd(), 'results');

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; testCaseId: string } }
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

    const result = await request.json();
    
    if (!result.status || !['passed', 'failed', 'skipped', 'blocked'].includes(result.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: passed, failed, skipped, blocked' },
        { status: 400 }
      );
    }

    // Read the test run
    const testRunPath = path.join(TESTRUNS_DIR, `${params.id}.json`);
    
    try {
      const data = await fs.readFile(testRunPath, 'utf-8');
      const testRun = JSON.parse(data);
      
      // Update or add the test result
      const existingResultIndex = testRun.results.findIndex(
        (r: any) => r.testCaseId === params.testCaseId
      );
      
      const testResult = {
        testCaseId: params.testCaseId,
        status: result.status,
        actualResult: result.actualResult || '',
        notes: result.notes || '',
        executedAt: new Date().toISOString(),
        executedBy: session?.user?.email || 'Guest'
      };
      
      if (existingResultIndex >= 0) {
        testRun.results[existingResultIndex] = testResult;
      } else {
        testRun.results.push(testResult);
      }
      
      testRun.updatedAt = new Date().toISOString();
      
      // Save the updated test run
      await fs.writeFile(testRunPath, JSON.stringify(testRun, null, 2));
      
      return NextResponse.json(testResult);
    } catch (error) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating test result:', error);
    return NextResponse.json(
      { error: 'Failed to update test result' },
      { status: 500 }
    );
  }
}