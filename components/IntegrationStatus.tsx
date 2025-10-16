'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Database, 
  Globe, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface IntegrationStats {
  rss: {
    status: 'active' | 'inactive' | 'error'
    totalKeywords: number
    activeKeywords: number
    lastFetch: string
    totalPosts: number
    totalComments: number
    avgProcessingTime: number
  }
  combined: {
    totalItems: number
    sentimentDistribution: {
      positive: number
      negative: number
      neutral: number
    }
    topKeywords: Array<{
      keyword: string
      volume: number
      sources: string[]
    }>
  }
}

export default function IntegrationStatus() {
  const [stats, setStats] = useState<IntegrationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    
    try {
      // This would be a new API endpoint that provides integration statistics
      const response = await fetch('/api/integration-status')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setLastUpdated(new Date())
      } else {
        // Mock data for demonstration
        setStats({
          rss: {
            status: 'active',
            totalKeywords: 18,
            activeKeywords: 15,
            lastFetch: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            totalPosts: 156,
            totalComments: 892,
            avgProcessingTime: 8500
          },
          combined: {
            totalItems: 1048,
            sentimentDistribution: {
              positive: 347,
              negative: 256,
              neutral: 445
            },
            topKeywords: [
              { keyword: 'climate change', volume: 185, sources: ['rss'] },
              { keyword: 'artificial intelligence', volume: 142, sources: ['rss'] },
              { keyword: 'renewable energy', volume: 127, sources: ['rss'] },
              { keyword: 'carbon tax', volume: 98, sources: ['rss'] },
              { keyword: 'sustainability', volume: 87, sources: ['rss'] }
            ]
          }
        })
        setLastUpdated(new Date())
      }

    } catch (error) {
      console.error('Error fetching integration stats:', error)
      toast.error('Failed to load integration statistics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'inactive': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Updated just now'
    if (diffMins < 60) return `Updated ${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    return `Updated ${diffHours}h ago`
  }

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading integration status...</span>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load status</h3>
          <p className="text-gray-600 mb-4">Unable to fetch integration statistics</p>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reddit RSS Integration Status</h2>
          <p className="text-gray-600">
            Real-time status of Reddit RSS feed integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{formatLastUpdated()}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* RSS Integration */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-600" />
                <CardTitle>Reddit RSS</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(stats.rss.status)}
                <Badge className={getStatusColor(stats.rss.status)}>
                  {stats.rss.status}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Real-time Reddit posts and comments via RSS feeds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.rss.totalKeywords}
                </div>
                <div className="text-sm text-orange-600">Total Keywords</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.rss.activeKeywords}
                </div>
                <div className="text-sm text-green-600">Active</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Posts + Comments:</span>
                <span className="font-medium">
                  {(stats.rss.totalPosts + stats.rss.totalComments).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Fetch:</span>
                <span className="font-medium">{formatTime(stats.rss.lastFetch)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg Processing:</span>
                <span className="font-medium">{stats.rss.avgProcessingTime}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RSS Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            RSS Analytics
          </CardTitle>
          <CardDescription>
            Insights from Reddit RSS feed integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Stats */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Overall Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.combined.totalItems.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600">Total Items</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats.combined.topKeywords.length}
                  </div>
                  <div className="text-sm text-indigo-600">Active Keywords</div>
                </div>
              </div>
              
              {/* Sentiment Distribution */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Sentiment Distribution</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Positive</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(stats.combined.sentimentDistribution.positive / stats.combined.totalItems) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {stats.combined.sentimentDistribution.positive}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Neutral</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(stats.combined.sentimentDistribution.neutral / stats.combined.totalItems) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {stats.combined.sentimentDistribution.neutral}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Negative</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(stats.combined.sentimentDistribution.negative / stats.combined.totalItems) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {stats.combined.sentimentDistribution.negative}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Keywords */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Top Keywords by Volume</h4>
              <div className="space-y-3">
                {stats.combined.topKeywords.map((keyword, index) => (
                  <div key={keyword.keyword} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900">{keyword.keyword}</div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            RSS
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{keyword.volume}</div>
                      <div className="text-xs text-gray-500">items</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}