import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Message from '@/models/Message'
import Debate from '@/models/Debate'
import Upload from '@/models/Upload'
import GamificationService from '@/lib/gamification-service'

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

    // Get or create user profile
    let userProfile = await User.findOne({ email: user.email })
    
    if (!userProfile) {
      // Create new user profile if it doesn't exist
      userProfile = new User({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: 'migrated', // Placeholder for migrated users
        role: user.role || 'citizen'
      })
      await userProfile.save()
    }

    // Get user's activity statistics from all sources
    const [
      totalMessages,
      totalDebatesJoined,
      totalUploads,
      totalLikesReceived,
      recentActivity,
      recentUploads
    ] = await Promise.all([
      // Count user's messages
      Message.countDocuments({ author: userProfile._id }),
      
      // Count debates user participated in
      Debate.countDocuments({
        $or: [
          { contributors: userProfile._id }
        ]
      }),
      
      // Count user's uploads
      Upload.countDocuments({ author: userProfile._id, isActive: true }),
      
      // Count total likes received on messages
      Message.aggregate([
        { $match: { author: userProfile._id } },
        { $group: { _id: null, totalLikes: { $sum: '$engagement.likes' } } }
      ]),
      
      // Get recent activity from messages
      Message.find({ author: userProfile._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('debateId', 'title'),
        
      // Get recent uploads
      Upload.find({ author: userProfile._id, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
    ])

    // Update user stats with real data
    const likesReceived = totalLikesReceived[0]?.totalLikes || 0
    
    userProfile.stats.messagesPosted = totalMessages
    userProfile.stats.debatesJoined = totalDebatesJoined
    userProfile.stats.uploadsShared = totalUploads
    userProfile.stats.likesReceived = likesReceived
    
    // Handle daily login to update streak
    await GamificationService.handleDailyLogin(userProfile._id.toString())
    
    // Refresh user data after daily login processing - refetch from database
    const refreshedProfile = await User.findById(userProfile._id)
    if (refreshedProfile) {
      userProfile = refreshedProfile
    }
    
    // Recalculate level and influence
    userProfile.level = (userProfile as any).calculateLevel()
    userProfile.influenceScore = (userProfile as any).calculateInfluenceScore()
    await userProfile.save()

    // Get current level progress using the new progressive system
    const levelProgress = (userProfile as any).getCurrentLevelProgress()
    const { currentLevel, xpInCurrentLevel, xpRequiredForNext, xpToNextLevel } = levelProgress

    // Determine rank based on level and influence
    let rank = 'Newcomer'
    if (userProfile.level >= 20) rank = 'Legend'
    else if (userProfile.level >= 15) rank = 'Master'
    else if (userProfile.level >= 10) rank = 'Community Champion'
    else if (userProfile.level >= 5) rank = 'Active Contributor'
    else if (userProfile.level >= 3) rank = 'Regular Member'
    else if (userProfile.level >= 2) rank = 'Community Member'

    // Check for new achievements
    await GamificationService.checkAchievements(userProfile._id.toString())

    // Format recent activity from both messages and uploads
    const allActivity = [
      ...recentActivity.map((activity: any) => ({
        action: 'Posted message',
        topic: activity.debateId?.title || 'General Discussion',
        time: formatTimeAgo(activity.createdAt),
        xp: activity.xpAwarded || 15,
        type: 'message'
      })),
      ...recentUploads.map((upload: any) => ({
        action: 'Uploaded document',
        topic: upload.title,
        time: formatTimeAgo(upload.createdAt),
        xp: upload.xpAwarded || 75,
        type: 'upload'
      }))
    ]
    
    // Sort by date and take most recent 10
    const formattedActivity = allActivity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)

    // Format achievements with icons
    const formattedAchievements = userProfile.achievements.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: getAchievementDescription(achievement.id),
      icon: achievement.id,
      unlocked: true,
      rarity: getAchievementRarity(achievement.id),
      xp: achievement.xpAwarded,
      unlockedDate: achievement.unlockedAt.toISOString()
    }))

    // Add locked achievements
    const unlockedIds = userProfile.achievements.map((a: any) => a.id)
    const allAchievements = Object.values(GamificationService.ACHIEVEMENTS)
    
    for (const achievement of allAchievements) {
      if (!unlockedIds.includes(achievement.id)) {
        formattedAchievements.push({
          id: achievement.id,
          title: achievement.title,
          description: getAchievementDescription(achievement.id),
          icon: achievement.id,
          unlocked: false,
          rarity: getAchievementRarity(achievement.id),
          xp: achievement.xp,
          progress: getAchievementProgress(achievement.id, userProfile),
          total: getAchievementTotal(achievement.id)
        })
      }
    }

    const profileStats = {
      level: currentLevel,
      xp: xpInCurrentLevel,
      xpToNext: xpToNextLevel,
      xpRequiredForNext: xpRequiredForNext,
      totalXpEarned: userProfile.totalXpEarned,
      totalContributions: userProfile.stats.messagesPosted + userProfile.stats.debatesJoined + userProfile.stats.uploadsShared,
      debatesJoined: userProfile.stats.debatesJoined,
      uploadsShared: userProfile.stats.uploadsShared,
      commentsPosted: userProfile.stats.messagesPosted,
      likesReceived: userProfile.stats.likesReceived,
      streak: userProfile.stats.streak,
      rank,
      achievements: formattedAchievements,
      recentActivity: formattedActivity,
      influenceScore: userProfile.influenceScore,
      trustScore: userProfile.trustScore,
      // Progressive system info for UI
      progressInfo: {
        isNewcomer: currentLevel <= 5,
        nextLevelReward: userProfile.getLevelUpBonus(currentLevel + 1),
        xpMultiplier: getXpMultiplier(currentLevel)
      }
    }

    return NextResponse.json({
      success: true,
      stats: profileStats,
      user: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        role: userProfile.role,
        bio: userProfile.bio,
        location: userProfile.location,
        joinedDate: userProfile.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Profile API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}



function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function getAchievementDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'first_steps': 'Joined the VOX AI community',
    'voice_of_reason': 'Posted 10+ thoughtful messages',
    'debate_master': 'Participated in 5+ debates',
    'community_builder': 'Received 50+ likes on contributions',
    'streak_warrior': 'Maintain a 7-day activity streak',
    'knowledge_sharer': 'Upload 5+ valuable documents',
    'influence_leader': 'Reach 100+ total likes',
    'community_champion': 'Reach level 10'
  }
  return descriptions[id] || 'Achievement description'
}

