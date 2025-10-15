import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Debate from '@/models/Debate'

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
    
    const debate = await Debate.findById(params.id)
    
    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }
    
    // Increment the vote count
    debate.votes[voteType as keyof typeof debate.votes] += 1
    
    // Update activity level based on total votes
    const totalVotes = debate.votes.agree + debate.votes.disagree + debate.votes.neutral
    if (totalVotes > 100) {
      debate.activity = 'high'
    } else if (totalVotes > 30) {
      debate.activity = 'medium'
    }
    
    // Update trending status
    if (totalVotes > 50 && debate.messageCount > 10) {
      debate.trending = true
    }
    
    await debate.save()
    
    return NextResponse.json(debate)
  } catch (error) {
    console.error('Error voting on debate:', error)
    return NextResponse.json(
      { error: 'Failed to vote on debate' },
      { status: 500 }
    )
  }
}