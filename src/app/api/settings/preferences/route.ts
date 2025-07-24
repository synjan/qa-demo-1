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
      return NextResponse.json(settings.preferences || {});
    } catch (error) {
      // Return default preferences if file doesn't exist
      return NextResponse.json({
        theme: 'system',
        language: 'en',
        notifications: true,
        autoSave: true
      });
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
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

    const preferences = await request.json();
    
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
    
    settings.preferences = {
      ...settings.preferences,
      ...preferences
    };
    
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    return NextResponse.json(settings.preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}