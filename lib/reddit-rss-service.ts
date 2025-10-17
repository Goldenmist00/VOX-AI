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
    stance: 'supporting' | 'opposing' | 'neutral' | 'questioning' | 'mixed'
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
  private requestTimeout = parseInt(process.env.REDDIT_TIMEOUT_MS || '12000') // Configurable timeout
  // Quota system removed - AI analysis always enabled when configured

  // Check if AI analysis is enabled
  private isAIAnalysisEnabled(): boolean {
    // Skip AI analysis in fast mode
    if (process.env.FAST_MODE === 'true') {
      console.log('Fast mode enabled - skipping AI analysis')
      return false
    }
    return process.env.ENABLE_AI_ANALYSIS !== 'false' && !!process.env.GEMINI_API_KEY
  }

  // NGO and Organization focused subreddits for trending topics (reduced for performance)
  private ngoRelevantSubreddits: Record<string, string[]> = {
    'climate change': ['environment', 'climatechange'],
    'social justice': ['humanrights', 'socialjustice'],
    'poverty': ['poverty', 'socialwork'],
    'health': ['publichealth', 'healthcare'],
    'education': ['education', 'teachers'],
    'disaster relief': ['news', 'disasters'],
    'human rights': ['humanrights', 'refugees'],
    'community development': ['community', 'development'],
    'technology for good': ['technology', 'socialimpact'],
    'fundraising': ['nonprofit', 'charity'],
    'policy advocacy': ['politics', 'policy'],
    'default': ['nonprofit', 'charity']
  }

  // High-priority NGO subreddits that should be highlighted
  private priorityNGOSubreddits = [
    'nonprofit', 'charity', 'volunteering', 'socialimpact', 'humanrights',
    'climatechange', 'sustainability', 'socialjustice', 'activism'
  ]

  // Trending topics that NGOs should focus on
  private trendingNGOTopics = [
    'climate action',
    'social equity',
    'community resilience',
    'digital divide',
    'food security',
    'mental health crisis',
    'refugee crisis',
    'sustainable development',
    'youth empowerment',
    'elderly care',
    'homelessness',
    'education inequality'
  ]

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
      userRole?: 'citizen' | 'ngo' | 'policymaker'
    } = {}
  ): Promise<ProcessedRedditData> {
    const {
      subreddits = this.getRelevantSubreddits(keyword, options.userRole),
      maxPosts = 5, // Reduced to 5 for quality over quantity
      includeComments = true,
      maxCommentsPerPost = 3, // Reduced to 3 comments per post
      userRole = 'citizen'
    } = options

    console.log(`Fetching Reddit data for keyword: "${keyword}" from ${subreddits.length} subreddits`)

    const allPosts: RedditPost[] = []
    const allComments: RedditComment[] = []

    // Fetch posts from each subreddit
    for (const subreddit of subreddits) {
      try {
        const posts = await this.fetchPostsFromSubreddit(keyword, subreddit, Math.ceil(maxPosts / subreddits.length))
        allPosts.push(...posts)

        // Fetch comments only from the top post for performance
        if (includeComments && posts.length > 0) {
          const topPost = posts[0] // Only process the top post
          try {
            const comments = await this.fetchCommentsFromPost(topPost, Math.min(2, maxCommentsPerPost))
            allComments.push(...comments)
          } catch (error) {
            console.error(`Error fetching comments for post ${topPost.id}:`, error)
          }
        }

        // Very short delay between subreddit fetches
        await this.delay(100)
      } catch (error) {
        console.error(`Error fetching from r/${subreddit}:`, error)
      }
    }

    console.log(`Fetched ${allPosts.length} posts and ${allComments.length} comments`)

    // Filter content based on user role
    const filteredPosts = this.filterPostsByUserRole(allPosts, keyword, userRole)
    const filteredComments = this.filterCommentsByUserRole(allComments, keyword, userRole)

    console.log(`Filtered to ${filteredPosts.length} NGO-relevant posts and ${filteredComments.length} comments`)

    // Analyze with Gemini AI
    let analyzedPosts: Array<RedditPost & { analysis: AIAnalysisResult }>
    let analyzedComments: Array<RedditComment & { analysis: AIAnalysisResult }>

    const totalItems = filteredPosts.length + filteredComments.length
    const aiEnabled = this.isAIAnalysisEnabled()

    if (!aiEnabled) {
      console.log(`Skipping AI analysis (enabled: ${aiEnabled}, items: ${totalItems}, API key: ${!!process.env.GEMINI_API_KEY})`)
      analyzedPosts = filteredPosts.map(post => ({ ...post, analysis: this.getDefaultAnalysis() }))
      analyzedComments = filteredComments.map(comment => ({ ...comment, analysis: this.getDefaultAnalysis() }))
    } else {
      console.log(`Running AI analysis on ${totalItems} items (${filteredPosts.length} posts, ${filteredComments.length} comments)`)

      // Add timeout for AI analysis to prevent hanging
      const analysisPromise = Promise.all([
        this.analyzeContent(filteredPosts, keyword, 'post'),
        this.analyzeContent(filteredComments, keyword, 'comment')
      ])

      const analysisTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout')), 90000) // 90 second timeout for AI analysis
      })

      try {
        const [posts, comments] = await Promise.race([analysisPromise, analysisTimeout])
        analyzedPosts = posts
        analyzedComments = comments
      } catch (error) {
        console.warn('AI analysis timed out, using fallback analysis')
        analyzedPosts = filteredPosts.map(post => ({ ...post, analysis: this.getDefaultAnalysis() }))
        analyzedComments = filteredComments.map(comment => ({ ...comment, analysis: this.getDefaultAnalysis() }))
      }
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

    // Process all items with AI analysis when enabled

    const batchSize = 3 // Slightly larger batches for better performance

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

        // Minimal delay between batches
        if (i + batchSize < items.length) {
          await this.delay(500) // Much shorter delay for speed
        }
      } catch (error: any) {
        console.error(`Batch analysis failed for batch starting at ${i}:`, error)

        // Check if it's a quota error
        if (error?.status === 429 || error?.message?.includes('Too Many Requests')) {
          console.warn('Rate limited during batch processing, will retry with delay')
          // Add delay and continue processing
          await new Promise(resolve => setTimeout(resolve, 2000))
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
      // Process AI analysis for all items when enabled

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
      // Add comprehensive safety checks for undefined properties
      if (!analysis) {
        console.warn('No analysis returned from Gemini service, using fallback')
        return this.getDefaultAnalysis()
      }

      const safeSentiment = analysis.sentiment || {}
      const safeScores = analysis.scores || {}
      const safeInsights = analysis.insights || {}
      const safeAnalysisData = analysis.analysis || {}
      const safeClassification = analysis.classification || {}

      return {
        sentiment: {
          classification: (safeSentiment.overall || 'neutral') as 'positive' | 'negative' | 'neutral',
          confidence: Math.min(100, Math.max(0, safeSentiment.confidence || 50)),
          positive_score: Math.min(100, Math.max(0, safeSentiment.positive_score || 33)),
          negative_score: Math.min(100, Math.max(0, safeSentiment.negative_score || 33)),
          neutral_score: Math.min(100, Math.max(0, safeSentiment.neutral_score || 34))
        },
        relevancy: {
          score: Math.min(100, Math.max(0, safeScores.overall_score || 50)),
          reasoning: 'Analyzed with Gemini AI',
          keywords_matched: Array.isArray(safeInsights.key_points) ? safeInsights.key_points : []
        },
        quality: {
          clarity: Math.min(100, Math.max(0, safeAnalysisData.clarity || 50)),
          coherence: Math.min(100, Math.max(0, safeAnalysisData.relevance || 50)),
          informativeness: Math.min(100, Math.max(0, safeAnalysisData.evidence_quality || 50)),
          overall_quality: Math.min(100, Math.max(0, safeScores.overall_score || 50))
        },
        engagement: {
          score: Math.min(100, Math.max(0, safeScores.contribution_quality || 50)),
          factors: Array.isArray(safeInsights.key_points) && safeInsights.key_points.length > 0 ? ['informative'] : ['basic'],
          discussion_potential: Math.min(100, Math.max(0, safeScores.debate_value || 50))
        },
        insights: {
          key_points: Array.isArray(safeInsights.key_points) ? safeInsights.key_points : ['User perspective'],
          stance: (safeClassification.stance || 'neutral') as 'supporting' | 'opposing' | 'neutral' | 'questioning' | 'mixed',
          tone: (safeClassification.tone || 'casual') as 'formal' | 'casual' | 'emotional' | 'analytical',
          credibility_indicators: Array.isArray(safeInsights.strengths) ? safeInsights.strengths : []
        },
        contributor: {
          score: Math.min(100, Math.max(0, safeScores.overall_score || 50)),
          expertise_level: (safeScores.overall_score || 50) > 80 ? 'expert' as const :
            (safeScores.overall_score || 50) > 60 ? 'intermediate' as const : 'novice' as const,
          contribution_type: (safeAnalysisData.evidence_quality || 50) > 70 ? 'fact' as const : 'opinion' as const
        }
      }
    } catch (error: any) {
      // Handle rate limiting with retry logic
      if (error?.status === 429 || error?.message?.includes('Too Many Requests')) {
        console.warn('Gemini API rate limited, using fallback analysis for this item')
      } else if (error?.message?.includes('timeout')) {
        console.warn('Gemini API timeout, using fallback analysis for this item')
      } else {
        console.error('Error analyzing with centralized Gemini:', error?.message || error)
      }

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
   * Get relevant subreddits for a keyword based on user role
   */
  private getRelevantSubreddits(keyword: string, userRole: 'citizen' | 'ngo' | 'policymaker' = 'citizen'): string[] {
    const lowerKeyword = keyword.toLowerCase()

    // For citizens, use broader, more general subreddits
    if (userRole === 'citizen') {
      console.log(`👤 Citizen user - using general subreddits for keyword: "${keyword}"`)
      return this.getGeneralSubreddits(keyword)
    }

    // For NGOs and Policymakers, use NGO-focused subreddits
    console.log(`🏢 ${userRole.toUpperCase()} user - using NGO-focused subreddits for keyword: "${keyword}"`)

    // First, check if keyword matches trending NGO topics
    const matchingTrendingTopic = this.trendingNGOTopics.find(topic =>
      lowerKeyword.includes(topic.toLowerCase()) || topic.toLowerCase().includes(lowerKeyword)
    )

    if (matchingTrendingTopic) {
      console.log(`🔥 Trending NGO topic detected: "${matchingTrendingTopic}" for keyword: "${keyword}"`)
    }

    // Check for specific NGO-relevant topic matches
    for (const [topic, subreddits] of Object.entries(this.ngoRelevantSubreddits)) {
      if (lowerKeyword.includes(topic) || topic.includes(lowerKeyword)) {
        console.log(`📋 NGO topic match: "${topic}" for keyword: "${keyword}"`)
        return subreddits
      }
    }

    // For general keywords, prioritize NGO-focused subreddits
    console.log(`🎯 Using default NGO-focused subreddits for keyword: "${keyword}"`)
    return this.ngoRelevantSubreddits.default
  }

  /**
   * Get general subreddits for citizens (broader topics)
   */
  private getGeneralSubreddits(keyword: string): string[] {
    const lowerKeyword = keyword.toLowerCase()

    // General topic mapping for citizens (reduced for performance)
    const generalTopics: Record<string, string[]> = {
      'climate change': ['science', 'environment'],
      'artificial intelligence': ['artificial', 'technology'],
      'technology': ['technology', 'science'],
      'health': ['science', 'medicine'],
      'education': ['education', 'science'],
      'politics': ['politics', 'news'],
      'economics': ['economics', 'business'],
      'social issues': ['news', 'worldnews'],
      'default': ['news', 'science']
    }

    // Check for specific topic matches
    for (const [topic, subreddits] of Object.entries(generalTopics)) {
      if (lowerKeyword.includes(topic) || topic.includes(lowerKeyword)) {
        console.log(`📋 General topic match: "${topic}" for keyword: "${keyword}"`)
        return subreddits
      }
    }

    // Default general subreddits
    return generalTopics.default
  }

  /**
   * Filter posts based on user role
   */
  private filterPostsByUserRole(posts: RedditPost[], keyword: string, userRole: 'citizen' | 'ngo' | 'policymaker'): Array<RedditPost & { ngoRelevant?: boolean; ngoPriority?: boolean }> {
    if (userRole === 'citizen') {
      // For citizens, use lighter filtering - focus on quality and engagement
      return posts
        .filter(post => {
          // Basic quality filters
          return post.title.length > 10 && (post.content?.length || 0) > 20
        })
        .sort((a, b) => {
          // Sort by Reddit score and recency
          const aScore = (a.score || 0) + (this.isKeywordRelevant(a.title, a.content || '', keyword) ? 10 : 0)
          const bScore = (b.score || 0) + (this.isKeywordRelevant(b.title, b.content || '', keyword) ? 10 : 0)
          return bScore - aScore
        })
        .slice(0, 5) // Limit to 5 posts for performance
        .map(post => ({ ...post, ngoRelevant: false, ngoPriority: false }))
    }

    // For NGOs and Policymakers, use NGO-focused filtering
    return this.filterForNGORelevance(posts, keyword)
  }

  /**
   * Filter comments based on user role
   */
  private filterCommentsByUserRole(comments: RedditComment[], keyword: string, userRole: 'citizen' | 'ngo' | 'policymaker'): RedditComment[] {
    if (userRole === 'citizen') {
      // For citizens, use lighter filtering
      return comments
        .filter(comment => {
          // Basic quality filters
          return comment.content.length > 30 && comment.content.length < 2000
        })
        .sort((a, b) => {
          // Sort by Reddit score and keyword relevance
          const aScore = (a.score || 0) + (this.isKeywordRelevant('', a.content, keyword) ? 5 : 0)
          const bScore = (b.score || 0) + (this.isKeywordRelevant('', b.content, keyword) ? 5 : 0)
          return bScore - aScore
        })
        .slice(0, 10) // Limit to 10 comments for performance
    }

    // For NGOs and Policymakers, use NGO-focused filtering
    return this.filterCommentsForNGORelevance(comments, keyword)
  }

  /**
   * Check if content contains keyword (simple relevance check)
   */
  private isKeywordRelevant(title: string, content: string, keyword: string): boolean {
    const combinedText = `${title} ${content}`.toLowerCase()
    const keywordLower = keyword.toLowerCase()

    return combinedText.includes(keywordLower) ||
      keywordLower.split(' ').some(word => combinedText.includes(word))
  }

  /**
   * Check if content is relevant to NGOs and organizations
   */
  private isNGORelevant(content: string, title: string): boolean {
    const combinedText = `${title} ${content}`.toLowerCase()

    const ngoKeywords = [
      'nonprofit', 'charity', 'volunteer', 'donation', 'fundraising',
      'community', 'social impact', 'advocacy', 'awareness', 'campaign',
      'humanitarian', 'relief', 'aid', 'support', 'help', 'assistance',
      'crisis', 'emergency', 'disaster', 'poverty', 'inequality',
      'justice', 'rights', 'policy', 'reform', 'change', 'action',
      'sustainable', 'environment', 'climate', 'health', 'education',
      'development', 'empowerment', 'inclusion', 'accessibility'
    ]

    const relevanceScore = ngoKeywords.filter(keyword =>
      combinedText.includes(keyword)
    ).length

    return relevanceScore >= 2 // At least 2 NGO-relevant keywords
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
    const reasoning = 'Using fallback analysis'

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
        factors: [],
        discussion_potential: 50
      },
      insights: {
        key_points: [],
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
   * Filter posts for NGO relevance and trending topics
   */
  private filterForNGORelevance(posts: RedditPost[], keyword: string): Array<RedditPost & { ngoRelevant?: boolean; ngoPriority?: boolean }> {
    return posts
      .filter(post => {
        // Check if post is relevant to NGOs
        const isRelevant = this.isNGORelevant(post.content || '', post.title)

        // Check if it's a trending topic
        const isTrending = this.isTrendingTopic(post.title, post.content || '', keyword)

        return isRelevant || isTrending
      })
      .map(post => ({
        ...post,
        ngoRelevant: this.isNGORelevant(post.content || '', post.title),
        ngoPriority: this.priorityNGOSubreddits.includes(post.subreddit.toLowerCase())
      }))
      .sort((a, b) => {
        // Prioritize NGO priority subreddits, then trending topics and higher scores
        const aPriorityBonus = a.ngoPriority ? 100 : 0
        const bPriorityBonus = b.ngoPriority ? 100 : 0
        const aScore = this.calculateNGORelevanceScore(a.title, a.content || '', keyword) + aPriorityBonus
        const bScore = this.calculateNGORelevanceScore(b.title, b.content || '', keyword) + bPriorityBonus
        return bScore - aScore
      })
      .slice(0, 5) // Limit to top 5 most relevant posts for performance
  }

  /**
   * Filter comments for NGO relevance
   */
  private filterCommentsForNGORelevance(comments: RedditComment[], keyword: string): RedditComment[] {
    return comments
      .filter(comment => {
        // Filter out very short comments (less than 50 characters)
        if (comment.content.length < 50) return false

        // Check NGO relevance
        const isRelevant = this.isNGORelevant(comment.content, '')
        const isTrending = this.isTrendingTopic('', comment.content, keyword)

        return isRelevant || isTrending
      })
      .sort((a, b) => {
        // Sort by score and relevance
        const aScore = (a.score || 0) + this.calculateNGORelevanceScore('', a.content, keyword)
        const bScore = (b.score || 0) + this.calculateNGORelevanceScore('', b.content, keyword)
        return bScore - aScore
      })
      .slice(0, 10) // Limit to top 10 most relevant comments for performance
  }

  /**
   * Check if content relates to trending topics for NGOs
   */
  private isTrendingTopic(title: string, content: string, keyword: string): boolean {
    const combinedText = `${title} ${content} ${keyword}`.toLowerCase()

    return this.trendingNGOTopics.some(topic =>
      combinedText.includes(topic.toLowerCase()) ||
      topic.toLowerCase().split(' ').every(word => combinedText.includes(word))
    )
  }

  /**
   * Calculate NGO relevance score for prioritization
   */
  private calculateNGORelevanceScore(title: string, content: string, keyword: string): number {
    const combinedText = `${title} ${content}`.toLowerCase()
    let score = 0

    // Base relevance keywords
    const ngoKeywords = [
      'nonprofit', 'charity', 'volunteer', 'donation', 'fundraising',
      'community', 'social impact', 'advocacy', 'awareness', 'campaign',
      'humanitarian', 'relief', 'aid', 'support', 'help', 'assistance'
    ]

    // Trending topic keywords (higher weight)
    const trendingKeywords = [
      'climate', 'sustainability', 'inequality', 'justice', 'crisis',
      'emergency', 'disaster', 'poverty', 'health', 'education',
      'development', 'empowerment', 'inclusion', 'accessibility'
    ]

    // Count NGO keywords (1 point each)
    ngoKeywords.forEach(kw => {
      if (combinedText.includes(kw)) score += 1
    })

    // Count trending keywords (2 points each)
    trendingKeywords.forEach(kw => {
      if (combinedText.includes(kw)) score += 2
    })

    // Bonus for trending NGO topics (5 points)
    if (this.isTrendingTopic(title, content, keyword)) {
      score += 5
    }

    // Bonus for keyword match (3 points)
    if (combinedText.includes(keyword.toLowerCase())) {
      score += 3
    }

    return score
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export default RedditRSSService