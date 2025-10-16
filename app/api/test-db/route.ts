import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Debate from '@/models/Debate'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing database connection...')
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set')
    
    await connectDB()
    console.log('Database connected successfully')

    // Test basic query
    const debateCount = await Debate.countDocuments()
    console.log('Total debates:', debateCount)

    // Test with isActive filter
    const activeDebateCount = await Debate.countDocuments({ isActive: true })
    console.log('Active debates:', activeDebateCount)

    return NextResponse.json({
      success: true,
      totalDebates: debateCount,
      activeDebates: activeDebateCount,
      message: 'Database connection successful'
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    )
  }
}
