import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

// Simple in-memory session store (in production, use Redis or database)
const guestSessions = new Map<string, {
  id: string
  name: string
  role: string
  createdAt: Date
  lastActivity: Date
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, role } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Create guest session
    const sessionId = uuidv4()
    const session = {
      id: sessionId,
      name: name.trim(),
      role: role || 'guest',
      createdAt: new Date(),
      lastActivity: new Date()
    }

    // Store session in memory (temporary solution)
    guestSessions.set(sessionId, session)

    // Log guest session creation for audit
    await logGuestActivity(sessionId, 'session_created', {
      name: name.trim(),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      sessionId,
      message: `Guest session created for ${name.trim()}`
    })

  } catch (error) {
    console.error('Guest session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const session = guestSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Update last activity
    session.lastActivity = new Date()
    guestSessions.set(sessionId, session)

    return NextResponse.json({
      valid: true,
      session: {
        id: session.id,
        name: session.name,
        role: session.role,
        createdAt: session.createdAt
      }
    })

  } catch (error) {
    console.error('Guest session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const session = guestSessions.get(sessionId)
    if (session) {
      // Log session end
      await logGuestActivity(sessionId, 'session_ended', {
        name: session.name,
        timestamp: new Date().toISOString(),
        duration: Date.now() - session.createdAt.getTime()
      })

      guestSessions.delete(sessionId)
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended'
    })

  } catch (error) {
    console.error('Guest session deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to log guest activities for audit trail
async function logGuestActivity(sessionId: string, action: string, details: any) {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    await fs.mkdir(logsDir, { recursive: true })

    const logFile = path.join(logsDir, 'guest-activity.log')
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId,
      action,
      details
    }

    const logLine = JSON.stringify(logEntry) + '\n'
    await fs.appendFile(logFile, logLine, 'utf-8')
  } catch (error) {
    console.error('Failed to log guest activity:', error)
    // Don't throw - logging failure shouldn't break the main functionality
  }
}

// Cleanup old sessions (run periodically)
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  for (const [sessionId, session] of guestSessions.entries()) {
    if (now - session.lastActivity.getTime() > maxAge) {
      guestSessions.delete(sessionId)
    }
  }
}, 60 * 60 * 1000) // Check every hour