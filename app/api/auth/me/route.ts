import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    // Debug: Log all cookies
    console.log('All cookies received:', req.cookies.getAll().map(c => `${c.name}=${c.value ? 'exists' : 'empty'}`))
    
    // Get token from cookies - try both cookie names
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value
    console.log('Auth token from cookies:', token ? 'Token exists' : 'No token')
    console.log('vox-ai-auth cookie:', req.cookies.get('vox-ai-auth')?.value ? 'exists' : 'missing')
    console.log('vox-ai-auth-debug cookie:', req.cookies.get('vox-ai-auth-debug')?.value ? 'exists' : 'missing')
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET)

    if (!token) {
      console.log('No auth token found in cookies')
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    // Verify token
    console.log('Attempting to verify token...')
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const decoded = payload as any
    console.log('Token decoded successfully:', { userId: decoded.userId, email: decoded.email })

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization,
        position: user.position,
        isVerified: user.isVerified
      }
    })

  } catch (error) {
    console.error('Auth verification error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}
