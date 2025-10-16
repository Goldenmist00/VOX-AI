import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Debate from '@/models/Debate'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

// GET - Fetch all debates
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = parseInt(searchParams.get('skip') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const sortOptions: any = {}
    sortOptions[sortBy] = order === 'desc' ? -1 : 1

    const debates = await Debate.find({ isActive: true })
      .populate('createdBy', 'firstName lastName email role')
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .lean()

    const total = await Debate.countDocuments({ isActive: true })

    // Transform debates to include id field for frontend compatibility
    const transformedDebates = debates.map((debate: any) => ({
      ...debate,
      id: debate._id.toString()
    }))

    return NextResponse.json({
      debates: transformedDebates,
      total,
      hasMore: skip + limit < total
    })

  } catch (error) {
    console.error('Error fetching debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}

// POST - Create a new debate
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
    const userId = (payload as any).userId

    const { title, description, tags } = await req.json()

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title cannot exceed 200 characters' },
        { status: 400 }
      )
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: 'Description cannot exceed 1000 characters' },
        { status: 400 }
      )
    }

    // Process tags
    const processedTags = tags 
      ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
      : []

    if (processedTags.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 tags allowed' },
        { status: 400 }
      )
    }

    // Create new debate
    const debate = new Debate({
      title: title.trim(),
      description: description.trim(),
      tags: processedTags,
      createdBy: userId,
      participants: 0,
      messages: 0,
      sentiment: { positive: 0, negative: 0, neutral: 100 },
      activity: 'low',
      aiScore: 0,
      trending: false,
      isActive: true
    })

    await debate.save()

    // Populate the createdBy field for response
    await debate.populate('createdBy', 'firstName lastName email role')

    // Transform debate to include id field for frontend compatibility
    const transformedDebate = {
      ...debate.toObject(),
      id: debate._id.toString()
    }

    return NextResponse.json({
      message: 'Debate created successfully',
      debate: transformedDebate
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating debate:', error)
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    )
  }
}
