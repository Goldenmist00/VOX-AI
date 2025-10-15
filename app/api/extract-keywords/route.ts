import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { debateContext, recentMessages } = await request.json()

    if (!debateContext) {
      return NextResponse.json(
        { error: 'Debate context is required' },
        { status: 400 }
      )
    }

    const keywords = await geminiService.extractDebateKeywords(
      debateContext,
      recentMessages || []
    )

    return NextResponse.json({ keywords })
  } catch (error) {
    console.error('Keyword extraction error:', error)
    
    // Return fallback keywords
    return NextResponse.json({
      keywords: debateContext.tags || [],
      error: 'Keyword extraction failed, using fallback'
    })
  }
}