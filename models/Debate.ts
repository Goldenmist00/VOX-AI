import mongoose, { Schema, Document } from 'mongoose'

export interface IDebate extends Document {
  title: string
  description: string
  tags: string[]
  author: string
  authorType: 'citizen' | 'ngo'
  participants: number
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
  activity: 'low' | 'medium' | 'high'
  aiScore: number
  messageCount: number
  trending: boolean
  votes: {
    agree: number
    disagree: number
    neutral: number
  }
  createdAt: Date
  updatedAt: Date
}

const DebateSchema = new Schema<IDebate>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  author: {
    type: String,
    required: true,
    trim: true
  },
  authorType: {
    type: String,
    enum: ['citizen', 'ngo'],
    required: true
  },
  participants: {
    type: Number,
    default: 1,
    min: 0
  },
  sentiment: {
    positive: { type: Number, default: 50, min: 0, max: 100 },
    negative: { type: Number, default: 25, min: 0, max: 100 },
    neutral: { type: Number, default: 25, min: 0, max: 100 }
  },
  activity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  aiScore: {
    type: Number,
    default: 75,
    min: 10,
    max: 100
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  trending: {
    type: Boolean,
    default: false
  },
  votes: {
    agree: { type: Number, default: 0, min: 0 },
    disagree: { type: Number, default: 0, min: 0 },
    neutral: { type: Number, default: 0, min: 0 }
  }
}, {
  timestamps: true
})

// Indexes for better query performance
DebateSchema.index({ trending: -1, createdAt: -1 })
DebateSchema.index({ activity: -1, updatedAt: -1 })
DebateSchema.index({ tags: 1 })
DebateSchema.index({ title: 'text', description: 'text' })

export default mongoose.models.Debate || mongoose.model<IDebate>('Debate', DebateSchema)