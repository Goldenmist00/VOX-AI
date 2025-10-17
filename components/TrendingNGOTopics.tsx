"use client"

import { useEffect, useState } from "react"
import { TrendingUp, AlertTriangle, Users, Target, ExternalLink, RefreshCw, Zap, Globe } from "lucide-react"

interface TrendingTopic {
  topic: string
  keywords: string[]
  urgency: 'low' | 'medium' | 'high' | 'critical'
  description: string
  subreddits: string[]
  trending_score: number
  last_updated: string
  action_items: string[]
  impact_potential: string
}

interface TrendingNGOTopicsProps {
  onTopicSelect?: (topic: string) => void
  limit?: number
}

export default function TrendingNGOTopics({ onTopicSelect, limit = 6 }: TrendingNGOTopicsProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/trending-ngo-topics?limit=${limit}`)
      const data = await response.json()

      if (data.success) {
        setTopics(data.trending_topics)
        setLastUpdated(data.timestamp)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch trending topics')
      }
    } catch (err) {
      setError('Network error while fetching trending topics')
      console.error('Error fetching trending NGO topics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingTopics()
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchTrendingTopics, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [limit])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <TrendingUp className="w-4 h-4" />
      case 'medium': return <Target className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            🔥 Trending NGO Topics
          </h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            🔥 Trending NGO Topics
          </h3>
          <button
            onClick={fetchTrendingTopics}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh topics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchTrendingTopics}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          🔥 Trending NGO Topics
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
          <button
            onClick={fetchTrendingTopics}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh topics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {topics.map((topic, index) => (
          <div
            key={topic.topic}
            className="group border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
            onClick={() => onTopicSelect?.(topic.keywords[0])}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-orange-400">#{index + 1}</span>
                <h4 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {topic.topic}
                </h4>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(topic.urgency)}`}>
                {getUrgencyIcon(topic.urgency)}
                {topic.urgency.toUpperCase()}
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {topic.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Score: {topic.trending_score}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {topic.impact_potential} Impact
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-400 group-hover:text-orange-300">
                <span className="text-xs font-medium">Explore</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            {/* Keywords */}
            <div className="mt-3 flex flex-wrap gap-1">
              {topic.keywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full border border-gray-600"
                >
                  {keyword}
                </span>
              ))}
              {topic.keywords.length > 3 && (
                <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full border border-gray-600">
                  +{topic.keywords.length - 3} more
                </span>
              )}
            </div>

            {/* Action Items Preview */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Quick Actions:
              </p>
              <div className="space-y-1">
                {topic.action_items.slice(0, 2).map((action, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                    <span className="line-clamp-1">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
          <Target className="w-3 h-3 text-orange-400" />
          Topics curated for NGOs and organizations based on current global trends and social impact potential
        </p>
      </div>
    </div>
  )
}