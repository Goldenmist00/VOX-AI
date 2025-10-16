import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import RedditRSSIntegration from '@/lib/reddit-rss-integration'
import connectDB from '@/lib/mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function POST(req: NextRequest) {
  try {
    // Temporarily skip authentication for testing
    console.log('Reddit RSS POST - Skipping authentication for testing')
    const user = { email: 'test@example.com' }

    // Parse request body
    const body = await req.json()
    const { 
      keyword, 
      subreddits, 
      maxPosts,
      includeComments,
      maxCommentsPerPost,
      forceRefresh 
    } = body

    // Validation
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keyword is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (keyword.length > 100) {
      return NextResponse.json(
        { error: 'Keyword cannot exceed 100 characters' },
        { status: 400 }
      )
    }

    // Validate subreddits if provided
    if (subreddits && (!Array.isArray(subreddits) || subreddits.some(s => typeof s !== 'string'))) {
      return NextResponse.json(
        { error: 'Subreddits must be an array of strings' },
        { status: 400 }
      )
    }

    // Validate numeric parameters
    if (maxPosts && (typeof maxPosts !== 'number' || maxPosts < 1 || maxPosts > 100)) {
      return NextResponse.json(
        { error: 'maxPosts must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (maxCommentsPerPost && (typeof maxCommentsPerPost !== 'number' || maxCommentsPerPost < 1 || maxCommentsPerPost > 50)) {
      return NextResponse.json(
        { error: 'maxCommentsPerPost must be between 1 and 50' },
        { status: 400 }
      )
    }

    console.log(`Reddit RSS fetch request from user ${user.email}: keyword="${keyword}"`)

    // Initialize Reddit RSS integration
    const rssIntegration = new RedditRSSIntegration()

    console.log('Starting Reddit RSS data fetch...')

    // Fetch and process Reddit data
    const result = await rssIntegration.fetchRedditRSSData({
      keyword: keyword.trim(),
      subreddits: subreddits?.filter((s: string) => s.trim().length > 0),
      maxPosts: maxPosts || 20,
      includeComments: includeComments !== false,
      maxCommentsPerPost: maxCommentsPerPost || 10,
      forceRefresh: forceRefresh || false
    })

    console.log(`Reddit RSS fetch completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)

    // Return result
    return NextResponse.json({
      success: result.success,
      data: {
        keyword: result.keyword,
        totalPosts: result.totalPosts,
        totalComments: result.totalComments,
        totalStored: result.totalStored,
        processingTime: result.processingTime,
        statistics: result.statistics,
        errors: result.errors
      },
      message: result.success 
        ? `Successfully processed ${result.totalStored} Reddit items for "${result.keyword}"` 
        : `Failed to process Reddit data for "${result.keyword}"`
    })

  } catch (error) {
    console.error('Reddit RSS API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Temporarily skip authentication for testing
    console.log('Reddit RSS GET - Skipping authentication for testing')
    const user = { email: 'test@example.com' }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const keyword = searchParams.get('keyword')
    const type = searchParams.get('type') as 'posts' | 'comments' | 'both' || 'both'
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') as 'weightedScore' | 'createdAt' | 'redditScore' || 'weightedScore'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
    const sentiment = searchParams.get('sentiment') as 'positive' | 'negative' | 'neutral' | null
    const subreddit = searchParams.get('subreddit')
    const page = parseInt(searchParams.get('page') || '1')

    const rssIntegration = new RedditRSSIntegration()

    switch (action) {
      case 'trending':
        const trending = await rssIntegration.getTrendingKeywords(limit)
        return NextResponse.json({
          success: true,
          data: trending
        })

      case 'data':
        // Allow empty keyword for loading all posts
        const searchKeyword = keyword && keyword.trim() !== '' ? keyword : null
        
        const data = await rssIntegration.getRedditData(searchKeyword, {
          type,
          limit: Math.min(limit, 100),
          sortBy,
          sortOrder,
          sentiment: sentiment || undefined,
          subreddit: subreddit || undefined,
          page
        })
        
        return NextResponse.json(data)

      case 'statistics':
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword parameter is required for statistics' },
            { status: 400 }
          )
        }
        
        const stats = await rssIntegration.getRedditStatistics(keyword)
        return NextResponse.json({
          success: true,
          data: stats
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: trending, data, statistics' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Reddit RSS GET API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}