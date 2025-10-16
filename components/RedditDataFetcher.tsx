'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, TrendingUp, MessageSquare, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'

interface RedditFetchResult {
  success: boolean
  data?: {
    keyword: string
    totalPosts: number
    totalComments: number
    totalStored: number
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
  message?: string
  error?: string
}

interface RedditDataFetcherProps {
  onDataFetched?: (result: RedditFetchResult) => void
}

export default function RedditDataFetcher({ onDataFetched }: RedditDataFetcherProps) {
  const [keyword, setKeyword] = useState('')
  const [subreddits, setSubreddits] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<RedditFetchResult | null>(null)
  const [advancedOptions, setAdvancedOptions] = useState(false)
  const [maxPosts, setMaxPosts] = useState(20)
  const [includeComments, setIncludeComments] = useState(true)
  const [maxCommentsPerPost, setMaxCommentsPerPost] = useState(10)
  const [forceRefresh, setForceRefresh] = useState(false)

  const handleFetch = async () => {
    if (!keyword.trim()) {
      toast.error('Please enter a keyword to search for')
      return
    }

    setIsLoading(true)
    
    try {
      const requestBody = {
        keyword: keyword.trim(),
        subreddits: subreddits
          ? subreddits.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : undefined,
        maxPosts,
        includeComments,
        maxCommentsPerPost,
        forceRefresh
      }

      console.log('Fetching Reddit data with:', requestBody)

      const response = await fetch('/api/reddit-rss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result: RedditFetchResult = await response.json()

      if (result.success) {
        toast.success(result.message || 'Reddit data fetched successfully!')
        setLastResult(result)
        onDataFetched?.(result)
      } else {
        toast.error(result.error || 'Failed to fetch Reddit data')
        setLastResult(result)
      }

    } catch (error) {
      console.error('Error fetching Reddit data:', error)
      toast.error('Network error occurred while fetching data')
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200'
      case 'negative': return 'bg-red-100 text-red-800 border-red-200'
      case 'neutral': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Fetch Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Fetch Reddit Data
          </CardTitle>
          <CardDescription>
            Search Reddit posts and comments using RSS feeds for real-time sentiment analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Keyword *</label>
              <Input
                placeholder="e.g., climate change, AI, politics"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subreddits (optional)</label>
              <Input
                placeholder="e.g., science, technology, politics"
                value={subreddits}
                onChange={(e) => setSubreddits(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Comma-separated list. Leave empty to search all subreddits.
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdvancedOptions(!advancedOptions)}
              className="text-sm"
            >
              {advancedOptions ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {advancedOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Posts</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxPosts}
                    onChange={(e) => setMaxPosts(parseInt(e.target.value) || 20)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Comments/Post</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={maxCommentsPerPost}
                    onChange={(e) => setMaxCommentsPerPost(parseInt(e.target.value) || 10)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={includeComments}
                      onChange={(e) => setIncludeComments(e.target.checked)}
                      disabled={isLoading}
                    />
                    Include Comments
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={forceRefresh}
                      onChange={(e) => setForceRefresh(e.target.checked)}
                      disabled={isLoading}
                    />
                    Force Refresh
                  </label>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleFetch} 
            disabled={isLoading || !keyword.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Reddit Data...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Fetch Reddit Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fetch Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult.success && lastResult.data ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {lastResult.data.totalPosts}
                    </div>
                    <div className="text-sm text-blue-600">Posts</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {lastResult.data.totalComments}
                    </div>
                    <div className="text-sm text-green-600">Comments</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {lastResult.data.totalStored}
                    </div>
                    <div className="text-sm text-purple-600">Stored</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(lastResult.data.processingTime / 1000)}s
                    </div>
                    <div className="text-sm text-orange-600">Processing</div>
                  </div>
                </div>

                {/* Sentiment Analysis */}
                <div>
                  <h4 className="font-medium mb-3">Sentiment Distribution</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getSentimentColor('positive')}>
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Positive: {lastResult.data.statistics.sentiment.positive}
                    </Badge>
                    <Badge className={getSentimentColor('neutral')}>
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Neutral: {lastResult.data.statistics.sentiment.neutral}
                    </Badge>
                    <Badge className={getSentimentColor('negative')}>
                      Negative: {lastResult.data.statistics.sentiment.negative}
                    </Badge>
                  </div>
                </div>

                {/* Top Subreddits */}
                {lastResult.data.statistics.topSubreddits.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Top Subreddits</h4>
                    <div className="flex flex-wrap gap-2">
                      {lastResult.data.statistics.topSubreddits.slice(0, 5).map((sub, index) => (
                        <Badge key={index} variant="outline">
                          r/{sub.name} ({sub.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  Keyword: <span className="font-medium">"{lastResult.data.keyword}"</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                {lastResult.error || 'Failed to fetch Reddit data'}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}