function getAchievementRarity(id: string): string {
  const rarities: Record<string, string> = {
    'first_steps': 'common',
    'voice_of_reason': 'uncommon',
    'debate_master': 'rare',
    'community_builder': 'rare',
    'streak_warrior': 'uncommon',
    'knowledge_sharer': 'rare',
    'influence_leader': 'epic',
    'community_champion': 'legendary'
  }
  return rarities[id] || 'common'
}

function getAchievementProgress(id: string, user: any): number {
  switch (id) {
    case 'voice_of_reason': return user.stats.messagesPosted
    case 'debate_master': return user.stats.debatesJoined
    case 'community_builder': return user.stats.likesReceived
    case 'streak_warrior': return user.stats.streak
    case 'knowledge_sharer': return user.stats.uploadsShared
    case 'influence_leader': return user.stats.likesReceived
    case 'community_champion': return user.level
    default: return 0
  }
}

function getAchievementTotal(id: string): number {
  switch (id) {
    case 'voice_of_reason': return 10
    case 'debate_master': return 5
    case 'community_builder': return 50
    case 'streak_warrior': return 7
    case 'knowledge_sharer': return 5
    case 'influence_leader': return 100
    case 'community_champion': return 10
    default: return 1
  }
}

export async function PUT(req: NextRequest) {
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

    // Get request body
    const body = await req.json()
    const { firstName, lastName, bio, location } = body

    // Find and update user profile
    const userProfile = await User.findOne({ email: user.email })
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Update profile fields
    if (firstName !== undefined) userProfile.firstName = firstName
    if (lastName !== undefined) userProfile.lastName = lastName
    if (bio !== undefined) userProfile.bio = bio
    if (location !== undefined) userProfile.location = location

    await userProfile.save()

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        role: userProfile.role,
        bio: userProfile.bio,
        location: userProfile.location
      }
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getXpMultiplier(level: number): number {
  // Newcomers get higher multipliers to help them progress faster
  if (level <= 3) return 2.0      // New users get double XP
  if (level <= 5) return 1.8      // Early users get 80% bonus
  if (level <= 10) return 1.5     // Mid-level users get 50% bonus
  if (level <= 15) return 1.2     // Advanced users get 20% bonus
  return 1.0                      // Expert users get base XP
}