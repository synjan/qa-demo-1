import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GitHubScanner } from '@/lib/scanner/github-scanner'
import { AIGitHubScanner } from '@/lib/scanner/ai-github-scanner'
import { EnhancedAIScanner } from '@/lib/scanner/enhanced-ai-scanner'
import { scanStore } from '@/lib/scanner/scan-store'
import { ScanSession } from '@/lib/types'
import { randomUUID } from 'crypto'

// GET /api/scanner - Get scan history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const authHeader = request.headers.get('authorization')
    const hasPAT = authHeader && authHeader.startsWith('Bearer ')
    
    if (!session && !hasPAT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get scan ID from query params if provided
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('id')

    if (scanId) {
      const scan = scanStore.get(scanId)
      if (!scan) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
      }
      return NextResponse.json(scan)
    }

    // Return all scans for the user
    const scans = scanStore.getUserScans(session?.user?.email || 'anonymous')
    return NextResponse.json({ scans })
  } catch (error) {
    console.error('Error fetching scans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    )
  }
}

// POST /api/scanner - Start a new scan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const authHeader = request.headers.get('authorization')
    const hasPAT = authHeader && authHeader.startsWith('Bearer ')
    
    if (!session && !hasPAT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { repositoryUrl, useAI = false, aiModel = 'gpt-4-turbo-preview' } = body

    if (!repositoryUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      )
    }

    // Get GitHub token
    let token: string | null = null
    if (session?.accessToken) {
      token = session.accessToken
    } else if (hasPAT) {
      token = authHeader!.substring(7) // Remove 'Bearer ' prefix
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No GitHub token available' },
        { status: 401 }
      )
    }

    // Create scan session
    const scanId = randomUUID()
    
    // Parse repository name from URL
    let repositoryName = repositoryUrl
    try {
      const cleanUrl = repositoryUrl.replace(/^https?:\/\//, '').replace(/^github\.com\//, '')
      const parts = cleanUrl.replace(/\.git$/, '').split('/')
      if (parts.length >= 2) {
        repositoryName = parts.slice(-2).join('/')
      }
    } catch {
      // Use original URL if parsing fails
    }
    
    const scanSession: ScanSession = {
      id: scanId,
      repositoryUrl,
      repository: repositoryName,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    }

    scanStore.create(scanSession)

    // Start scan asynchronously
    performScan(scanId, repositoryUrl, token, useAI, aiModel).catch(error => {
      console.error('Scan error:', error)
      scanStore.update(scanId, {
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      })
    })

    return NextResponse.json({
      scanId,
      message: 'Scan started successfully'
    })
  } catch (error) {
    console.error('Error starting scan:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}

// Perform the actual scan (runs asynchronously)
async function performScan(scanId: string, repositoryUrl: string, token: string, useAI: boolean = false, aiModel: string = 'gpt-4-turbo-preview') {
  try {
    // Update status to scanning
    scanStore.update(scanId, { status: 'scanning' })

    // Create scanner instance (Enhanced AI, AI, or regular)
    const scanner = useAI 
      ? new EnhancedAIScanner(token, repositoryUrl, aiModel)
      : new GitHubScanner(token, repositoryUrl)
    
    // Set up progress tracking
    scanner.setProgressCallback((progress, step) => {
      scanStore.update(scanId, {
        progress,
        currentStep: step,
        status: progress < 100 ? 'scanning' : 'analyzing'
      })
    })

    // Perform scan
    const results = await scanner.scan()

    // Update with results
    scanStore.update(scanId, {
      status: 'completed',
      results,
      completedAt: new Date(),
      progress: 100
    })
  } catch (error) {
    throw error
  }
}