import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AdoptedIssue from '@/models/AdoptedIssue'
import Debate from '@/models/Debate'
import User from '@/models/User'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

// POST - Adopt an issue
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = (payload as any).userId
    const userRole = (payload as any).role

    // Verify user is NGO or policymaker
    if (!['ngo', 'policymaker'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only NGOs and policymakers can adopt issues' },
        { status: 403 }
      )
    }

    const { debateId, notes, campaignPlan, policyBrief } = await req.json()

    if (!debateId) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      )
    }

    // Verify debate exists
    const debate = await Debate.findById(debateId)
    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Check if already adopted by this user
    const existingAdoption = await AdoptedIssue.findOne({
      debateId,
      adoptedBy: userId,
      isActive: true
    })

    if (existingAdoption) {
      return NextResponse.json(
        { error: 'You have already adopted this issue' },
        { status: 400 }
      )
    }

    // Get user information
    const user = await User.findById(userId)
    
    // Create adopted issue
    const adoptedIssue = new AdoptedIssue({
      debateId,
      adoptedBy: userId,
      adoptedByRole: userRole,
      organizationName: user?.organization || `${user?.firstName} ${user?.lastName}`,
      status: 'active',
      notes,
      campaignPlan,
      policyBrief,
      progress: {
        milestones: [],
        updates: [{
          update: 'Issue adopted and initial planning phase started',
          createdAt: new Date()
        }]
      },
      collaborators: [],
      isActive: true
    })

    await adoptedIssue.save()

    // Populate the references for response
    await adoptedIssue.populate('adoptedBy', 'firstName lastName email role organization')
    await adoptedIssue.populate('debateId', 'title description tags sentiment')

    return NextResponse.json({
      success: true,
      message: 'Issue adopted successfully',
      adoptedIssue
    }, { status: 201 })

  } catch (error) {
    console.error('Error adopting issue:', error)
    return NextResponse.json(
      { error: 'Failed to adopt issue' },
      { status: 500 }
    )
  }
}

// GET - Get adopted issues for current user
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = (payload as any).userId

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // Build query
    const query: any = {
      adoptedBy: userId,
      isActive: true
    }

    if (status) {
      query.status = status
    }

    const adoptedIssues = await AdoptedIssue.find(query)
      .populate('adoptedBy', 'firstName lastName email role organization')
      .populate('debateId', 'title description tags sentiment participants messages')
      .populate('collaborators', 'firstName lastName email role organization')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      adoptedIssues
    })

  } catch (error) {
    console.error('Error fetching adopted issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adopted issues' },
      { status: 500 }
    )
  }
}

// PATCH - Update adopted issue
export async function PATCH(req: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = (payload as any).userId

    const { adoptedIssueId, status, notes, update, milestone } = await req.json()

    if (!adoptedIssueId) {
      return NextResponse.json(
        { error: 'Adopted issue ID is required' },
        { status: 400 }
      )
    }

    // Find adopted issue and verify ownership
    const adoptedIssue = await AdoptedIssue.findOne({
      _id: adoptedIssueId,
      adoptedBy: userId,
      isActive: true
    })

    if (!adoptedIssue) {
      return NextResponse.json(
        { error: 'Adopted issue not found or you do not have permission' },
        { status: 404 }
      )
    }

    // Update fields
    if (status) adoptedIssue.status = status
    if (notes) adoptedIssue.notes = notes
    
    if (update) {
      adoptedIssue.progress.updates.push({
        update,
        createdAt: new Date()
      })
    }

    if (milestone) {
      adoptedIssue.progress.milestones.push({
        title: milestone.title,
        completed: milestone.completed || false,
        completedAt: milestone.completed ? new Date() : undefined
      })
    }

    await adoptedIssue.save()

    return NextResponse.json({
      success: true,
      message: 'Adopted issue updated successfully',
      adoptedIssue
    })

  } catch (error) {
    console.error('Error updating adopted issue:', error)
    return NextResponse.json(
      { error: 'Failed to update adopted issue' },
      { status: 500 }
    )
  }
}

