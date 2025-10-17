import mongoose, { Schema, Document } from 'mongoose'

export interface IAdoptedIssue extends Document {
  debateId: mongoose.Schema.Types.ObjectId
  adoptedBy: mongoose.Schema.Types.ObjectId // User who adopted (NGO or policymaker)
  adoptedByRole: 'ngo' | 'policymaker'
  organizationName?: string
  status: 'active' | 'in_progress' | 'completed' | 'on_hold'
  notes?: string
  campaignPlan?: any
  policyBrief?: any
  progress: {
    milestones: Array<{
      title: string
      completed: boolean
      completedAt?: Date
    }>
    updates: Array<{
      update: string
      createdAt: Date
    }>
  }
  collaborators: Array<mongoose.Schema.Types.ObjectId>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const AdoptedIssueSchema: Schema = new Schema(
  {
    debateId: {
      type: Schema.Types.ObjectId,
      ref: 'Debate',
      required: true,
    },
    adoptedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adoptedByRole: {
      type: String,
      enum: ['ngo', 'policymaker'],
      required: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'in_progress', 'completed', 'on_hold'],
      default: 'active',
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    campaignPlan: {
      type: Schema.Types.Mixed,
    },
    policyBrief: {
      type: Schema.Types.Mixed,
    },
    progress: {
      milestones: [{
        title: String,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      }],
      updates: [{
        update: String,
        createdAt: { type: Date, default: Date.now },
      }],
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Indexes
AdoptedIssueSchema.index({ adoptedBy: 1, isActive: 1 })
AdoptedIssueSchema.index({ debateId: 1, isActive: 1 })
AdoptedIssueSchema.index({ status: 1 })

const AdoptedIssue = mongoose.models.AdoptedIssue || mongoose.model<IAdoptedIssue>('AdoptedIssue', AdoptedIssueSchema)

export default AdoptedIssue

