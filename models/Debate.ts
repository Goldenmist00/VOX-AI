import mongoose, { Schema, Document } from 'mongoose'

export interface IDebate extends Document {
  title: string
  description: string
  tags: string[]
  createdBy: mongoose.Schema.Types.ObjectId // Reference to User model
  participants: number
  messages: number
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
  activity: 'low' | 'medium' | 'high'
  aiScore: number
  trending: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const DebateSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Debate title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Debate description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Each tag cannot exceed 50 characters'],
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    participants: {
      type: Number,
      default: 0,
      min: [0, 'Participants cannot be negative'],
    },
    messages: {
      type: Number,
      default: 0,
      min: [0, 'Messages cannot be negative'],
    },
    sentiment: {
      positive: {
        type: Number,
        default: 0,
        min: [0, 'Positive sentiment cannot be negative'],
        max: [100, 'Positive sentiment cannot exceed 100%'],
      },
      negative: {
        type: Number,
        default: 0,
        min: [0, 'Negative sentiment cannot be negative'],
        max: [100, 'Negative sentiment cannot exceed 100%'],
      },
      neutral: {
        type: Number,
        default: 100,
        min: [0, 'Neutral sentiment cannot be negative'],
        max: [100, 'Neutral sentiment cannot exceed 100%'],
      },
    },
    activity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    aiScore: {
      type: Number,
      default: 0,
      min: [0, 'AI Score cannot be negative'],
      max: [100, 'AI Score cannot exceed 100'],
    },
    trending: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Index for better search performance
DebateSchema.index({ title: 'text', description: 'text', tags: 'text' })
DebateSchema.index({ createdAt: -1 })
DebateSchema.index({ participants: -1 })
DebateSchema.index({ trending: -1 })

const Debate = mongoose.models.Debate || mongoose.model<IDebate>('Debate', DebateSchema)

export default Debate
