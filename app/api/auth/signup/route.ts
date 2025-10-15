import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password, firstName, lastName, role, organization, position } = await req.json()
    
    console.log('Signup attempt:', { email, firstName, lastName, role, organization, position })

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      console.log('Missing required fields:', { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName, role: !!role })
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['citizen', 'ngo', 'policymaker'].includes(role)) {
      console.log('Invalid role:', role)
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      organization: role !== 'citizen' ? organization : undefined,
      position: role !== 'citizen' ? position : undefined
    })

    await user.save()

    // Generate JWT token
    const token = await new SignJWT({ 
      userId: user._id.toHexString(), // Convert ObjectId to hex string
      email: user.email, 
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    // Set HTTP-only cookie
    const response = NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: user.organization,
          position: user.position
        }
      },
      { status: 201 }
    )

    response.cookies.set('vox-ai-auth', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    })
    
    // Also set debug cookie
    response.cookies.set('vox-ai-auth-debug', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
