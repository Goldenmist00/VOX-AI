import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { voteType } = await request.json()
    
    if (!['agree', 'disagree', 'neutral'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      )
    }
    
    const message = await Message.findById(params.id)
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }
    
    // Increment the vote count
    message.votes[voteType as keyof typeof message.votes] += 1
    
    // Recalculate AI score based on community feedback
    const totalVotes = message.votes.agree + message.votes.disagree + message.votes.neutral
    const agreementRatio = totalVotes > 0 ? message.votes.agree / totalVotes : 0
    const engagementBonus = Math.min(20, totalVotes * 2) // Up to 20 points for engagement
    
    // Adjust AI score based on community feedback
    let adjustedScore = message.aiScore
    if (agreementRatio > 0.7) adjustedScore += 5 // High agreement boosts score
    if (agreementRatio < 0.3) adjustedScore -= 5 // Low agreement reduces score
    adjustedScore += engagementBonus
    
    message.aiScore = Math.min(100, Math.max(10, Math.round(adjustedScore)))
    
    await message.save()
    
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error voting on message:', error)
    return NextResponse.json(
      { error: 'Failed to vote on message' },
      { status: 500 }
    )
  }
}