import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { message, debateContext, existingVotes } = await request.json()

    if (!message || !debateContext) {
      return NextResponse.json(
        { error: 'Message and debate context are required' },
        { status: 400 }
      )
    }

    const analysis = await geminiService.analyzeMessage(
      message,
      debateContext,
      existingVotes
    )

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Gemini analysis error:', error)
    
    // Return fallback analysis on error
    return NextResponse.json({
      sentiment: 'neutral',
      relevancyScore: 50,
      keywords: [],
      contextMatch: false,
      confidence: 30,
      error: 'Analysis failed, using fallback'
    })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gemini Analysis API is running' })
}