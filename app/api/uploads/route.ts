import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectDB from '@/lib/mongodb'
import Upload from '@/models/Upload'
import GamificationService from '@/lib/gamification-service'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload as any
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await req.json()
    const { title, filename, originalName, fileSize, mimeType, uploadPath, description, tags } = body

    // Create upload record
    const upload = new Upload({
      title,
      filename,
      originalName,
      fileSize,
      mimeType,
      uploadPath,
      author: user.id,
      description,
      tags: tags || []
    })

    await upload.save()

    // Handle gamification for upload
    await GamificationService.handleDocumentUpload(upload._id.toString(), user.id)

    return NextResponse.json({
      success: true,
      upload: {
        id: upload._id,
        title: upload.title,
        filename: upload.filename,
        fileSize: upload.fileSize,
        createdAt: upload.createdAt
      },
      message: 'Document uploaded successfully'
    })

  } catch (error) {
    console.error('Upload API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload as any
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get user's uploads
    const query = userId ? { author: userId } : { author: user.id }
    const uploads = await Upload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'firstName lastName')

    return NextResponse.json({
      success: true,
      uploads,
      total: uploads.length
    })

  } catch (error) {
    console.error('Get uploads API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}