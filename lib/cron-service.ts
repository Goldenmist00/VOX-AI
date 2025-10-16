import RedditRSSIntegration from './reddit-rss-integration'
import connectDB from './mongodb'

export class CronService {
  private rssIntegration: RedditRSSIntegration
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.rssIntegration = new RedditRSSIntegration()
  }

  /**
   * Start the cron service with 30-minute intervals
   */
  start(): void {
    if (this.isRunning) {
      console.log('Cron service is already running')
      return
    }

    console.log('Starting Reddit RSS cron service...')
    this.isRunning = true

    // Run immediately on start
    this.runScheduledFetch()

    // Set up 30-minute interval (30 * 60 * 1000 ms)
    this.intervalId = setInterval(() => {
      this.runScheduledFetch()
    }, 30 * 60 * 1000)

    console.log('Cron service started - will run every 30 minutes')
  }

  /**
   * Stop the cron service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Cron service is not running')
      return
    }

    console.log('Stopping Reddit RSS cron service...')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('Cron service stopped')
  }

  /**
   * Get cron service status
   */
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? new Date(Date.now() + 30 * 60 * 1000) : undefined
    }
  }

  /**
   * Run scheduled fetch manually
   */
  async runScheduledFetch(): Promise<void> {
    if (!this.isRunning) {
      console.log('Cron service is not running, skipping scheduled fetch')
      return
    }

    try {
      console.log('Running scheduled Reddit RSS fetch...')
      const startTime = Date.now()

      await connectDB()

      // Fetch scheduled keywords using RSS integration only
      const rssResults = await this.fetchScheduledKeywordsRSS()
      
      const totalProcessed = rssResults.reduce((sum, result) => sum + (result.totalStored || 0), 0)
      const totalErrors = rssResults.reduce((sum, result) => sum + result.errors.length, 0)
      const processingTime = Date.now() - startTime

      console.log(`Scheduled RSS fetch completed:`)
      console.log(`- RSS keywords processed: ${rssResults.length}`)
      console.log(`- Total items stored: ${totalProcessed}`)
      console.log(`- Errors: ${totalErrors}`)
      console.log(`- Processing time: ${processingTime}ms`)

      // Log any errors
      if (totalErrors > 0) {
        console.log('Errors encountered:')
        rssResults.forEach(result => {
          if (result.errors.length > 0) {
            console.log(`- ${result.keyword}: ${result.errors.join(', ')}`)
          }
        })
      }

    } catch (error) {
      console.error('Error in scheduled fetch:', error)
    }
  }

  /**
   * Add a new keyword for scheduled fetching
   */
  async addKeywordForScheduling(
    keyword: string, 
    options: {
      fetchInterval?: number // hours
      autoFetch?: boolean
      subreddits?: string[]
    } = {}
  ): Promise<boolean> {
    try {
      await connectDB()
      
      const Keyword = (await import('@/models/Keyword')).default
      
      // Check if keyword already exists
      let keywordRecord = await Keyword.findOne({ keyword: keyword.toLowerCase() })
      
      if (keywordRecord) {
        // Update existing keyword
        keywordRecord.autoFetch = options.autoFetch !== false
        keywordRecord.fetchInterval = options.fetchInterval || 24
        keywordRecord.isActive = true
        
        // Set data source to RSS only
        keywordRecord.dataSources = ['rss']
        
        if (keywordRecord.autoFetch) {
          keywordRecord.nextScheduledFetch = new Date(
            Date.now() + (keywordRecord.fetchInterval * 60 * 60 * 1000)
          )
        }
        
        await keywordRecord.save()
        console.log(`Updated keyword for scheduling: ${keyword}`)
      } else {
        // Create new keyword
        keywordRecord = new Keyword({
          keyword: keyword.toLowerCase(),
          autoFetch: options.autoFetch !== false,
          fetchInterval: options.fetchInterval || 24,
          isActive: true,
          fetchStatus: 'pending',
          dataSources: ['rss'] // RSS only
        })
        
        await keywordRecord.save()
        console.log(`Added new keyword for scheduling: ${keyword}`)
      }

      return true
    } catch (error) {
      console.error(`Error adding keyword for scheduling: ${keyword}`, error)
      return false
    }
  }

  /**
   * Remove a keyword from scheduled fetching
   */
  async removeKeywordFromScheduling(keyword: string): Promise<boolean> {
    try {
      await connectDB()
      
      const Keyword = (await import('@/models/Keyword')).default
      
      const keywordRecord = await Keyword.findOne({ keyword: keyword.toLowerCase() })
      
      if (keywordRecord) {
        keywordRecord.autoFetch = false
        keywordRecord.isActive = false
        keywordRecord.nextScheduledFetch = undefined
        
        await keywordRecord.save()
        console.log(`Removed keyword from scheduling: ${keyword}`)
        return true
      } else {
        console.log(`Keyword not found for removal: ${keyword}`)
        return false
      }
    } catch (error) {
      console.error(`Error removing keyword from scheduling: ${keyword}`, error)
      return false
    }
  }

  /**
   * Get list of scheduled keywords
   */
  async getScheduledKeywords(): Promise<any[]> {
    try {
      await connectDB()
      
      const Keyword = (await import('@/models/Keyword')).default
      
      return await Keyword.find({
        isActive: true,
        autoFetch: true
      })
      .sort({ nextScheduledFetch: 1 })
      .select('keyword fetchInterval nextScheduledFetch lastFetched fetchStatus volume sentiment')
      
    } catch (error) {
      console.error('Error getting scheduled keywords:', error)
      return []
    }
  }

  /**
   * Fetch scheduled keywords using RSS integration
   */
  async fetchScheduledKeywordsRSS(): Promise<any[]> {
    try {
      await connectDB()
      
      const Keyword = (await import('@/models/Keyword')).default
      
      // Get keywords due for RSS fetch
      const dueKeywords = await Keyword.find({
        isActive: true,
        autoFetch: true,
        fetchStatus: { $ne: 'processing' },
        $or: [
          { nextScheduledFetch: { $lte: new Date() } },
          { nextScheduledFetch: { $exists: false } }
        ]
      })
      .sort({ lastFetched: 1 })
      .limit(5) // Increased limit since we only have RSS now

      console.log(`Found ${dueKeywords.length} keywords due for RSS fetch`)

      if (dueKeywords.length === 0) {
        return []
      }

      const results = []
      
      for (const keywordDoc of dueKeywords) {
        try {
          console.log(`RSS fetching keyword: ${keywordDoc.keyword}`)
          
          const result = await this.rssIntegration.fetchRedditRSSData({
            keyword: keywordDoc.keyword,
            maxPosts: 10, // Smaller limit for scheduled fetches
            includeComments: true,
            maxCommentsPerPost: 5,
            forceRefresh: false // Don't force refresh in scheduled runs
          })
          
          results.push({
            keyword: result.keyword,
            totalStored: result.totalStored,
            errors: result.errors,
            success: result.success,
            processingTime: result.processingTime,
            source: 'RSS'
          })
          
          // Delay between RSS fetches to be respectful
          await new Promise(resolve => setTimeout(resolve, 3000))
          
        } catch (error) {
          console.error(`RSS fetch failed for keyword ${keywordDoc.keyword}:`, error)
          results.push({
            keyword: keywordDoc.keyword,
            totalStored: 0,
            errors: [error instanceof Error ? error.message : String(error)],
            success: false,
            processingTime: 0,
            source: 'RSS'
          })
        }
      }

      return results
      
    } catch (error) {
      console.error('Error in RSS scheduled fetch:', error)
      return []
    }
  }

  /**
   * Update fetch interval for a keyword
   */
  async updateFetchInterval(keyword: string, intervalHours: number): Promise<boolean> {
    try {
      if (intervalHours < 1 || intervalHours > 168) {
        throw new Error('Fetch interval must be between 1 and 168 hours')
      }

      await connectDB()
      
      const Keyword = (await import('@/models/Keyword')).default
      
      const keywordRecord = await Keyword.findOne({ keyword: keyword.toLowerCase() })
      
      if (keywordRecord) {
        keywordRecord.fetchInterval = intervalHours
        
        if (keywordRecord.autoFetch) {
          keywordRecord.nextScheduledFetch = new Date(
            Date.now() + (intervalHours * 60 * 60 * 1000)
          )
        }
        
        await keywordRecord.save()
        console.log(`Updated fetch interval for ${keyword}: ${intervalHours} hours`)
        return true
      } else {
        console.log(`Keyword not found: ${keyword}`)
        return false
      }
    } catch (error) {
      console.error(`Error updating fetch interval for ${keyword}:`, error)
      return false
    }
  }
}

// Singleton instance
let cronServiceInstance: CronService | null = null

export function getCronService(): CronService {
  if (!cronServiceInstance) {
    cronServiceInstance = new CronService()
  }
  return cronServiceInstance
}

// Auto-start in production
if (process.env.NODE_ENV === 'production' && process.env.AUTO_START_CRON === 'true') {
  const cronService = getCronService()
  cronService.start()
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, stopping cron service...')
    cronService.stop()
  })
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, stopping cron service...')
    cronService.stop()
  })
}

export default CronService