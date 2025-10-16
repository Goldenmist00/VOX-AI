import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getCronService } from '@/lib/cron-service'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and admin role
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

    // Only NGO and Policymaker roles can manage cron jobs
    if (!['ngo', 'policymaker'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    const cronService = getCronService()

    switch (action) {
      case 'status':
        const status = cronService.getStatus()
        return NextResponse.json({
          success: true,
          data: status
        })

      case 'scheduled-keywords':
        const scheduledKeywords = await cronService.getScheduledKeywords()
        return NextResponse.json({
          success: true,
          data: scheduledKeywords
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: status, scheduled-keywords' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Cron management GET API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication and admin role
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

    // Only NGO and Policymaker roles can manage cron jobs
    if (!['ngo', 'policymaker'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { action, keyword, fetchInterval, autoFetch, subreddits } = body

    const cronService = getCronService()

    switch (action) {
      case 'start':
        cronService.start()
        return NextResponse.json({
          success: true,
          message: 'Cron service started'
        })

      case 'stop':
        cronService.stop()
        return NextResponse.json({
          success: true,
          message: 'Cron service stopped'
        })

      case 'run-now':
        // Run scheduled fetch immediately
        await cronService.runScheduledFetch()
        return NextResponse.json({
          success: true,
          message: 'Scheduled fetch executed'
        })

      case 'add-keyword':
        if (!keyword || typeof keyword !== 'string') {
          return NextResponse.json(
            { error: 'Keyword is required' },
            { status: 400 }
          )
        }

        const added = await cronService.addKeywordForScheduling(keyword, {
          fetchInterval: fetchInterval || 24,
          autoFetch: autoFetch !== false,
          subreddits
        })

        if (added) {
          return NextResponse.json({
            success: true,
            message: `Keyword "${keyword}" added to scheduled fetching`
          })
        } else {
          return NextResponse.json(
            { error: 'Failed to add keyword to scheduling' },
            { status: 500 }
          )
        }

      case 'remove-keyword':
        if (!keyword || typeof keyword !== 'string') {
          return NextResponse.json(
            { error: 'Keyword is required' },
            { status: 400 }
          )
        }

        const removed = await cronService.removeKeywordFromScheduling(keyword)

        if (removed) {
          return NextResponse.json({
            success: true,
            message: `Keyword "${keyword}" removed from scheduled fetching`
          })
        } else {
          return NextResponse.json(
            { error: 'Failed to remove keyword from scheduling' },
            { status: 500 }
          )
        }

      case 'update-interval':
        if (!keyword || typeof keyword !== 'string') {
          return NextResponse.json(
            { error: 'Keyword is required' },
            { status: 400 }
          )
        }

        if (!fetchInterval || typeof fetchInterval !== 'number' || fetchInterval < 1 || fetchInterval > 168) {
          return NextResponse.json(
            { error: 'Fetch interval must be between 1 and 168 hours' },
            { status: 400 }
          )
        }

        const updated = await cronService.updateFetchInterval(keyword, fetchInterval)

        if (updated) {
          return NextResponse.json({
            success: true,
            message: `Fetch interval for "${keyword}" updated to ${fetchInterval} hours`
          })
        } else {
          return NextResponse.json(
            { error: 'Failed to update fetch interval' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: start, stop, run-now, add-keyword, remove-keyword, update-interval' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Cron management POST API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}