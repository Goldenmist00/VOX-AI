import mongoose, { Schema, Document } from 'mongoose'

export interface IKeyword extends Document {
  keyword: string
  searchCount: number
  lastSearched: Date
  trending: boolean
  
  // Sentiment statistics
  sentiment: {
    positive: number
    negative: number
    neutral: number
    totalComments: number
  }
  
  // Volume and growth metrics
  volume: number // Total comments found
  growth: number // Percentage growth from last period
  
  // Related data
  relatedKeywords: string[]
  topSubreddits: Array<{
    name: string
    count: number
    avgSentiment: number
  }>
  
  // Processing metadata
  lastFetched: Date
  nextScheduledFetch?: Date
  fetchStatus: 'pending' | 'processing' | 'completed' | 'failed'
  
  // Configuration
  isActive: boolean
  autoFetch: boolean // Whether to automatically fetch new comments
  fetchInterval: number // Hours between fetches
  dataSources: ('rss')[] // Data sources to use (RSS only)
  
  createdAt: Date
  updatedAt: Date
}

const KeywordSchema: Schema = new Schema(
  {
    keyword: {
      type: String,
      required: [true, 'Keyword is required'],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [100, 'Keyword cannot exceed 100 characters'],
      index: true,
    },
    searchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSearched: {
      type: Date,
      default: Date.now,
      index: true,
    },
    trending: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Sentiment statistics
    sentiment: {
      positive: {
        type: Number,
        default: 0,
        min: 0,
      },
      negative: {
        type: Number,
        default: 0,
        min: 0,
      },
      neutral: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalComments: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    
    // Volume and growth metrics
    volume: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    growth: {
      type: Number,
      default: 0,
    },
    
    // Related data
    relatedKeywords: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    topSubreddits: [{
      name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      count: {
        type: Number,
        required: true,
        min: 0,
      },
      avgSentiment: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    }],
    
    // Processing metadata
    lastFetched: {
      type: Date,
      default: Date.now,
    },
    nextScheduledFetch: {
      type: Date,
      index: true,
    },
    fetchStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    
    // Configuration
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    autoFetch: {
      type: Boolean,
      default: true,
    },
    fetchInterval: {
      type: Number,
      default: 24, // 24 hours
      min: 1,
      max: 168, // 1 week
    },
    dataSources: [{
      type: String,
      enum: ['rss'],
      default: ['rss']
    }],
  },
  { 
    timestamps: true,
    collection: 'keywords'
  }
)

// Indexes for performance
KeywordSchema.index({ trending: -1, volume: -1 })
KeywordSchema.index({ nextScheduledFetch: 1, isActive: 1 })
KeywordSchema.index({ fetchStatus: 1, lastFetched: 1 })
KeywordSchema.index({ searchCount: -1 })

// Pre-save middleware to calculate next fetch time
KeywordSchema.pre('save', function(next) {
  if (this.isModified('fetchInterval') || this.isNew) {
    if (this.autoFetch) {
      this.nextScheduledFetch = new Date(Date.now() + (this.fetchInterval * 60 * 60 * 1000))
    }
  }
  next()
})

// Instance methods
KeywordSchema.methods.updateSentimentStats = function(comments: any[]) {
  const stats = {
    positive: 0,
    negative: 0,
    neutral: 0,
    totalComments: comments.length
  }
  
  comments.forEach(comment => {
    const sentiment = comment.analysis?.sentiment?.classification || 'neutral'
    stats[sentiment as keyof typeof stats]++
  })
  
  this.sentiment = stats
  this.volume = comments.length
  
  return this.save()
}

KeywordSchema.methods.updateSubredditStats = function(comments: any[]) {
  const subredditMap = new Map()
  
  comments.forEach(comment => {
    if (comment.subreddit) {
      const existing = subredditMap.get(comment.subreddit) || { count: 0, totalSentiment: 0 }
      existing.count++
      
      // Add sentiment score (positive=100, neutral=70, negative=40)
      const sentimentScore = this.getSentimentScore(comment.analysis?.sentiment?.classification)
      existing.totalSentiment += sentimentScore
      
      subredditMap.set(comment.subreddit, existing)
    }
  })
  
  // Convert to array and calculate averages
  this.topSubreddits = Array.from(subredditMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgSentiment: Math.round(data.totalSentiment / data.count)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 subreddits
  
  return this.save()
}

KeywordSchema.methods.getSentimentScore = function(sentiment: string): number {
  switch (sentiment) {
    case 'positive': return 100
    case 'neutral': return 70
    case 'negative': return 40
    default: return 50
  }
}

KeywordSchema.methods.markAsProcessing = function() {
  this.fetchStatus = 'processing'
  this.lastFetched = new Date()
  return this.save()
}

KeywordSchema.methods.markAsCompleted = function() {
  this.fetchStatus = 'completed'
  this.searchCount++
  this.lastSearched = new Date()
  
  if (this.autoFetch) {
    this.nextScheduledFetch = new Date(Date.now() + (this.fetchInterval * 60 * 60 * 1000))
  }
  
  return this.save()
}

KeywordSchema.methods.markAsFailed = function() {
  this.fetchStatus = 'failed'
  
  // Retry in 1 hour
  if (this.autoFetch) {
    this.nextScheduledFetch = new Date(Date.now() + (1 * 60 * 60 * 1000))
  }
  
  return this.save()
}

// Static methods
KeywordSchema.statics.findTrending = function(limit: number = 10) {
  return this.find({ 
    isActive: true, 
    trending: true 
  })
  .sort({ volume: -1, growth: -1 })
  .limit(limit)
}

KeywordSchema.statics.findDueForFetch = function(source?: 'rss') {
  const query: any = {
    isActive: true,
    autoFetch: true,
    fetchStatus: { $ne: 'processing' },
    $or: [
      { nextScheduledFetch: { $lte: new Date() } },
      { nextScheduledFetch: { $exists: false } }
    ]
  }
  
  // Filter by data source if specified
  if (source) {
    query.dataSources = source
  }
  
  return this.find(query).sort({ lastFetched: 1 })
}

KeywordSchema.statics.getPopularKeywords = function(limit: number = 20) {
  return this.find({ isActive: true })
    .sort({ searchCount: -1, volume: -1 })
    .limit(limit)
    .select('keyword searchCount volume sentiment trending')
}

KeywordSchema.statics.searchKeywords = function(query: string, limit: number = 10) {
  return this.find({
    isActive: true,
    keyword: new RegExp(query, 'i')
  })
  .sort({ searchCount: -1, volume: -1 })
  .limit(limit)
  .select('keyword searchCount volume sentiment')
}

const Keyword = mongoose.models.Keyword || mongoose.model<IKeyword>('Keyword', KeywordSchema)

export default Keyword