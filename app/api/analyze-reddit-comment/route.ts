import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface RedditCommentAnalysis {
  sentiment: {
    classification: 'positive' | 'negative' | 'neutral'
    confidence: number
    positive_score: number
    negative_score: number
    neutral_score: number
  }
  relevancy: {
    score: number
    reasoning: string
    keywords_matched: string[]
  }
  quality: {
    clarity: number
    coherence: number
    informativeness: number
    overall_quality: number
  }
  engagement: {
    score: number
    factors: string[]
    discussion_potential: number
  }
  insights: {
    key_points: string[]
    stance: 'supporting' | 'opposing' | 'neutral' | 'questioning'
    tone: 'formal' | 'casual' | 'emotional' | 'analytical'
    credibility_indicators: string[]
  }
  contributor: {
    score: number
    expertise_level: 'novice' | 'intermediate' | 'expert'
    contribution_type: 'opinion' | 'fact' | 'experience' | 'question'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { comment, keyword, subreddit, postTitle } = await req.json()

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 800,
      }
    })

    const prompt = `Analyze this Reddit comment and return JSON only:

Comment: "${comment}"
Topic: ${keyword || postTitle || 'General'}

Return this exact JSON structure:
{
  "sentiment": {"classification": "positive|negative|neutral", "confidence": 85, "positive_score": 70, "negative_score": 10, "neutral_score": 20},
  "relevancy": {"score": 88, "reasoning": "brief explanation", "keywords_matched": ["keyword1"]},
  "quality": {"clarity": 85, "coherence": 90, "informativeness": 75, "overall_quality": 83},
  "engagement": {"score": 80, "factors": ["factor1"], "discussion_potential": 85},
  "insights": {"key_points": ["point1"], "stance": "supporting|opposing|neutral|questioning", "tone": "formal|casual|emotional|analytical", "credibility_indicators": ["indicator1"]},
  "contributor": {"score": 75, "expertise_level": "novice|intermediate|expert", "contribution_type": "opinion|fact|experience|question"}
}

Rate 0-100. Be concise. JSON only.`

    // Add timeout for faster failure handling
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout')), 8000)
    )
    
    const analysisPromise = model.generateContent(prompt)
    
    const result = await Promise.race([analysisPromise, timeoutPromise]) as any
    const response = result.response
    const text = response.text()

    // Clean up the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const analysis = JSON.parse(cleanedText) as RedditCommentAnalysis
      
      // Validate and ensure all required fields are present
      if (!analysis.sentiment || !analysis.quality || !analysis.insights) {
        throw new Error('Invalid analysis structure')
      }

      return NextResponse.json({
        success: true,
        analysis
      })
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      console.error('Raw response length:', text?.length || 0)
      console.error('Raw response preview:', text?.substring(0, 200) || 'empty')
      
      // Return a fallback analysis if parsing fails
      const fallbackAnalysis: RedditCommentAnalysis = {
        sentiment: {
          classification: 'neutral',
          confidence: 50,
          positive_score: 40,
          negative_score: 20,
          neutral_score: 40
        },
        relevancy: {
          score: 60,
          reasoning: 'Analysis unavailable',
          keywords_matched: keyword ? [keyword] : []
        },
        quality: {
          clarity: 70,
          coherence: 70,
          informativeness: 65,
          overall_quality: 68
        },
        engagement: {
          score: 65,
          factors: ['User participation'],
          discussion_potential: 60
        },
        insights: {
          key_points: ['Reddit user perspective'],
          stance: 'neutral',
          tone: 'casual',
          credibility_indicators: ['Community member']
        },
        contributor: {
          score: 60,
          expertise_level: 'novice',
          contribution_type: 'opinion'
        }
      }

      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        note: 'Used fallback analysis due to parsing error'
      })
    }
  } catch (error) {
    console.error('Error analyzing Reddit comment:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze Reddit comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}