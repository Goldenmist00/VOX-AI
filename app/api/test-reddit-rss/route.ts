import { NextRequest, NextResponse } from 'next/server'
import RedditRSSService from '@/lib/reddit-rss-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword') || 'climate change'
    
    console.log(`Testing Reddit RSS for keyword: "${keyword}"`)
    
    const rssService = new RedditRSSService()
    
    // Test with a simple fetch
    const result = await rssService.fetchRedditData(keyword, {
      subreddits: ['science'],
      maxPosts: 3,
      includeComments: false,
      maxCommentsPerPost: 0
    })
    
    return NextResponse.json({
      success: true,
      keyword,
      totalPosts: result.posts.length,
      totalComments: result.comments.length,
      posts: result.posts.map(post => ({
        id: post.id,
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        link: post.link
      })),
      statistics: result.statistics
    })
    
  } catch (error) {
    console.error('Test Reddit RSS error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}