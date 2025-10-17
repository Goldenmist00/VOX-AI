import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectDB from '@/lib/mongodb'
import Keyword from '@/models/Keyword'
import RedditPost from '@/models/RedditPost'
import RedditComment from '@/models/RedditComment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function GET(req: NextRequest) {
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

    // Get RSS statistics (RSS only now)
    const rssKeywords = await Keyword.find({ 
      isActive: true 
    })
    
    const activeRssKeywords = rssKeywords.filter(k => k.autoFetch)
    
    // Get recent RSS activity
    const recentRssActivity = await Keyword.findOne({
      lastFetched: { $exists: true }
    }).sort({ lastFetched: -1 })

    // Get Reddit posts and comments counts
    const [totalPosts, totalComments] = await Promise.all([
      RedditPost.countDocuments({ isActive: true }),
      RedditComment.countDocuments({ isActive: true })
    ])

    // Get sentiment distribution
    const [postSentiment, commentSentiment] = await Promise.all([
      RedditPost.aggregate([
        { $match: { isActive: true, processed: true } },
        {
          $group: {
            _id: '$analysis.sentiment.classification',
            count: { $sum: 1 }
          }
        }
      ]),
      RedditComment.aggregate([
        { $match: { isActive: true, processed: true } },
        {
          $group: {
            _id: '$analysis.sentiment.classification',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Combine sentiment data
    const sentimentMap = { positive: 0, negative: 0, neutral: 0 }
    
    ;[...postSentiment, ...commentSentiment].forEach(item => {
      if (item._id && sentimentMap.hasOwnProperty(item._id)) {
        sentimentMap[item._id as keyof typeof sentimentMap] += item.count
      }
    })

    // Get top keywords by volume
    const topKeywords = await Keyword.aggregate([
      { $match: { isActive: true, volume: { $gt: 0 } } },
      { $sort: { volume: -1 } },
      { $limit: 5 },
      {
        $project: {
          keyword: 1,
          volume: 1,
          dataSources: 1
        }
      }
    ])

    // Calculate average processing times
    const avgRssTime = 8500 // This would come from actual metrics

    const stats = {
      rss: {
        status: activeRssKeywords.length > 0 ? 'active' : 'inactive',
        totalKeywords: rssKeywords.length,
        activeKeywords: activeRssKeywords.length,
        lastFetch: recentRssActivity?.lastFetched?.toISOString() || new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        totalPosts,
        totalComments,
        avgProcessingTime: avgRssTime
      },
      combined: {
        totalItems: totalPosts + totalComments,
        sentimentDistribution: sentimentMap,
        topKeywords: topKeywords.map(k => ({
          keyword: k.keyword,
          volume: k.volume,
          sources: ['rss']
        }))
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Integration status API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

