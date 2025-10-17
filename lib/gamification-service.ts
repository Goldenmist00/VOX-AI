import User from '@/models/User'
import Message from '@/models/Message'

export interface XPReward {
  amount: number
  reason: string
  multiplier?: number
}

export interface PriorityFactors {
  userLevel: number
  achievements: string[]
  likesReceived: number
  trustScore: number
  messageQuality: number
}

export class GamificationService {
  
  // Progressive XP reward amounts - more generous for newcomers
  static XP_REWARDS = {
    MESSAGE_POSTED: 15,        // Increased base reward
    LIKE_RECEIVED: 8,          // Increased like reward
    DEBATE_JOINED: 30,         // Increased debate reward
    UPLOAD_SHARED: 75,         // Increased upload reward
    ACHIEVEMENT_UNLOCKED: 150, // Increased achievement reward
    QUALITY_BONUS: 25,         // For high-quality messages (score > 80)
    ENGAGEMENT_BONUS: 20,      // For messages that get replies
    STREAK_BONUS: 15,          // Daily activity streak
    FIRST_MESSAGE_BONUS: 50,   // Bonus for first message
    DAILY_LOGIN_BONUS: 10,     // Daily login streak
  }

  // Achievement definitions
  static ACHIEVEMENTS = {
    FIRST_STEPS: { id: 'first_steps', title: 'First Steps', xp: 50 },
    VOICE_OF_REASON: { id: 'voice_of_reason', title: 'Voice of Reason', xp: 150 },
    DEBATE_MASTER: { id: 'debate_master', title: 'Debate Master', xp: 300 },
    COMMUNITY_BUILDER: { id: 'community_builder', title: 'Community Builder', xp: 250 },
    STREAK_WARRIOR: { id: 'streak_warrior', title: 'Streak Warrior', xp: 100 },
    KNOWLEDGE_SHARER: { id: 'knowledge_sharer', title: 'Knowledge Sharer', xp: 200 },
    INFLUENCE_LEADER: { id: 'influence_leader', title: 'Influence Leader', xp: 500 },
    COMMUNITY_CHAMPION: { id: 'community_champion', title: 'Community Champion', xp: 1000 },
  }

  /**
   * Award XP to a user for various actions
   */
  static async awardXP(userId: string, reward: XPReward): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      const finalAmount = Math.floor(reward.amount * (reward.multiplier || 1))
      await user.awardXP(finalAmount, reward.reason)

