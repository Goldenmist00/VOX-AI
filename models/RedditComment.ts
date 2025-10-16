import mongoose, { Schema, Document } from 'mongoose'

export interface IRedditComment extends Document {
  // Reddit comment data
  redditId: string // Reddit comment ID
  postId: string // Associated Reddit post ID
  author: string
  content: string
  permalink: string
  redditScore: number
  
  // Search context
  keyword: string // Search keyword that found this comment
  subreddit: string // Subreddit where the comment was posted
  
  // AI Analysis
  analysis: {
    sentiment: {
      classification: 'positive' | 'negative' | 'neutral'
      confidence: number
      positive_score: number
      negative_score: number
      neutral_score: number
    }
    relevancy: {
      score: number // 0-100
      reasoning: string
      keywords_matched: string[]
    }
    quality: {
      clarity: number // 0-100
      coherence: number // 0-100
      informativeness: number // 0-100
      overall_quality: number // 0-100
    }
    engagement: {
      score: number // 0-100
      factors: string[]
      discussion_potential: number
    }
    insights: {
      key_points: string[]
      stance: 'supporting' | 'opposing' | 'neutral' | 'questioning'
      tone: 'formal' | 'casual' | 'emotional' | 'analytical'
      credibility_indicators: string[]
    }
    contributor: {
      score: number // 0-100
      expertise_level: 'novice' | 'intermediate' | 'expert'
      contribution_type: 'opinion' | 'fact' | 'experience' | 'question'
    }
  }
  
  // Calculated scores
  weightedScore: number
  
  // Processing metadata
  processed: boolean
  processingAttempts: number
  lastProcessed?: Date
  
  // Status
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const RedditCommentSchema: Schema = new Schema(
  {
    redditId: {
      type: String,
      required: [true, 'Reddit ID is required'],
      unique: true,
      index: true,
    },
    postId: {
      type: String,
      required: [true, 'Post ID is required'],
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    permalink: {
      type: String,
      required: [true, 'Permalink is required'],
      trim: true,
    },
    redditScore: {
      type: Number,
      default: 0,
    },
    
    // Search context
    keyword: {
      type: String,
      required: [true, 'Keyword is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    subreddit: {
      type: String,
      required: [true, 'Subreddit is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    
    // AI Analysis (same structure as RedditPost)
    analysis: {
      sentiment: {
        classification: {
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
      relevancy: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        reasoning: {
          type: String,
          trim: true,
          default: 'No analysis available',
        },
        keywords_matched: [{
          type: String,
          trim: true,
        }],
      },
      quality: {
        clarity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        coherence: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        informativeness: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        overall_quality: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
      },
      engagement: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        factors: [{
          type: String,
          trim: true,
        }],
        discussion_potential: {
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
        stance: {
          type: String,
          enum: ['supporting', 'opposing', 'neutral', 'questioning'],
          default: 'neutral',
        },
        tone: {
          type: String,
          enum: ['formal', 'casual', 'emotional', 'analytical'],
          default: 'casual',
        },
        credibility_indicators: [{
          type: String,
          trim: true,
        }],
      },
      contributor: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        expertise_level: {
          type: String,
          enum: ['novice', 'intermediate', 'expert'],
          default: 'novice',
        },
        contribution_type: {
          type: String,
          enum: ['opinion', 'fact', 'experience', 'question'],
          default: 'opinion',
        },
      },
    },
    
    // Calculated scores
    weightedScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    
    // Processing metadata
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processingAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastProcessed: {
      type: Date,
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { 
    timestamps: true,
    collection: 'redditcomments'
  }
)

// Compound indexes for better performance
RedditCommentSchema.index({ keyword: 1, subreddit: 1 })
RedditCommentSchema.index({ keyword: 1, createdAt: -1 })
RedditCommentSchema.index({ postId: 1, createdAt: -1 })
RedditCommentSchema.index({ subreddit: 1, createdAt: -1 })
RedditCommentSchema.index({ author: 1, keyword: 1 })
RedditCommentSchema.index({ 'analysis.sentiment.classification': 1 })
RedditCommentSchema.index({ weightedScore: -1 })
RedditCommentSchema.index({ processed: 1, processingAttempts: 1 })

// Text index for content search
RedditCommentSchema.index({ 
  content: 'text',
  keyword: 'text',
  'analysis.insights.key_points': 'text'
})

// Pre-save middleware to calculate weighted score
RedditCommentSchema.pre('save', function(next) {
  if (this.isModified('analysis') || this.isNew) {
    const analysis = this.analysis
    
    // Calculate weighted score: relevancy*0.4 + quality*0.3 + sentiment*0.2 + engagement*0.1
    const relevancy = analysis.relevancy.score / 100
    const quality = analysis.quality.overall_quality / 100
    const sentiment = this.getSentimentScore(analysis.sentiment.classification) / 100
    const engagement = analysis.engagement.score / 100
    
    const score = (relevancy * 0.4) + (quality * 0.3) + (sentiment * 0.2) + (engagement * 0.1)
    this.weightedScore = Math.round(score * 100)
  }
  next()
})

// Instance method to get sentiment score
RedditCommentSchema.methods.getSentimentScore = function(sentiment: string): number {
  switch (sentiment) {
    case 'positive': return 100
    case 'neutral': return 70
    case 'negative': return 40
    default: return 50
  }
}

// Static method to find by keyword
RedditCommentSchema.statics.findByKeyword = function(keyword: string, options: any = {}) {
  const query = {
    keyword: new RegExp(keyword, 'i'),
    isActive: true,
    processed: true,
    ...options.filter
  }
  
  return this.find(query)
    .sort({ weightedScore: -1, createdAt: -1 })
    .limit(options.limit || 50)
    .populate(options.populate || '')
}

// Static method to get sentiment statistics
RedditCommentSchema.statics.getSentimentStats = function(filter: any = {}) {
  return this.aggregate([
    { $match: { isActive: true, processed: true, ...filter } },
    {
      $group: {
        _id: '$analysis.sentiment.classification',
        count: { $sum: 1 },
        avgScore: { $avg: '$weightedScore' }
      }
    }
  ])
}

const RedditComment = mongoose.models.RedditComment || mongoose.model<IRedditComment>('RedditComment', RedditCommentSchema)

export default RedditComment