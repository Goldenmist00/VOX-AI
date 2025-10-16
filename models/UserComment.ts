import mongoose, { Schema, Document } from 'mongoose'

export interface IUserComment extends Document {
  // Reference to the Reddit post
  postId: string // Reddit post ID
  
  // User information
  authorId: string // User ID from auth system
  authorName: string // User's display name
  authorEmail: string // User's email
  
  // Comment content
  content: string
  
  // AI Analysis (same structure as VOX comments)
  analysis: {
    sentiment: {
      overall: 'positive' | 'negative' | 'neutral'
      confidence: number
      positive_score: number
      negative_score: number
      neutral_score: number
    }
    analysis: {
      clarity: number // 0-100
      relevance: number // 0-100
      constructiveness: number // 0-100
      evidence_quality: number // 0-100
      respectfulness: number // 0-100
    }
    scores: {
      overall_score: number // 0-100
      contribution_quality: number // 0-100
      debate_value: number // 0-100
    }
    insights: {
      key_points: string[]
      strengths: string[]
      areas_for_improvement: string[]
      debate_impact: string
    }
    classification: {
      type: 'argument' | 'question' | 'agreement' | 'disagreement' | 'fact' | 'opinion' | 'solution' | 'concern'
      stance: 'supporting' | 'opposing' | 'neutral' | 'mixed'
      tone: 'professional' | 'passionate' | 'analytical' | 'emotional' | 'diplomatic'
    }
  }
  
  // Metadata
  isActive: boolean
  processed: boolean
  createdAt: Date
  updatedAt: Date
}

const UserCommentSchema: Schema = new Schema(
  {
    postId: {
      type: String,
      required: [true, 'Post ID is required'],
      index: true,
    },
    authorId: {
      type: String,
      required: [true, 'Author ID is required'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    authorEmail: {
      type: String,
      required: [true, 'Author email is required'],
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
      minlength: [10, 'Content must be at least 10 characters'],
    },
    
    // AI Analysis (matching VOX comment structure)
    analysis: {
      sentiment: {
        overall: {
          type: String,
          enum: ['positive', 'negative', 'neutral'],
          required: true,
          default: 'neutral',
        },
        confidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
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
          default: 'No impact analysis available',
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
          default: 'analytical',
        },
      },
    },
    
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { 
    timestamps: true,
    collection: 'usercomments'
  }
)

// Indexes for better performance
UserCommentSchema.index({ postId: 1, createdAt: -1 })
UserCommentSchema.index({ authorId: 1, createdAt: -1 })
UserCommentSchema.index({ 'analysis.sentiment.classification': 1 })

const UserComment = mongoose.models.UserComment || mongoose.model<IUserComment>('UserComment', UserCommentSchema)

export default UserComment