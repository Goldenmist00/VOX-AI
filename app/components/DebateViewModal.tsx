"use client"

import { useState, useEffect } from "react"
import {
  X,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  BarChart3,
  Target,
  Hash,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Award,
  Activity,
  Brain,
  Sparkles
} from "lucide-react"

interface Comment {
  id: string
  content: string
  author: string
  timestamp: string
  analysis: {
    sentiment: {
      overall: string
      confidence: number
      positive_score: number
      negative_score: number
      neutral_score: number
    }
    analysis: {
      clarity: number
      relevance: number
      constructiveness: number
      evidence_quality: number
      respectfulness: number
    }
    scores: {
      overall_score: number
      contribution_quality: number
      debate_value: number
    }
    insights: {
      key_points: string[]
      strengths: string[]
      areas_for_improvement: string[]
      debate_impact: string
    }
    classification: {
      type: string
      stance: string
      tone: string
    }
  }
}

interface Debate {
  id: number
  title: string
  description: string
  tags: string[]
  participants: number
  sentiment: { positive: number; negative: number; neutral: number }
  activity: string
  aiScore: number
  messages: number
  trending: boolean
}

interface DebateViewModalProps {
  debate: Debate | null
  isOpen: boolean
  onClose: () => void
}

export default function DebateViewModal({ debate, isOpen, onClose }: DebateViewModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'sentiment'>('recent')
  const [filterBy, setFilterBy] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  // Mock comments data - in a real app, this would come from an API
  const mockComments: Comment[] = [
    {
      id: "1",
      content: "I believe carbon tax is essential for reducing emissions. The economic benefits outweigh the costs, and we need immediate action on climate change.",
      author: "ClimateAdvocate",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      analysis: {
        sentiment: { overall: "positive", confidence: 89, positive_score: 85, negative_score: 5, neutral_score: 10 },
        analysis: { clarity: 92, relevance: 95, constructiveness: 88, evidence_quality: 75, respectfulness: 90 },
        scores: { overall_score: 88, contribution_quality: 85, debate_value: 90 },
        insights: {
          key_points: ["Carbon tax effectiveness", "Economic cost-benefit analysis", "Climate urgency"],
          strengths: ["Clear position", "Constructive tone", "Relevant to topic"],
          areas_for_improvement: ["Could provide more specific data", "Consider opposing viewpoints"],
          debate_impact: "High - contributes valuable perspective on policy effectiveness"
        },
        classification: { type: "argument", stance: "supporting", tone: "professional" }
      }
    },
    {
      id: "2",
      content: "Carbon tax will hurt low-income families the most. We need alternative solutions that don't burden working people.",
      author: "EconomicConcern",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      analysis: {
        sentiment: { overall: "negative", confidence: 76, positive_score: 15, negative_score: 70, neutral_score: 15 },
        analysis: { clarity: 88, relevance: 92, constructiveness: 65, evidence_quality: 60, respectfulness: 85 },
        scores: { overall_score: 72, contribution_quality: 70, debate_value: 75 },
        insights: {
          key_points: ["Economic impact on families", "Need for alternative solutions", "Social equity concerns"],
          strengths: ["Raises important social concerns", "Clear communication"],
          areas_for_improvement: ["Could suggest specific alternatives", "More evidence on economic impact"],
          debate_impact: "Medium - important perspective on social equity"
        },
        classification: { type: "concern", stance: "opposing", tone: "passionate" }
      }
    },
    {
      id: "3",
      content: "What about implementing carbon tax with rebates for low-income households? This could address both environmental and social concerns.",
      author: "PolicyInnovator",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      analysis: {
        sentiment: { overall: "positive", confidence: 82, positive_score: 80, negative_score: 10, neutral_score: 10 },
        analysis: { clarity: 95, relevance: 98, constructiveness: 95, evidence_quality: 85, respectfulness: 95 },
        scores: { overall_score: 94, contribution_quality: 92, debate_value: 96 },
        insights: {
          key_points: ["Hybrid solution approach", "Rebate system design", "Balancing environmental and social goals"],
          strengths: ["Innovative solution", "Addresses multiple concerns", "Highly constructive"],
          areas_for_improvement: ["Could elaborate on implementation details"],
          debate_impact: "Very High - proposes practical compromise solution"
        },
        classification: { type: "solution", stance: "neutral", tone: "analytical" }
      }
    }
  ]

  useEffect(() => {
    if (isOpen && debate) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setComments(mockComments)
        setIsLoading(false)
      }, 1000)
    }
  }, [isOpen, debate])

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-400'
      case 'negative': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4" />
      case 'negative': return <ThumbsDown className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getClassificationColor = (type: string) => {
    switch (type) {
      case 'argument': return 'bg-blue-500/20 text-blue-400'
      case 'solution': return 'bg-emerald-500/20 text-emerald-400'
      case 'concern': return 'bg-orange-500/20 text-orange-400'
      case 'question': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.analysis.scores.overall_score - a.analysis.scores.overall_score
      case 'sentiment':
        return b.analysis.sentiment.confidence - a.analysis.sentiment.confidence
      default:
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    }
  })

  const filteredComments = sortedComments.filter(comment => {
    if (filterBy === 'all') return true
    return comment.analysis.sentiment.overall === filterBy
  })

  const overallStats = {
    totalComments: comments.length,
    avgScore: comments.length > 0 ? Math.round(comments.reduce((sum, c) => sum + c.analysis.scores.overall_score, 0) / comments.length) : 0,
    sentimentDistribution: {
      positive: comments.filter(c => c.analysis.sentiment.overall === 'positive').length,
      negative: comments.filter(c => c.analysis.sentiment.overall === 'negative').length,
      neutral: comments.filter(c => c.analysis.sentiment.overall === 'neutral').length
    }
  }

  if (!isOpen || !debate) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-950 border border-gray-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{debate.title}</h2>
            <p className="text-gray-400 mb-3">{debate.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-white" />
                <span>{debate.participants.toLocaleString()} participants</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-white" />
                <span>{comments.length} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>AI Score: {debate.aiScore}/100</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-700 bg-gray-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white" />
                <span className="text-sm text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="score">Highest Score</option>
                  <option value="sentiment">Sentiment Confidence</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Filter:</span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Comments</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">Avg Score:</span>
                <span className={`font-semibold ${getScoreColor(overallStats.avgScore)}`}>
                  {overallStats.avgScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading debate comments...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Total Comments</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{overallStats.totalComments}</div>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-semibold text-white">Average Score</h3>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(overallStats.avgScore)}`}>
                    {overallStats.avgScore}/100
                  </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-semibold text-white">Sentiment Mix</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-400">{overallStats.sentimentDistribution.positive} positive</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{overallStats.sentimentDistribution.neutral} neutral</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-red-400">{overallStats.sentimentDistribution.negative} negative</span>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{comment.author}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getClassificationColor(comment.analysis.classification.type)}`}>
                              {comment.analysis.classification.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(comment.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`${getSentimentColor(comment.analysis.sentiment.overall)} flex items-center gap-1 text-sm`}>
                            {getSentimentIcon(comment.analysis.sentiment.overall)}
                            {comment.analysis.sentiment.overall}
                          </span>
                          <span className={`${getScoreColor(comment.analysis.scores.overall_score)} font-semibold text-sm`}>
                            {comment.analysis.scores.overall_score}/100
                          </span>
                        </div>
                        <button
                          onClick={() => toggleCommentExpansion(comment.id)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          {expandedComments.has(comment.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-gray-300 mb-4 leading-relaxed">{comment.content}</p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <div className="text-xs text-gray-400">Clarity</div>
                        <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.analysis.clarity)}`}>
                          {comment.analysis.analysis.clarity}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <div className="text-xs text-gray-400">Relevance</div>
                        <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.analysis.relevance)}`}>
                          {comment.analysis.analysis.relevance}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <div className="text-xs text-gray-400">Constructive</div>
                        <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.analysis.constructiveness)}`}>
                          {comment.analysis.analysis.constructiveness}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <div className="text-xs text-gray-400">Respectful</div>
                        <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.analysis.respectfulness)}`}>
                          {comment.analysis.analysis.respectfulness}%
                        </div>
                      </div>
                    </div>

                    {/* Classification Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getClassificationColor(comment.analysis.classification.type)}`}>
                        {comment.analysis.classification.type}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        {comment.analysis.classification.stance}
                      </span>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                        {comment.analysis.classification.tone}
                      </span>
                    </div>

                    {/* Expanded Analysis */}
                    {expandedComments.has(comment.id) && (
                      <div className="border-t border-gray-700 pt-4 space-y-4">
                        {/* Detailed Sentiment */}
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            Sentiment Analysis
                          </h5>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Confidence:</span>
                              <span className="text-white">{comment.analysis.sentiment.confidence}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-400">Positive:</span>
                              <span className="text-emerald-400">{comment.analysis.sentiment.positive_score}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Neutral:</span>
                              <span className="text-gray-400">{comment.analysis.sentiment.neutral_score}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-400">Negative:</span>
                              <span className="text-red-400">{comment.analysis.sentiment.negative_score}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Key Insights */}
                        {comment.analysis.insights.key_points.length > 0 && (
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <h6 className="font-semibold text-white mb-2 flex items-center gap-2">
                              <Brain className="w-4 h-4 text-purple-400" />
                              Key Points
                            </h6>
                            <ul className="space-y-1">
                              {comment.analysis.insights.key_points.map((point, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Strengths and Improvements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {comment.analysis.insights.strengths.length > 0 && (
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <h6 className="font-semibold text-emerald-400 mb-2">Strengths</h6>
                              <ul className="space-y-1">
                                {comment.analysis.insights.strengths.map((strength, index) => (
                                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {comment.analysis.insights.areas_for_improvement.length > 0 && (
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <h6 className="font-semibold text-yellow-400 mb-2">Areas for Improvement</h6>
                              <ul className="space-y-1">
                                {comment.analysis.insights.areas_for_improvement.map((improvement, index) => (
                                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Debate Impact */}
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h6 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-400" />
                            Debate Impact
                          </h6>
                          <p className="text-sm text-gray-300">{comment.analysis.insights.debate_impact}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredComments.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No comments found for the selected filter.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
