import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'success',
      mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      jwt_secret: process.env.JWT_SECRET ? 'Set' : 'Not set',
      gemini_api_key: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
      node_env: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
