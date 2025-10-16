'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Flame, MessageSquare, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'

interface TrendingKeyword {
  _id: string
  keyword: string
  volume: number
  sentiment: {
    positive: number
    negative: number
    neutral: number
    totalComments: number
  }
  totalItems: number
  recentActivity: number
  trending: boolean
}

interface TrendingKeywordsProps {
  onKeywordSelect?: (keyword: string) => void
  limit?: number
}

export default function TrendingKeywords({ onKeywordSelect, limit = 10 }: TrendingKeywordsProps) {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchTrendingKeywords = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/reddit-rss?action=trending&limit=${limit}`)
      const result = await response.json()

      if (result.success) {
        setKeywords(result.data || [])
        setLastUpdated(new Date())
      } else {
        toast.error('Failed to fetch trending keywords')
        setKeywords([])
      }

    } catch (error) {
      console.error('Error fetching trending keywords:', error)
      toast.error('Network error occurred while fetching trending keywords')
      setKeywords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingKeywords()
  }, [limit])

  const getSentimentColor = (sentiment: any) => {
    const total = sentiment.positive + sentiment.negative + sentiment.neutral
    if (total === 0) return 'bg-gray-100 text-gray-800'
    
    const positiveRatio = sentiment.positive / total
    const negativeRatio = sentiment.negative / total
    
    if (positiveRatio > 0.5) return 'bg-green-100 text-green-800'
    if (negativeRatio > 0.5) return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getSentimentLabel = (sentiment: any) => {
    const total = sentiment.positive + sentiment.negative + sentiment.neutral
    if (total === 0) return 'Unknown'
    
    const positiveRatio = sentiment.positive / total
    const negativeRatio = sentiment.negative / total
    
    if (positiveRatio > 0.5) return 'Positive'
    if (negativeRatio > 0.5) return 'Negative'
    return 'Neutral'
  }

  const getActivityLevel = (recentActivity: number) => {
    if (recentActivity >= 20) return { label: 'Very High', color: 'text-red-600' }
    if (recentActivity >= 10) return { label: 'High', color: 'text-orange-600' }
    if (recentActivity >= 5) return { label: 'Medium', color: 'text-yellow-600' }
    if (recentActivity >= 1) return { label: 'Low', color: 'text-blue-600' }
    return { label: 'Inactive', color: 'text-gray-600' }
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Keywords
            </CardTitle>
            <CardDescription>
              Most active keywords based on recent Reddit activity
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrendingKeywords}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {keywords.length > 0 ? (
          <div className="space-y-3">
            {keywords.map((keyword, index) => {
              const activity = getActivityLevel(keyword.recentActivity)
              const sentiment = getSentimentLabel(keyword.sentiment)
              const sentimentColor = getSentimentColor(keyword.sentiment)
              
              return (
                <div
                  key={keyword._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onKeywordSelect?.(keyword.keyword)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      {keyword.trending && (
                        <Flame className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900">
                        {keyword.keyword}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="h-3 w-3" />
                        {keyword.totalItems} items
                        <span className="text-gray-400">•</span>
                        <span className={activity.color}>
                          {activity.label} activity
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={sentimentColor}>
                      {sentiment}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onKeywordSelect?.(keyword.keyword)
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Loading trending keywords...
              </div>
            ) : (
              <div className="text-gray-600">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No trending keywords found</p>
                <p className="text-sm">Fetch some Reddit data to see trends</p>
              </div>
            )}
          </div>
        )}
        
        {lastUpdated && (
          <div className="text-xs text-gray-500 text-center mt-4 pt-4 border-t">
            Last updated: {formatLastUpdated()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}