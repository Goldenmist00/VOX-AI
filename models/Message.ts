import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  content: string
  author: string // User ID who wrote the message
  debateId: string // Debate ID this message belongs to
  analysis: {
    sentiment: {
      overall: string
      confidence: number
      positive_score: number
      negative_score: number
      neutral_score: number
    }
    analysis: {
      clarity: number
      relevance: number
      constructiveness: number
      evidence_quality: number
      respectfulness: number
    }
    scores: {
      overall_score: number
      contribution_quality: number
      debate_value: number
    }
    insights: {
      key_points: string[]
      strengths: string[]
      areas_for_improvement: string[]
      debate_impact: string
    }
    classification: {
      type: string
      stance: string
      tone: string
    }
  }
  // User engagement and priority system
  engagement: {
    likes: number
    dislikes: number
    replies: number
    views: number
  }
  userLevel: number // User's level when posting
  userAchievements: string[] // User's achievements when posting
  priorityScore: number // Calculated priority based on user level + achievements + engagement
  xpAwarded: number // XP awarded to user for this message
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const MessageSchema: Schema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    debateId: {
      type: Schema.Types.ObjectId,
      ref: 'Debate',
      required: [true, 'Debate ID is required'],
    },
    analysis: {
      sentiment: {
        overall: {
          type: String,
          enum: ['positive', 'negative', 'neutral'],
          required: true,
        },
        confidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        positive_score: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        negative_score: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        neutral_score: {
          type: Number,
          min: 0,
          max: 100,
          default: 100,
        },
      },
      analysis: {
        clarity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        relevance: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        constructiveness: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        evidence_quality: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        respectfulness: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
      },
      scores: {
        overall_score: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        contribution_quality: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        debate_value: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
      },
      insights: {
        key_points: [{
          type: String,
          trim: true,
        }],
        strengths: [{
          type: String,
          trim: true,
        }],
        areas_for_improvement: [{
          type: String,
          trim: true,
        }],
        debate_impact: {
          type: String,
          trim: true,
          default: 'No analysis available',
        },
      },
      classification: {
        type: {
          type: String,
          enum: ['argument', 'question', 'agreement', 'disagreement', 'fact', 'opinion', 'solution', 'concern'],
          default: 'opinion',
        },
        stance: {
          type: String,
          enum: ['supporting', 'opposing', 'neutral', 'mixed'],
          default: 'neutral',
        },
        tone: {
          type: String,
          enum: ['professional', 'passionate', 'analytical', 'emotional', 'diplomatic'],
          default: 'neutral',
        },
      },
    },
    // User engagement and priority system
    engagement: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
      },
      dislikes: {
        type: Number,
        default: 0,
        min: 0,
      },
      replies: {
        type: Number,
        default: 0,
        min: 0,
      },
      views: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    userLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
    userAchievements: [{
      type: String,
      trim: true,
    }],
    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    xpAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Indexes for better performance
MessageSchema.index({ debateId: 1, createdAt: -1 })
MessageSchema.index({ author: 1, createdAt: -1 })
MessageSchema.index({ 'analysis.sentiment.overall': 1 })
MessageSchema.index({ isActive: 1 })
MessageSchema.index({ priorityScore: -1, createdAt: -1 }) // For priority-based sorting
MessageSchema.index({ userLevel: -1 }) // For level-based queries
MessageSchema.index({ 'engagement.likes': -1 }) // For popular messages

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)

export default Message
