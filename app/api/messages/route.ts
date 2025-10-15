import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import Debate from '@/models/Debate'
import { geminiService } from '@/lib/gemini'
import { vaderService } from '@/lib/vader-sentiment'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const debateId = searchParams.get('debateId')
    
    if (!debateId) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      )
    }
    
    const messages = await Message.find({ debateId })
      .sort({ createdAt: 1 })
      .lean()
    
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { debateId, author, authorType, message } = await request.json()
    
    if (!debateId || !author || !authorType || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }
    
    // Get debate context for Gemini analysis
    const debate = await Debate.findById(debateId)
    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }
    
    // Analyze message with both VADER and Gemini
    const startTime = Date.now()
    let analysis
    let geminiResponse
    let vaderAnalysis
    
    // First, run VADER sentiment analysis (fast and reliable)
    try {
      vaderAnalysis = vaderService.analyzeComment(message, {
        title: debate.title,
        description: debate.description,
        tags: debate.tags
      })
    } catch (vaderError) {
      console.error('VADER analysis failed:', vaderError)
      vaderAnalysis = {
        sentiment_label: 'Neutral' as const,
        compound_score: 0,
        confidence: 30,
        keywords: [],
        processed_text: message
      }
    }
    
    // Then try Gemini analysis (more comprehensive but can fail)
    try {
      analysis = await geminiService.analyzeMessage(message, {
        title: debate.title,
        description: debate.description,
        tags: debate.tags
      })
      
      geminiResponse = {
        rawResponse: JSON.stringify(analysis),
        processingTime: Date.now() - startTime,
        modelUsed: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      }
      
      // Combine VADER and Gemini insights
      // Use VADER sentiment if it's more confident or if Gemini failed to detect sentiment properly
      if (vaderAnalysis.confidence > analysis.confidence || 
          (analysis.sentiment === 'neutral' && vaderAnalysis.sentiment_label !== 'Neutral')) {
        analysis.sentiment = vaderAnalysis.sentiment_label.toLowerCase() as 'positive' | 'negative' | 'neutral'
        analysis.confidence = Math.max(analysis.confidence, vaderAnalysis.confidence)
      }
      
      // Merge keywords
      const combinedKeywords = [...new Set([...(analysis.keywords || []), ...vaderAnalysis.keywords])]
      analysis.keywords = combinedKeywords.slice(0, 10) // Limit to 10 keywords
      
    } catch (geminiError) {
      console.error('Gemini analysis failed:', geminiError)
      // Use VADER analysis as primary fallback
      analysis = {
        sentiment: vaderAnalysis.sentiment_label.toLowerCase() as 'positive' | 'negative' | 'neutral',
        relevancyScore: vaderService.compoundToAIScore(vaderAnalysis.compound_score),
        keywords: vaderAnalysis.keywords,
        contextMatch: vaderAnalysis.keywords.length > 0,
        confidence: vaderAnalysis.confidence
      }
    }
    
    // Create new message
    const newMessage = new Message({
      debateId,
      author: author.trim(),
      authorType,
      message: message.trim(),
      sentiment: {
        sentiment_label: analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1) as 'Positive' | 'Negative' | 'Neutral',
        compound_score: vaderAnalysis?.compound_score || 0,
        confidence: analysis.confidence || 50,
        processed_text: vaderAnalysis?.processed_text || message
      },
      aiScore: analysis.relevancyScore,
      keywords: analysis.keywords || [],
      contextMatch: analysis.contextMatch,
      geminiAnalysis: !!geminiResponse,
      confidence: analysis.confidence || 50,
      votes: { agree: 0, disagree: 0, neutral: 0 },
      geminiResponse,
      vaderAnalysis: vaderAnalysis
    })
    
    const savedMessage = await newMessage.save()
    
    // Update debate statistics
    await updateDebateStats(debateId, analysis)
    
    return NextResponse.json(savedMessage, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

async function updateDebateStats(debateId: string, analysis: any) {
  try {
    const debate = await Debate.findById(debateId)
    if (!debate) return
    
    // Increment message count
    debate.messageCount += 1
    
    // Update participants (rough estimate)
    debate.participants = Math.max(debate.participants, debate.messageCount)
    
    // Recalculate sentiment based on recent messages
    const recentMessages = await Message.find({ debateId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
    
    if (recentMessages.length > 0) {
      const sentimentCounts = recentMessages.reduce((acc, msg) => {
        acc[msg.sentiment] = (acc[msg.sentiment] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const total = recentMessages.length
      debate.sentiment = {
        positive: Math.round(((sentimentCounts.positive || 0) / total) * 100),
        negative: Math.round(((sentimentCounts.negative || 0) / total) * 100),
        neutral: Math.round(((sentimentCounts.neutral || 0) / total) * 100)
      }
      
      // Update AI score (average of recent messages)
      const avgScore = recentMessages.reduce((sum, msg) => sum + msg.aiScore, 0) / total
      debate.aiScore = Math.round(avgScore)
    }
    
    // Update activity level
    if (debate.messageCount > 50) {
      debate.activity = 'high'
    } else if (debate.messageCount > 15) {
      debate.activity = 'medium'
    }
    
    // Update trending status
    const totalVotes = debate.votes.agree + debate.votes.disagree + debate.votes.neutral
    if (debate.messageCount > 10 && totalVotes > 20) {
      debate.trending = true
    }
    
    await debate.save()
  } catch (error) {
    console.error('Error updating debate stats:', error)
  }
}