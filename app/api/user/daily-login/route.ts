import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectDB from '@/lib/mongodb'
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

    // Handle daily login
    await GamificationService.handleDailyLogin(user.id)

    return NextResponse.json({
      success: true,
      message: 'Daily login processed'
    })

  } catch (error) {
    console.error('Daily login API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}