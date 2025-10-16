import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing MongoDB connection...')
    await connectDB()
    console.log('MongoDB connected successfully')
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'MongoDB connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
