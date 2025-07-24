import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

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

    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      return NextResponse.json(settings.integrations || {});
    } catch (error) {
      // Return default integrations if file doesn't exist
      return NextResponse.json({
        github: {
          enabled: true,
          defaultBranch: 'main',
          autoSync: false
        },
        openai: {
          enabled: true,
          model: 'gpt-4',
          temperature: 0.7
        }
      });
    }
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const patToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!session && !patToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const integrations = await request.json();
    
    let settings: any = {
      preferences: {},
      integrations: {}
    };
    
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      settings = JSON.parse(data);
    } catch (error) {
      // Use default settings structure
    }
    
    settings.integrations = {
      ...settings.integrations,
      ...integrations
    };
    
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    return NextResponse.json(settings.integrations);
  } catch (error) {
    console.error('Error updating integrations:', error);
    return NextResponse.json(
      { error: 'Failed to update integrations' },
      { status: 500 }
    );
  }
}