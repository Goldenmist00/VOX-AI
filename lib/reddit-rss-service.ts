import axios from 'axios'
import * as cheerio from 'cheerio'
import { parseString } from 'xml2js'
import { geminiService } from './gemini'

export interface RedditPost {
  id: string
  title: string
  link: string
  author: string
  subreddit: string
  created: Date
  score?: number
  content?: string
  permalink: string
}

export interface RedditComment {
  id: string
  postId: string
  author: string
  content: string
  score: number
  created: Date
  permalink: string
}

export interface AIAnalysisResult {
  sentiment: {
    classification: 'positive' | 'negative' | 'neutral'
    confidence: number
    positive_score: number
    negative_score: number
    neutral_score: number
  }
  relevancy: {
    score: number // 0-100
    reasoning: string
    keywords_matched: string[]
  }
  quality: {
    clarity: number // 0-100
    coherence: number // 0-100
    informativeness: number // 0-100
    overall_quality: number // 0-100
  }
  engagement: {
    score: number // 0-100
    factors: string[]
    discussion_potential: number
  }
  insights: {
    key_points: string[]
    stance: 'supporting' | 'opposing' | 'neutral' | 'questioning'
    tone: 'formal' | 'casual' | 'emotional' | 'analytical'
    credibility_indicators: string[]
  }
  contributor: {
    score: number // 0-100
    expertise_level: 'novice' | 'intermediate' | 'expert'
    contribution_type: 'opinion' | 'fact' | 'experience' | 'question'
  }
}

export interface ProcessedRedditData {
  posts: Array<RedditPost & { analysis: AIAnalysisResult }>
  comments: Array<RedditComment & { analysis: AIAnalysisResult }>
  statistics: {
    totalPosts: number
    totalComments: number
    sentiment: {
      positive: number
      negative: number
      neutral: number
    }
    topSubreddits: Array<{ name: string; count: number }>
  }
}

export class RedditRSSService {
  private requestDelay = 1000 // 1 second between requests (reduced)
  private maxRetries = 2 // Reduced retries
  private userAgent = 'VOX-AI-RSS-Analyzer/1.0.0'
  private requestTimeout = 8000 // 8 second timeout (reduced)
  private quotaExceeded = false // Track if quota is exceeded

  // Default subreddits for different topics (reduced for performance)
  private defaultSubreddits: Record<string, string[]> = {
    'climate change': ['environment', 'climatechange'],
    'politics': ['politics', 'worldnews'],
    'technology': ['technology', 'artificial'],
    'health': ['health', 'medicine'],
    'economy': ['economics', 'finance'],
    'education': ['education', 'college'],
    'default': ['news', 'worldnews']
  }

