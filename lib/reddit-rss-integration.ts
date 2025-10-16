import RedditRSSService, { ProcessedRedditData } from './reddit-rss-service'
import RedditPost from '@/models/RedditPost'
import RedditComment from '@/models/RedditComment'
import Keyword from '@/models/Keyword'
import connectDB from './mongodb'

export interface RSSFetchResult {
  success: boolean
  keyword: string
  totalPosts: number
  totalComments: number
  totalStored: number
  errors: string[]
  processingTime: number
  statistics: {
    sentiment: {
      positive: number
      negative: number
      neutral: number
    }
    topSubreddits: Array<{ name: string; count: number }>
  }
}

export interface RSSFetchOptions {
  keyword: string
  subreddits?: string[]
  maxPosts?: number
  includeComments?: boolean
  maxCommentsPerPost?: number
  forceRefresh?: boolean
}

export class RedditRSSIntegration {
  private rssService: RedditRSSService
  private processingQueue: Map<string, boolean> = new Map()

  constructor() {
    this.rssService = new RedditRSSService()
  }

  /**
   * Fetch and process Reddit data via RSS
   */
  async fetchRedditRSSData(options: RSSFetchOptions): Promise<RSSFetchResult> {
    const startTime = Date.now()
    const result: RSSFetchResult = {
      success: false,
      keyword: options.keyword,
      totalPosts: 0,
      totalComments: 0,
      totalStored: 0,
      errors: [],
      processingTime: 0,
      statistics: {
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        topSubreddits: []
      }
    }

    try {
      // Check if already processing
      if (this.processingQueue.get(options.keyword)) {
        throw new Error(`Keyword "${options.keyword}" is already being processed`)
      }

      this.processingQueue.set(options.keyword, true)
      await connectDB()

      console.log(`Starting Reddit RSS fetch for keyword: "${options.keyword}"`)

      // Get or create keyword record
      let keywordRecord = await Keyword.findOne({ keyword: options.keyword.toLowerCase() })
      if (!keywordRecord) {
        keywordRecord = new Keyword({ 
          keyword: options.keyword.toLowerCase(),
          fetchStatus: 'processing',
          dataSources: ['rss']
        })
        await keywordRecord.save()
      } else {
        await keywordRecord.markAsProcessing()
      }

      // Check if we should skip fetch (recent data exists and not forced)
      if (!options.forceRefresh && await this.hasRecentData(options.keyword)) {
        console.log(`Recent data exists for "${options.keyword}", skipping fetch`)
        result.success = true
        result.processingTime = Date.now() - startTime
        return result
      }

      // Fetch Reddit data via RSS with timeout
      const fetchPromise = this.rssService.fetchRedditData(options.keyword, {
        subreddits: options.subreddits,
        maxPosts: options.maxPosts || 8, // Further reduced for speed
        includeComments: options.includeComments !== false,
        maxCommentsPerPost: options.maxCommentsPerPost || 3 // Further reduced for speed
      })

      // Add 45-second timeout to prevent hanging (increased)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Reddit RSS fetch timeout after 45 seconds')), 45000)
      })

      const redditData = await Promise.race([fetchPromise, timeoutPromise])

      result.totalPosts = redditData.posts.length
      result.totalComments = redditData.comments.length
      result.statistics = redditData.statistics

      console.log(`Fetched ${result.totalPosts} posts and ${result.totalComments} comments`)

      if (result.totalPosts === 0 && result.totalComments === 0) {
        console.log(`No Reddit data found for keyword: "${options.keyword}"`)
        await keywordRecord.markAsCompleted()
        result.success = true
        result.processingTime = Date.now() - startTime
        return result
      }

      // Store posts and comments in MongoDB
      const storedPosts = await this.storeRedditPosts(redditData.posts, options.keyword)
      const storedComments = await this.storeRedditComments(redditData.comments, options.keyword)
      
      result.totalStored = storedPosts + storedComments

      // Update keyword statistics
      await this.updateKeywordStats(keywordRecord, redditData)
      await keywordRecord.markAsCompleted()

      result.success = true
      result.processingTime = Date.now() - startTime

