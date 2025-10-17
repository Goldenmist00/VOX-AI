import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'citizen' | 'ngo' | 'policymaker'
  
  // Gamification system
  level: number
  xp: number
  totalXpEarned: number
  
  // Engagement stats
  stats: {
    messagesPosted: number
    debatesJoined: number
    uploadsShared: number
    likesReceived: number
    likesGiven: number
    commentsReceived: number
    streak: number
    lastActiveDate: Date
  }
  
  // Achievements
  achievements: Array<{
    id: string
    title: string
    unlockedAt: Date
    xpAwarded: number
  }>
  
  // Priority and influence
  influenceScore: number // Overall influence based on level + achievements + engagement
  trustScore: number // Trust score based on quality contributions
  
  // Profile data
  bio?: string
  location?: string
  avatar?: string
  
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['citizen', 'ngo', 'policymaker'],
      default: 'citizen',
      required: true,
    },
    
    // Gamification system
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalXpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Engagement stats
    stats: {
      messagesPosted: {
        type: Number,
        default: 0,
        min: 0,
      },
      debatesJoined: {
        type: Number,
        default: 0,
        min: 0,
      },
      uploadsShared: {
        type: Number,
        default: 0,
        min: 0,
      },
      likesReceived: {
        type: Number,
        default: 0,
        min: 0,
      },
      likesGiven: {
        type: Number,
        default: 0,
        min: 0,
      },
      commentsReceived: {
        type: Number,
        default: 0,
        min: 0,
      },
      streak: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastActiveDate: {
        type: Date,
        default: Date.now,
      },
    },
    
    // Achievements
    achievements: [{
      id: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
      xpAwarded: {
        type: Number,
        default: 0,
      },
    }],
    
    // Priority and influence
    influenceScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    
    // Profile data
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true,
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    console.error('Error comparing passwords:', error)
    return false
  }
}

// Indexes for better performance
UserSchema.index({ email: 1 })
UserSchema.index({ level: -1 })
UserSchema.index({ influenceScore: -1 })
UserSchema.index({ 'stats.likesReceived': -1 })
UserSchema.index({ isActive: 1 })

// Methods to calculate level and influence
UserSchema.methods.calculateLevel = function() {
  // Progressive XP requirements: easier at start, harder later
  let totalXp = this.totalXpEarned
  let level = 1
  
  while (totalXp >= this.getXpRequiredForLevel(level)) {
    totalXp -= this.getXpRequiredForLevel(level)
    level++
  }
  
  return level
}

UserSchema.methods.getXpRequiredForLevel = function(level: number) {
  // Progressive XP formula: starts easy, gets harder
  if (level <= 5) return 100 * level        // Levels 1-5: 100, 200, 300, 400, 500 XP
  if (level <= 10) return 200 * (level - 5) + 500  // Levels 6-10: 700, 900, 1100, 1300, 1500 XP
  if (level <= 20) return 300 * (level - 10) + 1500 // Levels 11-20: 1800, 2100, 2400... XP
  if (level <= 30) return 500 * (level - 20) + 4500 // Levels 21-30: 5000, 5500, 6000... XP
  return 1000 * (level - 30) + 9500        // Levels 31+: 10500, 11500, 12500... XP
}

UserSchema.methods.getCurrentLevelProgress = function() {
  let totalXp = this.totalXpEarned
  let level = 1
  
  // Calculate current level and remaining XP
  while (totalXp >= this.getXpRequiredForLevel(level)) {
    totalXp -= this.getXpRequiredForLevel(level)
    level++
  }
  
  return {
    currentLevel: level,
    xpInCurrentLevel: totalXp,
    xpRequiredForNext: this.getXpRequiredForLevel(level),
    xpToNextLevel: this.getXpRequiredForLevel(level) - totalXp
  }
}

UserSchema.methods.calculateInfluenceScore = function() {
  const levelBonus = this.level * 10
  const achievementBonus = this.achievements.length * 25
  const engagementBonus = Math.min(this.stats.likesReceived * 2, 500)
  const trustBonus = this.trustScore
  
  return levelBonus + achievementBonus + engagementBonus + trustBonus
}

UserSchema.methods.awardXP = function(amount: number, reason: string) {
  const oldLevel = this.level
  this.totalXpEarned += amount
  
  const newLevel = this.calculateLevel()
  if (newLevel > oldLevel) {
    this.level = newLevel
    
    // Progressive level up bonus: more XP for higher levels
    const levelUpBonus = this.getLevelUpBonus(newLevel)
    this.totalXpEarned += levelUpBonus
    
    console.log(`User leveled up! Level ${oldLevel} -> ${newLevel}, Bonus: ${levelUpBonus} XP`)
  }
  
  this.influenceScore = this.calculateInfluenceScore()
  return this.save()
}

UserSchema.methods.getLevelUpBonus = function(level: number) {
  // Progressive level up bonuses
  if (level <= 5) return 50      // Early levels: 50 XP bonus
  if (level <= 10) return 100    // Mid levels: 100 XP bonus
  if (level <= 20) return 200    // High levels: 200 XP bonus
  if (level <= 30) return 300    // Expert levels: 300 XP bonus
  return 500                     // Master levels: 500 XP bonus
}

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User