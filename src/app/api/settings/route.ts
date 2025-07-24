import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

interface Settings {
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    autoSave: boolean;
  };
  integrations: {
    github: {
      enabled: boolean;
      defaultBranch: string;
      autoSync: boolean;
    };
    openai: {
      enabled: boolean;
      model: string;
      temperature: number;
    };
  };
}

const defaultSettings: Settings = {
  preferences: {
    theme: 'system',
    language: 'en',
    notifications: true,
    autoSave: true
  },
  integrations: {
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
  }
};

async function getSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default settings if file doesn't exist
    return defaultSettings;
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

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

    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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

    const updates = await request.json();
    const currentSettings = await getSettings();
    
    // Merge updates with current settings
    const newSettings: Settings = {
      ...currentSettings,
      ...updates,
      preferences: {
        ...currentSettings.preferences,
        ...(updates.preferences || {})
      },
      integrations: {
        ...currentSettings.integrations,
        ...(updates.integrations || {})
      }
    };

    await saveSettings(newSettings);
    
    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}