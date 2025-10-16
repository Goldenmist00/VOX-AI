import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface CommentAnalysis {
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral'
    confidence: number
    positive_score: number
    negative_score: number
    neutral_score: number
  }
  analysis: {
    clarity: number
    relevance: number
    constructiveness: number
    evidence_quality: number
    respectfulness: number
  }
  scores: {
    overall_score: number
    contribution_quality: number
    debate_value: number
  }
  insights: {
    key_points: string[]
    strengths: string[]
    areas_for_improvement: string[]
    debate_impact: string
  }
  classification: {
    type: 'argument' | 'question' | 'solution' | 'concern' | 'opinion'
    stance: 'supporting' | 'opposing' | 'neutral'
    tone: 'professional' | 'casual' | 'passionate' | 'analytical' | 'conversational'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { comment, debateTitle } = await req.json()

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
    Analyze the following comment from a debate discussion and provide comprehensive analysis in JSON format.

    Debate Topic: ${debateTitle || 'General Discussion'}
    Comment: "${comment}"

    Please analyze this comment and return a JSON object with the following structure:
    {
      "sentiment": {
        "overall": "positive|negative|neutral",
        "confidence": 85,
        "positive_score": 70,
        "negative_score": 10,
        "neutral_score": 20
      },
      "analysis": {
        "clarity": 88,
        "relevance": 92,
        "constructiveness": 75,
        "evidence_quality": 65,
        "respectfulness": 90
      },
      "scores": {
        "overall_score": 82,
        "contribution_quality": 78,
        "debate_value": 85
      },
      "insights": {
        "key_points": ["Main point 1", "Main point 2"],
        "strengths": ["Clear communication", "Relevant to topic"],
        "areas_for_improvement": ["Could provide more evidence", "Consider opposing views"],
        "debate_impact": "High - contributes valuable perspective on policy effectiveness"
      },
      "classification": {
        "type": "argument|question|solution|concern|opinion",
        "stance": "supporting|opposing|neutral",
        "tone": "professional|casual|passionate|analytical|conversational"
      }
    }

    Analysis Guidelines:
    1. Sentiment Analysis (0-100 scale):
       - Overall: Determine if the comment is positive, negative, or neutral
       - Confidence: How confident you are in the sentiment assessment
       - Scores: Break down positive, negative, and neutral percentages (should sum to 100)

    2. Quality Analysis (0-100 scale):
       - Clarity: How clear and understandable is the comment
       - Relevance: How relevant is it to the debate topic
       - Constructiveness: How constructive is the contribution
       - Evidence_quality: Quality of evidence or reasoning provided
       - Respectfulness: How respectful is the tone and language

    3. Overall Scores (0-100 scale):
       - Overall_score: Average quality score
       - Contribution_quality: How much value does this add to the discussion
       - Debate_value: How valuable is this for the debate

    4. Insights:
       - Key_points: Main arguments or points made (2-4 points)
       - Strengths: What the comment does well (2-3 items)
       - Areas_for_improvement: Constructive suggestions (1-3 items)
       - Debate_impact: Assessment of impact on the debate (1 sentence)

    5. Classification:
       - Type: What kind of contribution is this
       - Stance: Position relative to the debate topic
       - Tone: Communication style used

    Return only valid JSON without any additional text or formatting.
    `

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Clean up the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const analysis = JSON.parse(cleanedText) as CommentAnalysis
      
      // Validate and ensure all required fields are present
      if (!analysis.sentiment || !analysis.analysis || !analysis.scores) {
        throw new Error('Invalid analysis structure')
      }

      return NextResponse.json({
        success: true,
        analysis
      })
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      console.error('Raw response:', text)
      
      // Return a fallback analysis if parsing fails
      const fallbackAnalysis: CommentAnalysis = {
        sentiment: {
          overall: 'neutral',
          confidence: 50,
          positive_score: 40,
          negative_score: 20,
          neutral_score: 40
        },
        analysis: {
          clarity: 70,
          relevance: 75,
          constructiveness: 70,
          evidence_quality: 60,
          respectfulness: 80
        },
        scores: {
          overall_score: 71,
          contribution_quality: 70,
          debate_value: 72
        },
        insights: {
          key_points: ['User perspective shared'],
          strengths: ['Participates in discussion'],
          areas_for_improvement: ['Could provide more detail'],
          debate_impact: 'Moderate - adds to the conversation'
        },
        classification: {
          type: 'opinion',
          stance: 'neutral',
          tone: 'conversational'
        }
      }

      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        note: 'Used fallback analysis due to parsing error'
      })
    }
  } catch (error) {
    console.error('Error analyzing comment:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}