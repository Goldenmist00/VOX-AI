import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectDB from '@/lib/mongodb'
import RedditComment from '@/models/RedditComment'
import UserComment from '@/models/UserComment'
import RedditPost from '@/models/RedditPost'
import { geminiService } from '@/lib/gemini'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

// GET /api/reddit/posts/[id]/comments - Fetch comments for a specific post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const postId = params.id
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Fetch Reddit comments (use postId field which should match Reddit post ID)
    const redditComments = await RedditComment.find({
      postId: postId,
      isActive: true
    })
    .sort({ redditScore: -1, createdAt: -1 })
    .limit(Math.ceil(limit / 2))
    .lean()

    // Fetch user comments
    const userComments = await UserComment.find({
      postId: postId,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(Math.floor(limit / 2))
    .lean()

    // Combine and format comments
    const allComments = [
      ...redditComments.map(comment => ({
        ...comment,
        type: 'reddit',
        id: comment._id,
        score: comment.redditScore || 0
      })),
      ...userComments.map(comment => ({
        ...comment,
        type: 'user',
        id: comment._id,
        author: comment.authorName,
        score: 0 // User comments don't have Reddit scores
      }))
    ].sort((a, b) => {
      // Sort by score first (Reddit comments), then by date
      if (a.score !== b.score) {
        return b.score - a.score
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      success: true,
      data: {
        comments: allComments.slice(0, limit),
        pagination: {
          currentPage: page,
          totalCount: allComments.length,
          hasNextPage: skip + limit < allComments.length,
          limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching post comments:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch comments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/reddit/posts/[id]/comments - Add a new user comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload as any
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    await connectDB()
    
    const postId = params.id
    const { content } = await req.json()

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment cannot exceed 2000 characters' },
        { status: 400 }
      )
    }

    // Get post context for better analysis
    let postContext
    try {
      // Only search by redditId since postId from URL is Reddit ID, not MongoDB ObjectId
      const post = await RedditPost.findOne({ 
        redditId: postId
      }).lean()
      
      if (post) {
        postContext = {
          title: post.title,
          subreddit: post.subreddit,
          keyword: post.keyword
        }
      }
    } catch (error) {
      console.warn('Could not fetch post context:', error)
    }

    // Analyze comment with centralized Gemini service
    let analysis
    try {
      analysis = await geminiService.analyzeRedditComment(content.trim(), postContext)
    } catch (error) {
      console.warn('Comment analysis failed, using fallback:', error)
      // The geminiService already has fallback logic, but add extra safety
      analysis = {
        sentiment: {
          classification: 'neutral' as const,
          confidence: 50,
          positive_score: 33,
          negative_score: 33,
          neutral_score: 34
        },
        quality: {
          clarity: 50,
          coherence: 50,
          informativeness: 50,
          overall_quality: 50
        },
        relevancy: {
          score: 50,
          reasoning: 'Analysis unavailable'
        },
        insights: {
          key_points: [],
          stance: 'neutral' as const,
          tone: 'casual' as const
        }
      }
    }

    // Create new user comment
    const userComment = new UserComment({
      postId: postId,
      authorId: user.id || user.email,
      authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      authorEmail: user.email,
      content: content.trim(),
      analysis: analysis,
      isActive: true,
      processed: true
    })

    await userComment.save()

    // Return the created comment
    return NextResponse.json({
      success: true,
      data: {
        comment: {
          ...userComment.toObject(),
          type: 'user',
          id: userComment._id,
          author: userComment.authorName,
          score: 0
        }
      },
      message: 'Comment added successfully'
    })

  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to add comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