      console.log(`Awarded ${finalAmount} XP to user ${userId} for: ${reward.reason}`)
    } catch (error) {
      console.error('Error awarding XP:', error)
    }
  }

  /**
   * Calculate priority score for a message based on user factors
   */
  static calculatePriorityScore(factors: PriorityFactors): number {
    const {
      userLevel,
      achievements,
      likesReceived,
      trustScore,
      messageQuality
    } = factors

    // Base score from user level (0-100)
    const levelScore = Math.min(userLevel * 5, 100)

    // Achievement bonus (0-50)
    const achievementScore = Math.min(achievements.length * 5, 50)

    // Engagement bonus based on likes (0-30)
    const engagementScore = Math.min(likesReceived * 0.5, 30)

    // Trust score bonus (0-25)
    const trustBonus = Math.min(trustScore * 0.25, 25)

    // Message quality bonus (0-20)
    const qualityBonus = Math.min(messageQuality * 0.2, 20)

    const totalScore = levelScore + achievementScore + engagementScore + trustBonus + qualityBonus

    return Math.min(Math.round(totalScore), 225) // Cap at 225
  }

  /**
   * Update message priority when it receives engagement
   */
  static async updateMessagePriority(messageId: string): Promise<void> {
    try {
      const message = await Message.findById(messageId).populate('author')
      if (!message || !message.author) return

      const user = message.author as any
      const priorityScore = this.calculatePriorityScore({
        userLevel: user.level || message.userLevel,
        achievements: user.achievements?.map((a: any) => a.id) || message.userAchievements,
        likesReceived: message.engagement?.likes || 0,
        trustScore: user.trustScore || 50,
        messageQuality: message.analysis?.scores?.overall_score || 50
      })

      await Message.findByIdAndUpdate(messageId, { priorityScore })
    } catch (error) {
      console.error('Error updating message priority:', error)
    }
  }

  /**
   * Handle like action - award XP and update priority
   */
  static async handleLike(messageId: string, likerId: string): Promise<void> {
    try {
      const message = await Message.findById(messageId)
      if (!message) return

      // Update message engagement
      await Message.findByIdAndUpdate(messageId, {
        $inc: { 'engagement.likes': 1 }
      })

      // Award XP to message author
      await this.awardXP(message.author.toString(), {
        amount: this.XP_REWARDS.LIKE_RECEIVED,
        reason: 'Received a like on message',
        multiplier: this.getLevelMultiplier(message.userLevel)
      })

      // Update message priority
      await this.updateMessagePriority(messageId)

      // Update user stats
      await User.findByIdAndUpdate(message.author, {
        $inc: { 'stats.likesReceived': 1 }
      })

      await User.findByIdAndUpdate(likerId, {
        $inc: { 'stats.likesGiven': 1 }
      })

    } catch (error) {
      console.error('Error handling like:', error)
    }
  }

  /**
   * Handle document upload
   */
  static async handleDocumentUpload(uploadId: string, userId: string): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      // Check if this is user's first upload
      const isFirstUpload = user.stats.uploadsShared === 0
      
      // Calculate XP reward with multipliers and bonuses
      let xpAmount = this.XP_REWARDS.UPLOAD_SHARED
      const multiplier = this.getLevelMultiplier(user.level)
      
      // First upload bonus for newcomers
      if (isFirstUpload) {
        xpAmount += this.getNewcomerBonus(user.level, 'first_upload')
      }

      // Award XP for upload
      await this.awardXP(userId, {
        amount: xpAmount,
        reason: isFirstUpload ? 'Uploaded first document' : 'Uploaded a document',
        multiplier
      })

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.uploadsShared': 1 },
        $set: { 'stats.lastActiveDate': new Date() }
      })

      // Update upload with XP awarded
      const Upload = (await import('@/models/Upload')).default
      await Upload.findByIdAndUpdate(uploadId, {
        xpAwarded: Math.floor(xpAmount * multiplier)
      })

      // Check for achievements
      await this.checkAchievements(userId)

      console.log(`Document upload processed for user ${userId}, XP awarded: ${Math.floor(xpAmount * multiplier)}`)

    } catch (error) {
      console.error('Error handling document upload:', error)
    }
  }

  /**
   * Handle debate joining
   */
  static async handleDebateJoin(debateId: string, userId: string): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      // Check if user already joined this debate
      const Debate = (await import('@/models/Debate')).default
      const debate = await Debate.findById(debateId)
      if (!debate) return

      const hasJoined = debate.contributors?.some((c: any) => c.toString() === userId)
      if (hasJoined) return // Already joined

      // Check if this is user's first debate
      const isFirstDebate = user.stats.debatesJoined === 0
      
      // Calculate XP reward
      let xpAmount = this.XP_REWARDS.DEBATE_JOINED
      const multiplier = this.getLevelMultiplier(user.level)
      
      // First debate bonus
      if (isFirstDebate) {
        xpAmount += this.getNewcomerBonus(user.level, 'first_debate')
      }

      // Award XP
      await this.awardXP(userId, {
        amount: xpAmount,
        reason: isFirstDebate ? 'Joined first debate' : 'Joined a debate',
        multiplier
      })

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.debatesJoined': 1 },
        $set: { 'stats.lastActiveDate': new Date() }
      })

      // Add user to debate contributors
      await Debate.findByIdAndUpdate(debateId, {
        $addToSet: { contributors: userId }
      })

      // Check for achievements
      await this.checkAchievements(userId)

      console.log(`Debate join processed for user ${userId}, XP awarded: ${Math.floor(xpAmount * multiplier)}`)

    } catch (error) {
      console.error('Error handling debate join:', error)
    }
  }

  /**
   * Handle daily login and streak calculation
   */
  static async handleDailyLogin(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      const today = new Date()
      const lastActive = user.stats.lastActiveDate
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      let newStreak = user.stats.streak
      let xpAmount = 0

      if (daysDiff === 1) {
        // Consecutive day - increase streak
        newStreak += 1
        xpAmount = this.XP_REWARDS.DAILY_LOGIN_BONUS + (newStreak * 2) // Bonus increases with streak
      } else if (daysDiff === 0) {
        // Same day - no change
        return
      } else {
        // Streak broken - reset to 1
        newStreak = 1
        xpAmount = this.XP_REWARDS.DAILY_LOGIN_BONUS
      }

      // Award XP for daily login
      if (xpAmount > 0) {
        await this.awardXP(userId, {
          amount: xpAmount,
          reason: `Daily login (${newStreak} day streak)`,
          multiplier: this.getLevelMultiplier(user.level)
        })
      }

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $set: { 
          'stats.streak': newStreak,
          'stats.lastActiveDate': today
        }
      })

      // Check for streak achievements
      await this.checkAchievements(userId)

      console.log(`Daily login processed for user ${userId}, streak: ${newStreak}, XP: ${xpAmount}`)

    } catch (error) {
      console.error('Error handling daily login:', error)
    }
  }

  /**
   * Handle new message posting
   */
  static async handleNewMessage(messageId: string, userId: string): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      // Check if this is user's first message
      const isFirstMessage = user.stats.messagesPosted === 0
      
      // Update message with user data
      await Message.findByIdAndUpdate(messageId, {
        userLevel: user.level,
        userAchievements: user.achievements.map(a => a.id),
        priorityScore: this.calculatePriorityScore({
          userLevel: user.level,
          achievements: user.achievements.map(a => a.id),
          likesReceived: 0,
          trustScore: user.trustScore,
          messageQuality: 50 // Will be updated after AI analysis
        })
      })

      // Calculate XP reward with multipliers and bonuses
      let xpAmount = this.XP_REWARDS.MESSAGE_POSTED
      const multiplier = this.getLevelMultiplier(user.level)
      
      // First message bonus for newcomers
      if (isFirstMessage) {
        xpAmount += this.XP_REWARDS.FIRST_MESSAGE_BONUS
      }

      // Award XP for posting
      await this.awardXP(userId, {
        amount: xpAmount,
        reason: isFirstMessage ? 'Posted first message' : 'Posted a message',
        multiplier
      })

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.messagesPosted': 1 },
        $set: { 'stats.lastActiveDate': new Date() }
      })

      // Check for achievements
      await this.checkAchievements(userId)

    } catch (error) {
      console.error('Error handling new message:', error)
    }
  }

  /**
   * Get level-based XP multiplier - reverse scaling to help newcomers
   */
  static getLevelMultiplier(level: number): number {
    // Newcomers get higher multipliers to help them progress faster
    if (level <= 3) return 2.0      // New users get double XP
    if (level <= 5) return 1.8      // Early users get 80% bonus
    if (level <= 10) return 1.5     // Mid-level users get 50% bonus
    if (level <= 15) return 1.2     // Advanced users get 20% bonus
    return 1.0                      // Expert users get base XP
  }

  /**
   * Get newcomer bonus XP for early actions
   */
  static getNewcomerBonus(userLevel: number, action: string): number {
    if (userLevel > 5) return 0 // Only for newcomers
    
    const bonuses: Record<string, number> = {
      'first_message': 100,
      'first_like': 25,
      'first_debate': 75,
      'first_upload': 100,
      'profile_complete': 50,
    }
    
    return bonuses[action] || 0
  }

  /**
   * Check and unlock achievements for a user
   */
  static async checkAchievements(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      const unlockedAchievements = user.achievements.map(a => a.id)
      const newAchievements: any[] = []

      // Check First Steps
      if (!unlockedAchievements.includes('first_steps')) {
        newAchievements.push(this.ACHIEVEMENTS.FIRST_STEPS)
      }

      // Check Voice of Reason (10+ messages)
      if (!unlockedAchievements.includes('voice_of_reason') && user.stats.messagesPosted >= 10) {
        newAchievements.push(this.ACHIEVEMENTS.VOICE_OF_REASON)
      }

      // Check Debate Master (5+ debates)
      if (!unlockedAchievements.includes('debate_master') && user.stats.debatesJoined >= 5) {
        newAchievements.push(this.ACHIEVEMENTS.DEBATE_MASTER)
      }

      // Check Community Builder (50+ likes received)
      if (!unlockedAchievements.includes('community_builder') && user.stats.likesReceived >= 50) {
        newAchievements.push(this.ACHIEVEMENTS.COMMUNITY_BUILDER)
      }

      // Check Streak Warrior (7+ day streak)
      if (!unlockedAchievements.includes('streak_warrior') && user.stats.streak >= 7) {
        newAchievements.push(this.ACHIEVEMENTS.STREAK_WARRIOR)
      }

      // Check Knowledge Sharer (5+ uploads)
      if (!unlockedAchievements.includes('knowledge_sharer') && user.stats.uploadsShared >= 5) {
        newAchievements.push(this.ACHIEVEMENTS.KNOWLEDGE_SHARER)
      }

      // Check Influence Leader (100+ likes received)
      if (!unlockedAchievements.includes('influence_leader') && user.stats.likesReceived >= 100) {
        newAchievements.push(this.ACHIEVEMENTS.INFLUENCE_LEADER)
      }

      // Check Community Champion (level 10+)
      if (!unlockedAchievements.includes('community_champion') && user.level >= 10) {
        newAchievements.push(this.ACHIEVEMENTS.COMMUNITY_CHAMPION)
      }

      // Unlock new achievements
      for (const achievement of newAchievements) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            achievements: {
              id: achievement.id,
              title: achievement.title,
              unlockedAt: new Date(),
              xpAwarded: achievement.xp
            }
          }
        })

        // Award achievement XP
        await this.awardXP(userId, {
          amount: achievement.xp,
          reason: `Achievement unlocked: ${achievement.title}`
        })

        console.log(`Achievement unlocked for user ${userId}: ${achievement.title}`)
      }

    } catch (error) {
      console.error('Error checking achievements:', error)
    }
  }

  /**
   * Get messages sorted by priority for a debate
   */
  static async getMessagesByPriority(debateId: string, limit: number = 50): Promise<any[]> {
    try {
      return await Message.find({ debateId, isActive: true })
        .populate('author', 'firstName lastName level achievements stats.likesReceived')
        .sort({ priorityScore: -1, createdAt: -1 })
        .limit(limit)
        .lean()
    } catch (error) {
      console.error('Error getting messages by priority:', error)
      return []
    }
  }

  /**
   * Update user trust score based on message quality
   */
  static async updateTrustScore(userId: string, messageQuality: number): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      // Adjust trust score based on message quality
      let adjustment = 0
      if (messageQuality >= 90) adjustment = 2
      else if (messageQuality >= 80) adjustment = 1
      else if (messageQuality >= 70) adjustment = 0
      else if (messageQuality >= 50) adjustment = -1
      else adjustment = -2

      const newTrustScore = Math.max(0, Math.min(100, user.trustScore + adjustment))
      
      await User.findByIdAndUpdate(userId, {
        trustScore: newTrustScore
      })

    } catch (error) {
      console.error('Error updating trust score:', error)
    }
  }
}

export default GamificationService