'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, 
  ExternalLink, 
  User, 
  Calendar, 
  TrendingUp, 
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface RedditItem {
  _id: string
  type: 'post' | 'comment'
  redditId: string
  title?: string
  content?: string
  author: string
  subreddit: string
  link?: string
  permalink: string
  redditScore: number
  keyword: string
  analysis: {
    sentiment: {
      classification: 'positive' | 'negative' | 'neutral'
      confidence: number
    }
    relevancy: {
      score: number
      reasoning: string
    }
    quality: {
      overall_quality: number
    }
    engagement: {
      score: number
    }
    insights: {
      key_points: string[]
      stance: string
      tone: string
    }
  }
  weightedScore: number
  createdAt: string
}

interface RedditDataResponse {
  success: boolean
  data?: {
    items: RedditItem[]
    pagination: {
      currentPage: number
      totalCount: number
      hasNextPage: boolean
      hasPrevPage: boolean
      limit: number
    }
    statistics: {
      totalPosts: number
      totalComments: number
      totalItems: number
      sentiment: {
        positive: number
        negative: number
        neutral: number
      }
      topSubreddits: Array<{ name: string; count: number }>
    }
  }
  error?: string
}

interface RedditDataViewerProps {
  keyword?: string
}

export default function RedditDataViewer({ keyword: initialKeyword }: RedditDataViewerProps) {
  const [keyword, setKeyword] = useState(initialKeyword || '')
  const [data, setData] = useState<RedditDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: 'both' as 'posts' | 'comments' | 'both',
    sentiment: '' as '' | 'positive' | 'negative' | 'neutral',
    subreddit: '',
    sortBy: 'weightedScore' as 'weightedScore' | 'createdAt' | 'redditScore',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (page = 1) => {
    if (!keyword.trim()) {
      toast.error('Please enter a keyword to search for')
      return
    }

    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        action: 'data',
        keyword: keyword.trim(),
        type: filters.type,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: page.toString(),
        limit: '20'
      })

      if (filters.sentiment) {
        params.append('sentiment', filters.sentiment)
      }
      if (filters.subreddit) {
        params.append('subreddit', filters.subreddit)
      }

      const response = await fetch(`/api/reddit-rss?${params}`)
      const result: RedditDataResponse = await response.json()

      if (result.success) {
        setData(result)
        setCurrentPage(page)
      } else {
        toast.error(result.error || 'Failed to fetch Reddit data')
        setData(null)
      }

    } catch (error) {
      console.error('Error fetching Reddit data:', error)
      toast.error('Network error occurred while fetching data')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initialKeyword) {
      fetchData(1)
    }
  }, [initialKeyword])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(1)
  }

  const handlePageChange = (newPage: number) => {
    fetchData(newPage)
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200'
      case 'negative': return 'bg-red-100 text-red-800 border-red-200'
      case 'neutral': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Reddit Data Viewer
          </CardTitle>
          <CardDescription>
            View and analyze fetched Reddit posts and comments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter keyword to search..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select value={filters.type} onValueChange={(value: any) => setFilters({...filters, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="posts">Posts Only</SelectItem>
                <SelectItem value="comments">Comments Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sentiment || "all"} onValueChange={(value) => setFilters({...filters, sentiment: value === "all" ? "" : value as any})}>
              <SelectTrigger>
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Subreddit filter"
              value={filters.subreddit}
              onChange={(e) => setFilters({...filters, subreddit: e.target.value})}
            />

            <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({...filters, sortBy: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weightedScore">AI Score</SelectItem>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="redditScore">Reddit Score</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortOrder} onValueChange={(value: any) => setFilters({...filters, sortOrder: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => fetchData(1)} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      {data?.success && data.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.data.statistics.totalPosts}
                </div>
                <div className="text-sm text-blue-600">Posts</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.data.statistics.totalComments}
                </div>
                <div className="text-sm text-green-600">Comments</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {data.data.statistics.totalItems}
                </div>
                <div className="text-sm text-purple-600">Total Items</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {data.data.statistics.topSubreddits.length}
                </div>
                <div className="text-sm text-orange-600">Subreddits</div>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getSentimentColor('positive')}>
                Positive: {data.data.statistics.sentiment.positive}
              </Badge>
              <Badge className={getSentimentColor('neutral')}>
                Neutral: {data.data.statistics.sentiment.neutral}
              </Badge>
              <Badge className={getSentimentColor('negative')}>
                Negative: {data.data.statistics.sentiment.negative}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Items */}
      {data?.success && data.data && (
        <div className="space-y-4">
          {data.data.items.map((item) => (
            <Card key={item._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.type === 'post' ? 'default' : 'secondary'}>
                      {item.type === 'post' ? 'Post' : 'Comment'}
                    </Badge>
                    <Badge className={getSentimentColor(item.analysis.sentiment.classification)}>
                      {item.analysis.sentiment.classification}
                    </Badge>
                    <Badge variant="outline">
                      r/{item.subreddit}
                    </Badge>
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(item.weightedScore)}`}>
                    {item.weightedScore}
                  </div>
                </div>

                {/* Title for posts */}
                {item.type === 'post' && item.title && (
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                )}

                {/* Content */}
                {item.content && (
                  <p className="text-gray-700 mb-3 line-clamp-3">
                    {item.content}
                  </p>
                )}

                {/* Key Points */}
                {item.analysis.insights.key_points.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-600 mb-1">Key Points:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.analysis.insights.key_points.slice(0, 3).map((point, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      u/{item.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(item.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {item.redditScore} points
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      Quality: {item.analysis.quality.overall_quality}% | 
                      Relevancy: {item.analysis.relevancy.score}% | 
                      Engagement: {item.analysis.engagement.score}%
                    </span>
                    {item.link && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {data.data.pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {data.data.pagination.currentPage} of {Math.ceil(data.data.pagination.totalCount / data.data.pagination.limit)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!data.data.pagination.hasPrevPage || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data.data.pagination.hasNextPage || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {data?.success && data.data?.items.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
            <p className="text-gray-600">
              No Reddit posts or comments found for the keyword "{keyword}". 
              Try fetching data first or adjusting your filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}