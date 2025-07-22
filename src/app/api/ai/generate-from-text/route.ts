import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, options } = body

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get user information for attribution
    const session = await getServerSession()
    const username = session?.user?.name || 'ai-user'

    // Generate test cases using OpenAI with template options
    const openaiService = OpenAIService.createInstance()
    const testCases = await openaiService.generateFromFreeText(text.trim(), username, options)

    // Return generated test cases
    return NextResponse.json({
      success: true,
      testCases,
      count: testCases.length,
      message: `Generated ${testCases.length} test cases successfully`
    })

  } catch (error) {
    console.error('AI generation API error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate test cases with AI')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate test cases' },
      { status: 500 }
    )
  }
}