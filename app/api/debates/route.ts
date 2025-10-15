import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Debate from '@/models/Debate'
import Message from '@/models/Message'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'trending'
    const search = searchParams.get('search') || ''
    
    let query: any = {}
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Add filter functionality
    let sortQuery: any = { createdAt: -1 }
    
    switch (filter) {
      case 'trending':
        query.trending = true
        sortQuery = { updatedAt: -1 }
        break
      case 'latest':
        sortQuery = { createdAt: -1 }
        break
      case 'active':
        query.activity = 'high'
        sortQuery = { messageCount: -1, updatedAt: -1 }
        break
    }
    
    const debates = await Debate.find(query)
      .sort(sortQuery)
      .limit(20)
      .lean()
    
    return NextResponse.json(debates)
  } catch (error) {
    console.error('Error fetching debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { title, description, tags, author, authorType } = await request.json()
    
    if (!title || !description || !author || !authorType) {
      return NextResponse.json(
        { error: 'Title, description, author, and authorType are required' },
        { status: 400 }
      )
    }
    
    const debate = new Debate({
      title: title.trim(),
      description: description.trim(),
      tags: tags || [],
      author: author.trim(),
      authorType,
      participants: 1,
      sentiment: { positive: 50, negative: 25, neutral: 25 },
      activity: 'low',
      aiScore: 75,
      messageCount: 0,
      trending: false,
      votes: { agree: 0, disagree: 0, neutral: 0 }
    })
    
    const savedDebate = await debate.save()
    
    return NextResponse.json(savedDebate, { status: 201 })
  } catch (error) {
    console.error('Error creating debate:', error)
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    )
  }
}