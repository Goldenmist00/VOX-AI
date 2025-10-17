import mongoose, { Schema, Document } from 'mongoose'

export interface IUpload extends Document {
  title: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  uploadPath: string
  author: string // User ID who uploaded
  description?: string
  tags: string[]
  
  // Analytics and engagement
  downloads: number
  views: number
  likes: number
  
  // AI Analysis results
  analysis?: {
    summary: string
    keyTopics: string[]
    relevanceScore: number
    qualityScore: number
    category: string
  }
  
  // XP tracking
  xpAwarded: number
  
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UploadSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Upload title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    uploadPath: {
      type: String,
      required: [true, 'Upload path is required'],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    
    // Analytics and engagement
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // AI Analysis results
    analysis: {
      summary: {
        type: String,
        trim: true,
      },
      keyTopics: [{
        type: String,
        trim: true,
      }],
      relevanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      qualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      category: {
        type: String,
        trim: true,
        default: 'General',
      },
    },
    
    // XP tracking
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
UploadSchema.index({ author: 1, createdAt: -1 })
UploadSchema.index({ tags: 1 })
UploadSchema.index({ 'analysis.category': 1 })
UploadSchema.index({ isActive: 1 })
UploadSchema.index({ likes: -1 })
UploadSchema.index({ downloads: -1 })

const Upload = mongoose.models.Upload || mongoose.model<IUpload>('Upload', UploadSchema)

export default Upload