import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  debateId: mongoose.Types.ObjectId
  author: string
  authorType: 'citizen' | 'ngo'
  message: string
  sentiment: {
    sentiment_label: 'Positive' | 'Negative' | 'Neutral'
    compound_score: number
    confidence: number
    processed_text: string
  } | 'positive' | 'negative' | 'neutral' // Support both old and new format
  aiScore: number
  keywords: string[]
  contextMatch: boolean
  geminiAnalysis: boolean
  confidence: number
  votes: {
    agree: number
    disagree: number
    neutral: number
  }
  geminiResponse?: {
    rawResponse: string
    processingTime: number
    modelUsed: string
  }
  vaderAnalysis?: {
    sentiment_label: 'Positive' | 'Negative' | 'Neutral'
    compound_score: number
    positive: number
    negative: number
    neutral: number
    confidence: number
    keywords: string[]
    emoji_count: number
    processed_text: string
  }
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  debateId: {
    type: Schema.Types.ObjectId,
    ref: 'Debate',
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  authorType: {
    type: String,
    enum: ['citizen', 'ngo'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  sentiment: {
    type: Schema.Types.Mixed, // Allow both string and object formats
    default: 'neutral'
  },
  aiScore: {
    type: Number,
    required: true,
    min: 10,
    max: 100
  },
  keywords: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  contextMatch: {
    type: Boolean,
    default: false
  },
  geminiAnalysis: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  votes: {
    agree: { type: Number, default: 0, min: 0 },
    disagree: { type: Number, default: 0, min: 0 },
    neutral: { type: Number, default: 0, min: 0 }
  },
  geminiResponse: {
    rawResponse: String,
    processingTime: Number,
    modelUsed: String
  },
  vaderAnalysis: {
    sentiment_label: {
      type: String,
      enum: ['Positive', 'Negative', 'Neutral']
    },
    compound_score: Number,
    positive: Number,
    negative: Number,
    neutral: Number,
    confidence: Number,
    keywords: [String],
    emoji_count: Number,
    processed_text: String
  }
}, {
  timestamps: true
})

// Indexes for better query performance
MessageSchema.index({ debateId: 1, createdAt: -1 })
MessageSchema.index({ sentiment: 1, aiScore: -1 })
MessageSchema.index({ keywords: 1 })
MessageSchema.index({ geminiAnalysis: 1, confidence: -1 })

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)