  /**
   * Fetch Reddit posts via RSS for a given keyword
   */
  async fetchRedditData(
    keyword: string,
    options: {
      subreddits?: string[]
      maxPosts?: number
      includeComments?: boolean
      maxCommentsPerPost?: number
    } = {}
  ): Promise<ProcessedRedditData> {
    const {
      subreddits = this.getRelevantSubreddits(keyword),
      maxPosts = 20,
      includeComments = true,
      maxCommentsPerPost = 10
    } = options

    console.log(`Fetching Reddit data for keyword: "${keyword}" from ${subreddits.length} subreddits`)

    const allPosts: RedditPost[] = []
    const allComments: RedditComment[] = []

    // Fetch posts from each subreddit
    for (const subreddit of subreddits) {
      try {
        const posts = await this.fetchPostsFromSubreddit(keyword, subreddit, Math.ceil(maxPosts / subreddits.length))
        allPosts.push(...posts)

        // Fetch comments for each post if requested (limit to first 2 posts for performance)
        if (includeComments && posts.length > 0) {
          const postsToProcess = posts.slice(0, Math.min(2, posts.length))
          for (const post of postsToProcess) {
            try {
              const comments = await this.fetchCommentsFromPost(post, Math.min(3, maxCommentsPerPost))
              allComments.push(...comments)
              
              // Minimal delay between comment fetches
              await this.delay(200)
            } catch (error) {
              console.error(`Error fetching comments for post ${post.id}:`, error)
            }
          }
        }

        // Minimal delay between subreddit fetches
        await this.delay(200)
      } catch (error) {
        console.error(`Error fetching from r/${subreddit}:`, error)
      }
    }

    console.log(`Fetched ${allPosts.length} posts and ${allComments.length} comments`)

    // Analyze with Gemini AI (skip if quota already exceeded or too many items)
    let analyzedPosts: Array<RedditPost & { analysis: AIAnalysisResult }>
    let analyzedComments: Array<RedditComment & { analysis: AIAnalysisResult }>
    
    const totalItems = allPosts.length + allComments.length
    if (this.quotaExceeded || totalItems > 15) {
      console.log(`Skipping AI analysis (quota: ${this.quotaExceeded}, items: ${totalItems})`)
      analyzedPosts = allPosts.map(post => ({ ...post, analysis: this.getDefaultAnalysis() }))
      analyzedComments = allComments.map(comment => ({ ...comment, analysis: this.getDefaultAnalysis() }))
    } else {
      analyzedPosts = await this.analyzeContent(allPosts, keyword, 'post')
      analyzedComments = await this.analyzeContent(allComments, keyword, 'comment')
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(analyzedPosts, analyzedComments)

    return {
      posts: analyzedPosts,
      comments: analyzedComments,
      statistics
    }
  }

  /**
   * Fetch posts from a specific subreddit via RSS
   */
  private async fetchPostsFromSubreddit(keyword: string, subreddit: string, limit: number): Promise<RedditPost[]> {
    const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&limit=${limit}&sort=relevance`
    
    console.log(`Fetching RSS from: ${rssUrl}`)

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(rssUrl, {
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: this.requestTimeout
        })

        const posts = await this.parseRSSFeed(response.data, subreddit)
        console.log(`Successfully fetched ${posts.length} posts from r/${subreddit}`)
        return posts

      } catch (error) {
        console.error(`Attempt ${attempt} failed for r/${subreddit}:`, error)
        
        if (attempt === this.maxRetries) {
          console.warn(`All attempts failed for r/${subreddit}, returning empty array`)
          return []
        }
        
        // Wait before retry
        await this.delay(attempt * 1000)
      }
    }

    return []
  }

  /**
   * Parse RSS/Atom XML feed into RedditPost objects
   */
  private async parseRSSFeed(xmlData: string, subreddit: string): Promise<RedditPost[]> {
    return new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err)
          return
        }

        try {
          const posts: RedditPost[] = []
          
          // Handle both RSS and Atom formats
          let items: any[] = []
          
          // Check for RSS format
          if (result?.rss?.channel?.[0]?.item) {
            items = result.rss.channel[0].item
          }
          // Check for Atom format (Reddit uses this)
          else if (result?.feed?.entry) {
            items = result.feed.entry
          }

          console.log(`Found ${items.length} items in feed for r/${subreddit}`)

          for (const item of items) {
            let title, link, author, pubDate, description, postId

            // Handle RSS format
            if (item.title && item.link && typeof item.link === 'string') {
              title = item.title
              link = item.link
              author = item.author || 'unknown'
              pubDate = item.pubDate
              description = item.description || ''
            }
            // Handle Atom format (Reddit)
            else {
              title = item.title?.[0] || ''
              link = item.link?.[0]?.$?.href || item.link?.[0] || ''
              author = item.author?.[0]?.name?.[0] || 'unknown'
              pubDate = item.published?.[0] || item.updated?.[0] || ''
              description = item.content?.[0]?._ || item.content?.[0] || ''
              postId = item.id?.[0] || ''
            }

            // Extract post ID from link or use provided ID
            const postIdMatch = link.match(/\/comments\/([a-z0-9]+)\//)
            const finalPostId = postIdMatch ? postIdMatch[1] : (postId || `rss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

            // Clean and extract content from description
            const cleanContent = this.cleanHtmlContent(description)

            // Clean author name (remove /u/ prefix if present)
            const cleanAuthor = this.cleanText(author).replace(/^\/u\//, '')

            posts.push({
              id: finalPostId,
              title: this.cleanText(title),
              link,
              author: cleanAuthor,
              subreddit,
              created: new Date(pubDate),
              content: cleanContent,
              permalink: link.replace('https://www.reddit.com', '')
            })
          }

          console.log(`Successfully parsed ${posts.length} posts from r/${subreddit}`)
          resolve(posts)
        } catch (parseError) {
          console.error('Error parsing RSS/Atom feed:', parseError)
          reject(parseError)
        }
      })
    })
  }

  /**
   * Fetch comments from a Reddit post by scraping the HTML page
   */
  private async fetchCommentsFromPost(post: RedditPost, maxComments: number): Promise<RedditComment[]> {
    try {
      // Add .json to the URL to get JSON response instead of HTML
      const jsonUrl = post.link.replace(/\/$/, '') + '.json'
      
      const response = await axios.get(jsonUrl, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      })

      const comments: RedditComment[] = []
      const jsonData = response.data

      // Reddit JSON structure: [post_data, comments_data]
      if (Array.isArray(jsonData) && jsonData.length > 1) {
        const commentsData = jsonData[1]?.data?.children || []
        
        let commentCount = 0
        for (const commentItem of commentsData) {
          if (commentCount >= maxComments) break
          
          const comment = commentItem.data
          if (comment && comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]') {
            comments.push({
              id: comment.id || `comment_${Date.now()}_${commentCount}`,
              postId: post.id,
              author: comment.author || 'unknown',
              content: this.cleanText(comment.body),
              score: comment.score || 0,
              created: new Date((comment.created_utc || 0) * 1000),
              permalink: `${post.permalink}${comment.id}/`
            })
            commentCount++
          }
        }
      }

      console.log(`Fetched ${comments.length} comments from post: ${post.title.substring(0, 50)}...`)
      return comments

    } catch (error) {
      console.error(`Error fetching comments from ${post.link}:`, error)
      return []
    }
  }

  /**
   * Analyze content with Gemini AI
   */
  private async analyzeContent<T extends RedditPost | RedditComment>(
    items: T[],
    keyword: string,
    type: 'post' | 'comment'
  ): Promise<Array<T & { analysis: AIAnalysisResult }>> {
    const analyzed: Array<T & { analysis: AIAnalysisResult }> = []
    
    // If quota is exceeded, return items with default analysis
    if (this.quotaExceeded) {
      console.log(`Quota exceeded, using default analysis for ${items.length} ${type}s`)
      return items.map(item => ({
        ...item,
        analysis: this.getDefaultAnalysis()
      }))
    }

    const batchSize = 2 // Further reduced batch size to avoid rate limits

    console.log(`Analyzing ${items.length} ${type}s with Gemini AI...`)

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (item) => {
        const analysis = await this.analyzeWithCentralizedGemini(item, keyword, type)
        return { ...item, analysis }
      })

      try {
        const batchResults = await Promise.all(batchPromises)
        analyzed.push(...batchResults)
        
        console.log(`Analyzed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`)
        
        // Delay between batches
        if (i + batchSize < items.length) {
          await this.delay(1500) // Reduced delay for speed
        }
      } catch (error: any) {
        console.error(`Batch analysis failed for batch starting at ${i}:`, error)
        
        // Check if it's a quota error
        if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
          console.warn('Quota exceeded during batch processing, switching to default analysis')
          this.quotaExceeded = true
          
          // Add remaining items with default analysis
          const remainingItems = items.slice(i)
          remainingItems.forEach(item => {
            analyzed.push({ ...item, analysis: this.getDefaultAnalysis() })
          })
          break
        }
        
        // Add items with default analysis if batch fails for other reasons
        batch.forEach(item => {
          analyzed.push({ ...item, analysis: this.getDefaultAnalysis() })
        })
      }
    }

    return analyzed
  }

  /**
   * Analyze individual item with centralized Gemini service
   */
  private async analyzeWithCentralizedGemini(
    item: RedditPost | RedditComment,
    keyword: string,
    type: 'post' | 'comment'
  ): Promise<AIAnalysisResult> {
    try {
      // Skip analysis if quota is already exceeded
      if (this.quotaExceeded) {
        return this.getDefaultAnalysis()
      }

      const content = 'title' in item ? `${item.title}\n\n${item.content || ''}` : item.content
      const subreddit = 'subreddit' in item ? item.subreddit : (item as any).subreddit || 'unknown'

      // Use centralized Gemini service for Reddit comment analysis
      const postContext = {
        title: 'title' in item ? item.title : `Comment in r/${subreddit}`,
        subreddit: subreddit,
        keyword: keyword
      }

      const analysis = await geminiService.analyzeRedditComment(content, postContext)

      // Convert the centralized format to the expected AIAnalysisResult format
      return {
        sentiment: analysis.sentiment,
        relevancy: {
          score: analysis.relevancy.score,
          reasoning: analysis.relevancy.reasoning,
          keywords_matched: analysis.insights.key_points
        },
        quality: analysis.quality,
        engagement: {
          score: Math.round((analysis.quality.overall_quality + analysis.relevancy.score) / 2),
          factors: analysis.insights.key_points.length > 0 ? ['informative'] : [],
          discussion_potential: analysis.quality.overall_quality
        },
        insights: {
          key_points: analysis.insights.key_points,
          stance: analysis.insights.stance,
          tone: analysis.insights.tone,
          credibility_indicators: analysis.insights.key_points.length > 2 ? ['detailed response'] : []
        },
        contributor: {
          score: analysis.quality.overall_quality,
          expertise_level: analysis.quality.overall_quality > 80 ? 'expert' : 
                          analysis.quality.overall_quality > 60 ? 'intermediate' : 'novice',
          contribution_type: analysis.insights.stance === 'questioning' ? 'question' : 
                           analysis.quality.informativeness > 70 ? 'fact' : 'opinion'
        }
      }
    } catch (error: any) {
      // Handle quota exceeded errors more gracefully
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
        console.warn('Gemini API quota exceeded, switching to default analysis')
        this.quotaExceeded = true
      }
      
      console.error('Error analyzing with centralized Gemini:', error?.message || error)
      return this.getDefaultAnalysis()
    }
  }

  /**
   * Calculate statistics from analyzed data
   */
  private calculateStatistics(
    posts: Array<RedditPost & { analysis: AIAnalysisResult }>,
    comments: Array<RedditComment & { analysis: AIAnalysisResult }>
  ) {
    const allItems = [...posts, ...comments]
    
    const sentiment = {
      positive: 0,
      negative: 0,
      neutral: 0
    }

    const subredditCounts: Record<string, number> = {}

    allItems.forEach(item => {
      const sentimentClass = item.analysis.sentiment.classification
      sentiment[sentimentClass]++

      const subreddit = 'subreddit' in item ? item.subreddit : 'unknown'
      subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1
    })

    const topSubreddits = Object.entries(subredditCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalPosts: posts.length,
      totalComments: comments.length,
      sentiment,
      topSubreddits
    }
  }

  /**
   * Get relevant subreddits for a keyword
   */
  private getRelevantSubreddits(keyword: string): string[] {
    const lowerKeyword = keyword.toLowerCase()
    
    // Check for specific topic matches
    for (const [topic, subreddits] of Object.entries(this.defaultSubreddits)) {
      if (lowerKeyword.includes(topic)) {
        return subreddits
      }
    }

    // Return default subreddits
    return this.defaultSubreddits.default
  }

  /**
   * Clean HTML content
   */
  private cleanHtmlContent(html: string): string {
    if (!html) return ''
    
    // Use cheerio to parse and clean HTML
    const $ = cheerio.load(html)
    
    // Remove script and style elements
    $('script, style').remove()
    
    // Get text content and clean it
    const text = $.text()
    return this.cleanText(text)
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') return ''
    
    return text
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove Reddit formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/~~(.*?)~~/g, '$1') // Strikethrough
      .replace(/\^(.*?)\^/g, '$1') // Superscript
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Get default analysis for fallback
   */
  private getDefaultAnalysis(): AIAnalysisResult {
    const reasoning = this.quotaExceeded 
      ? 'AI analysis unavailable (quota exceeded)' 
      : 'Unable to analyze with AI'
      
    return {
      sentiment: {
        classification: 'neutral',
        confidence: 50,
        positive_score: 33,
        negative_score: 33,
        neutral_score: 34
      },
      relevancy: {
        score: 50,
        reasoning,
        keywords_matched: []
      },
      quality: {
        clarity: 50,
        coherence: 50,
        informativeness: 50,
        overall_quality: 50
      },
      engagement: {
        score: 50,
        factors: this.quotaExceeded ? ['quota-exceeded'] : [],
        discussion_potential: 50
      },
      insights: {
        key_points: this.quotaExceeded ? ['AI analysis unavailable'] : [],
        stance: 'neutral',
        tone: 'casual',
        credibility_indicators: []
      },
      contributor: {
        score: 50,
        expertise_level: 'novice',
        contribution_type: 'opinion'
      }
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export default RedditRSSService