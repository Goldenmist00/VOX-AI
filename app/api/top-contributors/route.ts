import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Message from '@/models/Message'
import RedditComment from '@/models/RedditComment'
import RedditPost from '@/models/RedditPost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get message engagement data for each user
    const messageEngagement = await Message.aggregate([
      {
        $match: {
          isActive: { $ne: false }
        }
      },
      {
        $group: {
          _id: '$author',
          totalLikes: { $sum: '$engagement.likes' },
          messageCount: { $sum: 1 },
          avgLikesPerMessage: { $avg: '$engagement.likes' },
          maxLikesOnSingleMessage: { $max: '$engagement.likes' },
          totalEngagement: { 
            $sum: { 
              $add: [
                '$engagement.likes', 
                '$engagement.replies', 
                '$engagement.shares'
              ] 
            } 
          }
        }
      }
    ])

    // Create a map for quick lookup
    const engagementMap = new Map()
    messageEngagement.forEach(item => {
      engagementMap.set(item._id.toString(), item)
    })

    // Get top contributors based on various metrics including message engagement
    const topContributors = await User.aggregate([
      {
        $match: {
          isActive: { $ne: false },
          // Only include users who have some activity
          $or: [
            { 'stats.messagesPosted': { $gt: 0 } },
            { 'stats.debatesJoined': { $gt: 0 } },
            { 'stats.uploadsShared': { $gt: 0 } }
          ]
        }
      },
      {
        $addFields: {
          // Calculate overall contribution score
          contributionScore: {
            $add: [
              { $multiply: ['$stats.messagesPosted', 2] }, // Messages worth 2 points
              { $multiply: ['$stats.debatesJoined', 5] }, // Debates worth 5 points
              { $multiply: ['$stats.uploadsShared', 10] }, // Uploads worth 10 points
              { $multiply: ['$stats.likesReceived', 2] }, // Likes worth 2 points (increased)
              { $multiply: ['$level', 3] } // Level worth 3 points
            ]
          },
          // Calculate engagement score (0-100)
          engagementScore: {
            $min: [
              100,
              {
                $add: [
                  { $multiply: ['$stats.messagesPosted', 2] },
                  { $multiply: ['$stats.likesReceived', 3] }, // Higher weight for likes
                  { $multiply: ['$stats.streak', 5] }
                ]
              }
            ]
          },
          // Calculate clarity score based on influence and trust
          clarityScore: {
            $min: [
              100,
              {
                $add: [
                  { $divide: ['$influenceScore', 2] },
                  { $divide: ['$trustScore', 2] }
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { contributionScore: -1, level: -1, totalXpEarned: -1 }
      },
      {
        $limit: limit * 2 // Get more users to account for engagement boost
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          level: 1,
          totalXpEarned: 1,
          influenceScore: 1,
          trustScore: 1,
          stats: 1,
          contributionScore: 1,
          engagementScore: 1,
          clarityScore: 1,
          createdAt: 1
        }
      }
    ])

    // Get top Reddit contributors from comments and posts
    const redditContributors = await RedditComment.aggregate([
      {
        $match: {
          isActive: { $ne: false },
          processed: true,
          author: { 
            $nin: [
              'unknown', 
              '[deleted]', 
              '[removed]', 
              'deleted', 
              'removed',
              'u/deleted',
              'u/[deleted]',
              'AutoModerator',
              'automoderator'
            ]
          },
          author: { $exists: true },
          author: { $ne: null },
          author: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$author',
          totalComments: { $sum: 1 },
          totalRedditScore: { $sum: '$redditScore' },
          avgRedditScore: { $avg: '$redditScore' },
          maxRedditScore: { $max: '$redditScore' },
          avgQualityScore: { $avg: '$analysis.quality.overall_quality' },
          avgSentimentScore: { $avg: '$analysis.sentiment.confidence' },
          subreddits: { $addToSet: '$subreddit' },
          keywords: { $addToSet: '$keyword' },
          recentActivity: { $max: '$createdAt' }
        }
      },
      {
        $match: {
          totalComments: { $gte: 2 }, // At least 2 comments to be considered
          totalRedditScore: { $gte: 5 } // At least 5 total Reddit score
        }
      },
      {
        $addFields: {
          // Calculate Reddit contribution score
          redditContributionScore: {
            $add: [
              { $multiply: ['$totalComments', 3] }, // Comments worth 3 points
              { $multiply: ['$totalRedditScore', 1] }, // Reddit score worth 1 point each
              { $multiply: ['$avgQualityScore', 2] }, // Quality bonus
              { $multiply: [{ $size: '$subreddits' }, 5] } // Diversity bonus (5 points per subreddit)
            ]
          },
          subredditCount: { $size: '$subreddits' },
          keywordCount: { $size: '$keywords' }
        }
      },
      {
        $sort: { redditContributionScore: -1, totalRedditScore: -1 }
      },
      {
        $limit: Math.ceil(limit / 2) // Get half the limit for Reddit contributors
      }
    ])

    // Format Reddit contributors
    const formattedRedditContributors = redditContributors.map((contributor) => {
      const username = contributor._id
      const initials = username.length >= 2 ? username.substring(0, 2).toUpperCase() : username.toUpperCase()
      
      return {
        id: `reddit_${contributor._id}`,
        username: `u/${username}`,
        avatar: initials,
        role: 'reddit',
        level: Math.min(10, Math.floor(contributor.totalComments / 5) + 1), // Estimated level based on activity
        aiScore: Math.min(100, Math.max(0, Math.round(contributor.redditContributionScore / 5))),
        clarity: Math.min(100, Math.max(0, Math.round(contributor.avgQualityScore || 50))),
        engagement: Math.min(100, Math.max(0, Math.round((contributor.totalRedditScore / contributor.totalComments) * 10))),
        totalXp: Math.round(contributor.redditContributionScore || 0),
        stats: {
          messages: contributor.totalComments,
          debates: contributor.subredditCount,
          uploads: 0,
          likes: contributor.totalRedditScore,
          streak: 0
        },
        redditEngagement: {
          totalComments: contributor.totalComments,
          totalRedditScore: contributor.totalRedditScore,
          avgRedditScore: Math.round(contributor.avgRedditScore * 10) / 10,
          maxRedditScore: contributor.maxRedditScore,
          subredditCount: contributor.subredditCount,
          keywordCount: contributor.keywordCount,
          recentActivity: contributor.recentActivity
        },
        enhancedScore: contributor.redditContributionScore,
        joinedDate: contributor.recentActivity,
        isRedditUser: true
      }
    })

    // Format the data for the frontend with enhanced engagement metrics
    const formattedRegisteredUsers = topContributors.map((user) => {
      const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'U'}`
      const userId = user._id.toString()
      const messageData = engagementMap.get(userId) || {
        totalLikes: 0,
        messageCount: 0,
        avgLikesPerMessage: 0,
        maxLikesOnSingleMessage: 0,
        totalEngagement: 0
      }

      // Calculate enhanced scores including message engagement
      const messageEngagementBonus = Math.min(50, messageData.totalLikes * 2) // Up to 50 bonus points
      const qualityBonus = messageData.messageCount > 0 ? Math.min(30, messageData.avgLikesPerMessage * 10) : 0
      const viralContentBonus = Math.min(20, messageData.maxLikesOnSingleMessage * 2) // Bonus for viral content

      const enhancedContributionScore = user.contributionScore + messageEngagementBonus + qualityBonus + viralContentBonus
      const enhancedEngagementScore = Math.min(100, user.engagementScore + (messageData.totalLikes * 2))
      
      return {
        id: userId,
        username: `${user.firstName || 'User'} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
        avatar: initials,
        role: user.role,
        level: user.level,
        aiScore: Math.min(100, Math.max(0, Math.round(enhancedContributionScore / 15))), // Enhanced scoring
        clarity: Math.min(100, Math.max(0, Math.round(user.clarityScore || 50))),
        engagement: Math.min(100, Math.max(0, Math.round(enhancedEngagementScore))),
        totalXp: Math.round(user.totalXpEarned || 0),
        stats: {
          messages: user.stats?.messagesPosted || 0,
          debates: user.stats?.debatesJoined || 0,
          uploads: user.stats?.uploadsShared || 0,
          likes: user.stats?.likesReceived || 0,
          streak: user.stats?.streak || 0
        },
        messageEngagement: {
          totalLikes: messageData.totalLikes,
          avgLikesPerMessage: Math.round(messageData.avgLikesPerMessage * 10) / 10,
          maxLikesOnSingleMessage: messageData.maxLikesOnSingleMessage,
          totalEngagement: messageData.totalEngagement
        },
        enhancedScore: enhancedContributionScore, // For sorting
        joinedDate: user.createdAt,
        isRedditUser: false
      }
    })

    // Combine registered users and Reddit contributors
    const allContributors = [...formattedRegisteredUsers, ...formattedRedditContributors]
      .sort((a, b) => b.enhancedScore - a.enhancedScore) // Sort by enhanced score
      .slice(0, limit) // Apply final limit

    return NextResponse.json({
      success: true,
      contributors: allContributors,
      total: allContributors.length,
      registeredUsers: formattedRegisteredUsers.length,
      redditUsers: formattedRedditContributors.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Top contributors API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}