      console.log(`Successfully processed keyword "${options.keyword}": ${result.totalStored} items stored`)

    } catch (error) {
      console.error(`Error processing keyword "${options.keyword}":`, error)
      result.errors.push(error instanceof Error ? error.message : String(error))
      
      // Mark keyword as failed
      try {
        const keywordRecord = await Keyword.findOne({ keyword: options.keyword.toLowerCase() })
        if (keywordRecord) {
          await keywordRecord.markAsFailed()
        }
      } catch (updateError) {
        console.error('Error updating keyword status:', updateError)
      }
    } finally {
      this.processingQueue.delete(options.keyword)
      result.processingTime = Date.now() - startTime
    }

    return result
  }

  /**
   * Get stored Reddit posts and comments for a keyword
   */
  async getRedditData(
    keyword: string | null,
    options: {
      type?: 'posts' | 'comments' | 'both'
      limit?: number
      sortBy?: 'weightedScore' | 'createdAt' | 'redditScore'
      sortOrder?: 'asc' | 'desc'
      sentiment?: 'positive' | 'negative' | 'neutral'
      subreddit?: string
      page?: number
    } = {}
  ) {
    try {
      await connectDB()

      const {
        type = 'both',
        limit = 50,
        sortBy = 'weightedScore',
        sortOrder = 'desc',
        sentiment,
        subreddit,
        page = 1
      } = options

      const query: any = {}
      
      // Only add keyword filter if keyword is provided
      if (keyword && keyword.trim()) {
        query.keyword = keyword.toLowerCase()
      }

      console.log(`Querying Reddit data for keyword: "${keyword || 'ALL'}"`)
      console.log('Query:', query)

      // First, let's check if any data exists at all
      const totalPosts = await RedditPost.countDocuments(query)
      const totalComments = await RedditComment.countDocuments(query)
      console.log(`Total posts in DB: ${totalPosts}`)
      console.log(`Total comments in DB: ${totalComments}`)

      if (sentiment) {
        query['analysis.sentiment.classification'] = sentiment
      }

      if (subreddit) {
        query.subreddit = subreddit.toLowerCase()
      }

      const sortObj: any = { createdAt: -1 } // Simple sort by creation date

      const skip = (page - 1) * limit

      let posts: any[] = []
      let comments: any[] = []

      if (type === 'posts' || type === 'both') {
        const [postResults, postCount] = await Promise.all([
          RedditPost.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(type === 'both' ? Math.ceil(limit / 2) : limit)
            .lean(),
          RedditPost.countDocuments(query)
        ])
        posts = postResults.map(post => ({ ...post, type: 'post' }))
        console.log(`Found ${posts.length} posts for keyword "${keyword}"`)
      }

      if (type === 'comments' || type === 'both') {
        const [commentResults, commentCount] = await Promise.all([
          RedditComment.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(type === 'both' ? Math.floor(limit / 2) : limit)
            .lean(),
          RedditComment.countDocuments(query)
        ])
        comments = commentResults.map(comment => ({ ...comment, type: 'comment' }))
        console.log(`Found ${comments.length} comments for keyword "${keyword}"`)
      }

      // Combine and sort results
      const allResults = [...posts, ...comments]
        .sort((a, b) => {
          if (sortBy === 'weightedScore') {
            return sortOrder === 'desc' ? b.weightedScore - a.weightedScore : a.weightedScore - b.weightedScore
          } else if (sortBy === 'createdAt') {
            return sortOrder === 'desc' 
              ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          }
          return 0
        })
        .slice(0, limit)

      // Get statistics
      const statistics = await this.getRedditStatistics(keyword)

      return {
        success: true,
        data: {
          posts: posts,
          comments: comments,
          items: allResults, // Keep for backward compatibility
          pagination: {
            currentPage: page,
            totalCount: posts.length + comments.length,
            hasNextPage: skip + limit < posts.length + comments.length,
            hasPrevPage: page > 1,
            limit
          },
          statistics
        }
      }

    } catch (error) {
      console.error('Error getting Reddit data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get Reddit statistics for a keyword
   */
  async getRedditStatistics(keyword: string) {
    try {
      await connectDB()

      const query = { keyword: keyword.toLowerCase(), isActive: true, processed: true }

      const [postStats, commentStats, topSubreddits] = await Promise.all([
        RedditPost.getSentimentStats(query),
        RedditComment.getSentimentStats(query),
        this.getTopSubreddits(keyword)
      ])

      // Combine sentiment stats
      const combinedSentiment = { positive: 0, negative: 0, neutral: 0 }
      
      ;[...postStats, ...commentStats].forEach(stat => {
        if (stat._id && combinedSentiment.hasOwnProperty(stat._id)) {
          combinedSentiment[stat._id as keyof typeof combinedSentiment] += stat.count
        }
      })

      const totalPosts = await RedditPost.countDocuments(query)
      const totalComments = await RedditComment.countDocuments(query)

      return {
        totalPosts,
        totalComments,
        totalItems: totalPosts + totalComments,
        sentiment: combinedSentiment,
        topSubreddits
      }

    } catch (error) {
      console.error('Error getting Reddit statistics:', error)
      return {
        totalPosts: 0,
        totalComments: 0,
        totalItems: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        topSubreddits: []
      }
    }
  }

  /**
   * Get trending keywords from Reddit data
   */
  async getTrendingKeywords(limit: number = 10) {
    try {
      await connectDB()
      
      const trending = await Keyword.aggregate([
        {
          $match: {
            isActive: true,
            volume: { $gt: 0 }
          }
        },
        {
          $lookup: {
            from: 'redditposts',
            localField: 'keyword',
            foreignField: 'keyword',
            as: 'posts'
          }
        },
        {
          $lookup: {
            from: 'redditcomments',
            localField: 'keyword',
            foreignField: 'keyword',
            as: 'comments'
          }
        },
        {
          $addFields: {
            totalItems: { $add: [{ $size: '$posts' }, { $size: '$comments' }] },
            recentActivity: {
              $size: {
                $filter: {
                  input: { $concatArrays: ['$posts', '$comments'] },
                  cond: {
                    $gte: ['$$this.createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)]
                  }
                }
              }
            }
          }
        },
        {
          $sort: { recentActivity: -1, totalItems: -1, volume: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            keyword: 1,
            volume: 1,
            sentiment: 1,
            totalItems: 1,
            recentActivity: 1,
            trending: 1
          }
        }
      ])

      return trending

    } catch (error) {
      console.error('Error getting trending keywords:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private async hasRecentData(keyword: string): Promise<boolean> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const [recentPost, recentComment] = await Promise.all([
        RedditPost.findOne({
          keyword: keyword.toLowerCase(),
          createdAt: { $gte: oneDayAgo }
        }),
        RedditComment.findOne({
          keyword: keyword.toLowerCase(),
          createdAt: { $gte: oneDayAgo }
        })
      ])
      
      return !!(recentPost || recentComment)
    } catch (error) {
      console.error('Error checking recent data:', error)
      return false
    }
  }

  private async storeRedditPosts(
    posts: Array<any>,
    keyword: string
  ): Promise<number> {
    let storedCount = 0

    for (const post of posts) {
      try {
        const redditPost = new RedditPost({
          redditId: post.id,
          title: post.title,
          link: post.link,
          author: post.author,
          subreddit: post.subreddit,
          content: post.content,
          permalink: post.permalink,
          redditScore: post.score || 0,
          keyword: keyword.toLowerCase(),
          analysis: post.analysis,
          processed: true,
          lastProcessed: new Date(),
          isActive: true,
          createdAt: post.created
        })

        await redditPost.save()
        storedCount++
      } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate')) {
          console.log(`Duplicate post skipped: ${post.id}`)
        } else {
          console.error(`Error storing post ${post.id}:`, error)
        }
      }
    }

    return storedCount
  }

  private async storeRedditComments(
    comments: Array<any>,
    keyword: string
  ): Promise<number> {
    let storedCount = 0

    for (const comment of comments) {
      try {
        // Get subreddit from the associated post
        const post = await RedditPost.findOne({ redditId: comment.postId })
        const subreddit = post?.subreddit || 'unknown'

        const redditComment = new RedditComment({
          redditId: comment.id,
          postId: comment.postId,
          author: comment.author,
          content: comment.content,
          permalink: comment.permalink,
          redditScore: comment.score,
          keyword: keyword.toLowerCase(),
          subreddit,
          analysis: comment.analysis,
          processed: true,
          lastProcessed: new Date(),
          isActive: true,
          createdAt: comment.created
        })

        await redditComment.save()
        storedCount++
      } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate')) {
          console.log(`Duplicate comment skipped: ${comment.id}`)
        } else {
          console.error(`Error storing comment ${comment.id}:`, error)
        }
      }
    }

    return storedCount
  }

  private async updateKeywordStats(
    keywordRecord: any,
    redditData: ProcessedRedditData
  ): Promise<void> {
    try {
      // Update sentiment statistics
      keywordRecord.sentiment = {
        positive: redditData.statistics.sentiment.positive,
        negative: redditData.statistics.sentiment.negative,
        neutral: redditData.statistics.sentiment.neutral,
        totalComments: redditData.statistics.totalPosts + redditData.statistics.totalComments
      }

      // Update volume and subreddit stats
      keywordRecord.volume = redditData.statistics.totalPosts + redditData.statistics.totalComments
      keywordRecord.topSubreddits = redditData.statistics.topSubreddits.map(sub => ({
        name: sub.name,
        count: sub.count,
        avgSentiment: 70 // Default neutral sentiment score
      }))

      // Update trending status
      keywordRecord.trending = keywordRecord.volume > 10

      await keywordRecord.save()
    } catch (error) {
      console.error('Error updating keyword stats:', error)
    }
  }

  private async getTopSubreddits(keyword: string) {
    try {
      const subredditStats = await RedditPost.aggregate([
        {
          $match: {
            keyword: keyword.toLowerCase(),
            isActive: true,
            processed: true
          }
        },
        {
          $group: {
            _id: '$subreddit',
            count: { $sum: 1 },
            avgScore: { $avg: '$weightedScore' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: '$_id',
            count: 1,
            avgScore: { $round: ['$avgScore', 0] }
          }
        }
      ])

      return subredditStats
    } catch (error) {
      console.error('Error getting top subreddits:', error)
      return []
    }
  }
}

export default RedditRSSIntegration