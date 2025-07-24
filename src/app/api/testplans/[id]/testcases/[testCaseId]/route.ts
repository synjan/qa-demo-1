import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const TESTPLANS_DIR = path.join(process.cwd(), 'testplans');

export async function DELETE(
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

    // Read the test plan
    const testPlanPath = path.join(TESTPLANS_DIR, `${params.id}.json`);
    
    try {
      const data = await fs.readFile(testPlanPath, 'utf-8');
      const testPlan = JSON.parse(data);
      
      // Remove test case from the plan
      testPlan.testCaseIds = testPlan.testCaseIds.filter(
        (id: string) => id !== params.testCaseId
      );
      testPlan.updatedAt = new Date().toISOString();
      
      // Save the updated test plan
      await fs.writeFile(testPlanPath, JSON.stringify(testPlan, null, 2));
      
      return NextResponse.json(testPlan);
    } catch (error) {
      return NextResponse.json(
        { error: 'Test plan not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error removing test case from plan:', error);
    return NextResponse.json(
      { error: 'Failed to remove test case' },
      { status: 500 }
    );
  }
}