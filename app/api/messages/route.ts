import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import Debate from '@/models/Debate'
import { jwtVerify } from 'jose'
import { GoogleGenerativeAI } from '@google/generative-ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// GET - Fetch messages for a specific debate
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const debateId = searchParams.get('debateId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    if (!debateId || debateId === 'undefined' || debateId === 'null') {
      return NextResponse.json(
        { error: 'Valid debate ID is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(debateId)) {
      return NextResponse.json(
        { error: 'Invalid debate ID format' },
        { status: 400 }
      )
    }

    const messages = await Message.find({ 
      debateId, 
      isActive: true 
    })
      .populate('author', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const total = await Message.countDocuments({ 
      debateId, 
      isActive: true 
    })

    return NextResponse.json({
      messages,
      total,
      hasMore: skip + limit < total
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Create a new message
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    let userId = (payload as any).userId
    
    // Convert ObjectId buffer to string if needed
    if (typeof userId !== 'string') {
      if (userId && typeof userId === 'object' && userId.buffer) {
        // Convert buffer to hex string
        const buffer = Buffer.from(Object.values(userId.buffer))
        userId = buffer.toString('hex')
      } else {
        userId = String(userId)
      }
    }
    
    // Validate userId format
    if (!userId || userId === '[object Object]' || userId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 401 }
      )
    }

    const { content, debateId, debateTopic } = await req.json()

    // Validation
    if (!content || !debateId || debateId === 'undefined' || debateId === 'null') {
      return NextResponse.json(
        { error: 'Content and valid debate ID are required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(debateId)) {
      return NextResponse.json(
        { error: 'Invalid debate ID format' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message cannot exceed 2000 characters' },
        { status: 400 }
      )
    }

    // Verify debate exists
    const debate = await Debate.findById(debateId)
    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Analyze the message using Gemini AI
    let analysis
    try {
      if (process.env.GEMINI_API_KEY) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `
        Analyze the following comment in the context of a debate about "${debateTopic || debate.title}". Provide a comprehensive analysis in JSON format.

        Comment: "${content}"

        Expected JSON format:
        {
          "sentiment": {
            "overall": "positive|negative|neutral",
            "confidence": "number (0-100)",
            "positive_score": "number (0-100)",
            "negative_score": "number (0-100)",
            "neutral_score": "number (0-100)"
          },
          "analysis": {
            "clarity": "number (0-100)",
            "relevance": "number (0-100)",
            "constructiveness": "number (0-100)",
            "evidence_quality": "number (0-100)",
            "respectfulness": "number (0-100)"
          },
          "scores": {
            "overall_score": "number (0-100)",
            "contribution_quality": "number (0-100)",
            "debate_value": "number (0-100)"
          },
          "insights": {
            "key_points": ["string"],
            "strengths": ["string"],
            "areas_for_improvement": ["string"],
            "debate_impact": "string"
          },
          "classification": {
            "type": "argument|question|agreement|disagreement|fact|opinion|solution|concern",
            "stance": "supporting|opposing|neutral|mixed",
            "tone": "professional|passionate|analytical|emotional|diplomatic"
          }
        }

        Return only valid JSON without any additional text or formatting.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Parse the JSON response
        try {
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch && jsonMatch[1]) {
            analysis = JSON.parse(jsonMatch[1])
          } else {
            analysis = JSON.parse(text)
          }
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError)
          throw new Error('Failed to parse analysis results')
        }
      } else {
        // Default analysis if Gemini is not available
        analysis = {
          sentiment: {
            overall: "neutral",
            confidence: 0,
            positive_score: 0,
            negative_score: 0,
            neutral_score: 100
          },
          analysis: {
            clarity: 50,
            relevance: 50,
            constructiveness: 50,
            evidence_quality: 50,
            respectfulness: 50
          },
          scores: {
            overall_score: 50,
            contribution_quality: 50,
            debate_value: 50
          },
          insights: {
            key_points: [],
            strengths: [],
            areas_for_improvement: [],
            debate_impact: "Analysis unavailable"
          },
          classification: {
            type: "opinion",
            stance: "neutral",
            tone: "neutral"
          }
        }
      }
    } catch (analysisError) {
      console.error('Error analyzing message:', analysisError)
      // Use default analysis if AI analysis fails
      analysis = {
        sentiment: {
          overall: "neutral",
          confidence: 0,
          positive_score: 0,
          negative_score: 0,
          neutral_score: 100
        },
        analysis: {
          clarity: 50,
          relevance: 50,
          constructiveness: 50,
          evidence_quality: 50,
          respectfulness: 50
        },
        scores: {
          overall_score: 50,
          contribution_quality: 50,
          debate_value: 50
        },
        insights: {
          key_points: [],
          strengths: [],
          areas_for_improvement: [],
          debate_impact: "Analysis failed"
        },
        classification: {
          type: "opinion",
          stance: "neutral",
          tone: "neutral"
        }
      }
    }

    // Create new message
    const message = new Message({
      content: content.trim(),
      author: userId,
      debateId,
      analysis
    })

    await message.save()

    // Update debate message count
    await Debate.findByIdAndUpdate(debateId, {
      $inc: { messages: 1 }
    })

    // Populate the author field for response
    await message.populate('author', 'firstName lastName email role')

    return NextResponse.json({
      message: 'Message created successfully',
      data: message
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
