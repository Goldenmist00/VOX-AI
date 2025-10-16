"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  TrendingUp,
  Clock,
  User,
  Loader2,
  CheckCircle,
  AlertCircle
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

interface CommentSystemProps {
  debateId: string
  debateTopic: string
  isJoined: boolean
  onCommentAdded?: (comment: any, debateId: string) => void
}

export default function CommentSystem({ debateId, debateTopic, isJoined, onCommentAdded }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Load existing messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoadingMessages(true)
      try {
        const response = await fetch(`/api/messages?debateId=${debateId}&limit=20`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          const formattedComments = data.messages.map((msg: any) => ({
            id: msg._id,
            content: msg.content,
            author: msg.author?.firstName ? `${msg.author.firstName} ${msg.author.lastName}` : "Unknown",
            timestamp: msg.createdAt,
            analysis: msg.analysis
          }))
          setComments(formattedComments)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    if (isJoined) {
      loadMessages()
    }
  }, [debateId, isJoined])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isJoined) return

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          content: newComment,
          debateId: debateId,
          debateTopic: debateTopic
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save comment')
      }

      const data = await response.json()
      
      const comment: Comment = {
        id: data.data._id,
        content: data.data.content,
        author: data.data.author?.firstName ? `${data.data.author.firstName} ${data.data.author.lastName}` : "You",
        timestamp: data.data.createdAt,
        analysis: data.data.analysis
      }

      setComments(prev => [comment, ...prev])
      setNewComment("")
      
      // Notify parent component about new comment
      if (onCommentAdded) {
        onCommentAdded(comment, debateId)
      }
    } catch (error) {
      console.error('Error saving comment:', error)
      // Show error to user but don't add comment to local state
      alert(error instanceof Error ? error.message : 'Failed to save comment. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

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

  if (!isJoined) {
    return (
      <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
        <p className="text-gray-400 text-center">Join this debate to participate in the discussion</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Comment Input */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h4 className="font-semibold text-white">Share Your Thoughts</h4>
        </div>
        
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your views on this debate topic..."
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
            rows={3}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>AI will analyze your comment for sentiment and quality</span>
            </div>
            
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isAnalyzing}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Toggle */}
      {comments.length > 0 && (
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{showComments ? 'Hide' : 'Show'} Comments ({comments.length})</span>
        </button>
      )}

      {/* Comments List */}
      {showComments && (
        <div className="space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-400">Loading messages...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No messages yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
            <div key={comment.id} className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-medium text-white">{comment.author}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(comment.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`${getSentimentColor(comment.analysis.sentiment.overall)} flex items-center gap-1 text-sm`}>
                    {getSentimentIcon(comment.analysis.sentiment.overall)}
                    {comment.analysis.sentiment.overall}
                  </span>
                  <span className={`${getScoreColor(comment.analysis.scores.overall_score)} font-semibold text-sm`}>
                    {comment.analysis.scores.overall_score}/100
                  </span>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-gray-300 mb-4 leading-relaxed">{comment.content}</p>

              {/* AI Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Sentiment Analysis */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Sentiment Analysis
                  </h5>
                  <div className="space-y-2 text-sm">
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

                {/* Quality Scores */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Quality Scores
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Clarity:</span>
                      <span className={getScoreColor(comment.analysis.analysis.clarity)}>{comment.analysis.analysis.clarity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Relevance:</span>
                      <span className={getScoreColor(comment.analysis.analysis.relevance)}>{comment.analysis.analysis.relevance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Constructiveness:</span>
                      <span className={getScoreColor(comment.analysis.analysis.constructiveness)}>{comment.analysis.analysis.constructiveness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Respectfulness:</span>
                      <span className={getScoreColor(comment.analysis.analysis.respectfulness)}>{comment.analysis.analysis.respectfulness}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {comment.analysis.classification.type}
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                  {comment.analysis.classification.stance}
                </span>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                  {comment.analysis.classification.tone}
                </span>
              </div>

              {/* Key Insights */}
              {comment.analysis.insights.key_points.length > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <h6 className="font-semibold text-white mb-2">Key Points:</h6>
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
            </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
