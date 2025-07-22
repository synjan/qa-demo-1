import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication check for streaming - will add it later
    const { text, options } = await request.json()
    const username = 'Guest User'

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const openaiService = OpenAIService.createInstance()
    
    // Create a ReadableStream for server-sent events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the AI generation process
          await openaiService.generateFromFreeTextStream(
            text.trim(), 
            username, 
            options,
            (chunk: any) => {
              // Send each test case as it's generated
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          )
          
          // Send completion signal
          const completionData = `data: ${JSON.stringify({ type: 'complete' })}\n\n`
          controller.enqueue(encoder.encode(completionData))
          controller.close()
          
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('AI streaming generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test cases with streaming' }, 
      { status: 500 }
    )
  }
}