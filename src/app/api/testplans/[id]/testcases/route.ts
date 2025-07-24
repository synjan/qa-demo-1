import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const TESTPLANS_DIR = path.join(process.cwd(), 'testplans');

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

    const { testCaseIds } = await request.json();
    
    if (!testCaseIds || !Array.isArray(testCaseIds)) {
      return NextResponse.json(
        { error: 'testCaseIds array is required' },
        { status: 400 }
      );
    }

    // Read the test plan
    const testPlanPath = path.join(TESTPLANS_DIR, `${params.id}.json`);
    
    try {
      const data = await fs.readFile(testPlanPath, 'utf-8');
      const testPlan = JSON.parse(data);
      
      // Add test cases to the plan
      testPlan.testCaseIds = [...new Set([...testPlan.testCaseIds, ...testCaseIds])];
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
    console.error('Error adding test cases to plan:', error);
    return NextResponse.json(
      { error: 'Failed to add test cases' },
      { status: 500 }
    );
  }
}