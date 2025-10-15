import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthUser {
  userId: string
  email: string
  role: 'citizen' | 'ngo' | 'policymaker'
}

export function verifyAuth(req: NextRequest): AuthUser | null {
  try {
    const token = req.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = verifyAuth(req)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function requireRole(req: NextRequest, allowedRoles: string[]): AuthUser {
  const user = requireAuth(req)
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}
