"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Award, ArrowRight } from "lucide-react"

export function LiveDashboardBoards() {
  const [liveSentiment, setLiveSentiment] = useState({
    positive: 0,
    negative: 0,
    neutral: 0,
    loading: true
  })
  const [topContributors, setTopContributors] = useState<Array<{
    id: string
    username: string
    score: number
    clarity: number
    rank: number
    avatar: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        // Fetch debates and calculate live sentiment
        const debatesResponse = await fetch('/api/debates')
        const debates = await debatesResponse.json()
        
        if (debates.success && debates.debates.length > 0) {
          // Calculate overall sentiment from all debates
          let totalPositive = 0, totalNegative = 0, totalNeutral = 0, totalMessages = 0
          const contributorStats: { [key: string]: { score: number, clarity: number, messages: number, username: string } } = {}

          for (const debate of debates.debates) {
            // Fetch messages for each debate
            const messagesResponse = await fetch(`/api/messages?debateId=${debate._id}`)
            const messagesData = await messagesResponse.json()
            
            if (messagesData.success) {
              messagesData.messages.forEach((message: any) => {
                totalMessages++
                
                // Handle both old string format and new object format for sentiment
                let sentimentLabel = 'Neutral'
                let sentimentConfidence = 50
                
                if (typeof message.sentiment === 'string') {
                  // Old format: sentiment is a string
                  sentimentLabel = message.sentiment.charAt(0).toUpperCase() + message.sentiment.slice(1)
                  sentimentConfidence = message.confidence || 50
                } else if (message.sentiment && typeof message.sentiment === 'object') {
                  // New format: sentiment is an object
                  sentimentLabel = message.sentiment.sentiment_label || 'Neutral'
                  sentimentConfidence = message.sentiment.confidence || 50
                }
                
                // Count sentiment
                if (sentimentLabel === 'Positive') totalPositive++
                else if (sentimentLabel === 'Negative') totalNegative++
                else totalNeutral++

                // Track contributor stats
                const authorId = message.author || 'Anonymous'
                if (!contributorStats[authorId]) {
                  contributorStats[authorId] = { 
                    score: 0, 
                    clarity: 0, 
                    messages: 0, 
                    username: message.authorName || `User${authorId.slice(-4)}` 
                  }
                }
                
                contributorStats[authorId].messages++
                contributorStats[authorId].score += (message.votes?.agree || 0) - (message.votes?.disagree || 0)
                contributorStats[authorId].clarity += sentimentConfidence
              })
            }
          }

          // Calculate percentages
          if (totalMessages > 0) {
            setLiveSentiment({
              positive: Math.round((totalPositive / totalMessages) * 100),
              negative: Math.round((totalNegative / totalMessages) * 100),
              neutral: Math.round((totalNeutral / totalMessages) * 100),
              loading: false
            })
          }

          // Calculate top contributors
          const contributors = Object.entries(contributorStats)
            .map(([id, stats]) => ({
              id,
              username: stats.username,
              score: Math.max(10, Math.min(100, 50 + stats.score * 2)), // Scale to 10-100
              clarity: Math.round(stats.clarity / Math.max(1, stats.messages)), // Average clarity
              rank: 0,
              avatar: id.slice(-2).toUpperCase()
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map((contributor, index) => ({ ...contributor, rank: index + 1 }))

          setTopContributors(contributors)
        } else {
          // Fallback to demo data if no real debates
          setLiveSentiment({
            positive: 59,
            negative: 18,
            neutral: 23,
            loading: false
          })
          
          setTopContributors([
            { id: '1', username: 'PolicyExpert2024', score: 94, clarity: 89, rank: 1, avatar: 'PE' },
            { id: '2', username: 'CitizenAdvocate', score: 88, clarity: 92, rank: 2, avatar: 'CA' },
            { id: '3', username: 'DebateChampion', score: 85, clarity: 87, rank: 3, avatar: 'DC' },
            { id: '4', username: 'ThoughtLeader', score: 82, clarity: 85, rank: 4, avatar: 'TL' }
          ])
        }
      } catch (error) {
        console.error('Error fetching live data:', error)
        // Fallback to demo data
        setLiveSentiment({
          positive: 59,
          negative: 18,
          neutral: 23,
          loading: false
        })
        
        setTopContributors([
          { id: '1', username: 'PolicyExpert2024', score: 94, clarity: 89, rank: 1, avatar: 'PE' },
          { id: '2', username: 'CitizenAdvocate', score: 88, clarity: 92, rank: 2, avatar: 'CA' },
          { id: '3', username: 'DebateChampion', score: 85, clarity: 87, rank: 3, avatar: 'DC' },
          { id: '4', username: 'ThoughtLeader', score: 82, clarity: 85, rank: 4, avatar: 'TL' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="bg-gray-950/80 border border-gray-800 p-6 rounded-lg">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="bg-gray-950/80 border border-gray-800 p-6 rounded-lg">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* Live Sentiment Board */}
      <div className="bg-gray-950/80 border border-gray-800 p-6 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold text-white">Live Sentiment</h3>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {/* Positive */}
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-medium">Positive</span>
            <span className="text-white font-bold">{liveSentiment.positive}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${liveSentiment.positive}%` }}
            ></div>
          </div>

          {/* Neutral */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Neutral</span>
            <span className="text-white font-bold">{liveSentiment.neutral}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-gray-500 to-gray-400 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${liveSentiment.neutral}%` }}
            ></div>
          </div>

          {/* Negative */}
          <div className="flex items-center justify-between">
            <span className="text-red-400 font-medium">Negative</span>
            <span className="text-white font-bold">{liveSentiment.negative}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${liveSentiment.negative}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Contributors Board */}
      <div className="bg-gray-950/80 border border-gray-800 p-6 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Top Contributors</h3>
        </div>
        
        <div className="space-y-4">
          {topContributors.map((contributor) => (
            <div key={contributor.id} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {contributor.avatar}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{contributor.username}</span>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    contributor.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    contributor.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    contributor.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    #{contributor.rank}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span>Score: <span className="text-white font-medium">{contributor.score}</span></span>
                  <span>Clarity: <span className="text-white font-medium">{contributor.clarity}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <a 
            href="/forums" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            View all debates <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}