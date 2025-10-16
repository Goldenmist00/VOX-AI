"use client"

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Minus,
  Globe, 
  User, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Plus,
  Clock
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import CommentCard from './CommentCard'
import EnhancedRedditComment from './EnhancedRedditComment'
import CommentInput from './CommentInput'
import LoginModal from './LoginModal'

interface InteractiveRedditPostProps {
  post: {
    _id: string
    redditId: string
    title: string
    link: string
    author: string
    subreddit: string
    content?: string
    redditScore?: number
    createdAt: string
    analysis?: {
      sentiment?: {
        classification: 'positive' | 'negative' | 'neutral'
        confidence: number
      }
      quality?: {
        overall_quality: number
      }
      insights?: {
        key_points: string[]
        stance: string
        tone: string
      }
    }
  }
}

export default function InteractiveRedditPost({ post }: InteractiveRedditPostProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [commentCount, setCommentCount] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [analyzingComments, setAnalyzingComments] = useState<Set<string>>(new Set())

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

  const fetchComments = async () => {
    setIsLoadingComments(true)
    setCommentsError('')

    try {
      const response = await fetch(`/api/reddit/posts/${post.redditId}/comments?limit=20`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setComments(data.data.comments)
        setCommentCount(data.data.comments.length)
      } else {
        setCommentsError(data.error || 'Failed to load comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setCommentsError('Network error. Please try again.')
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleViewComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  const handleJoinDebate = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    
    if (!showComments) {
      fetchComments()
      setShowComments(true)
    }
    setShowCommentInput(true)
  }

  const handleCommentAdded = (newComment: any) => {
    setComments(prev => [newComment, ...prev])
    setCommentCount(prev => prev + 1)
    setShowCommentInput(false)
  }

  const handleAnalyzeComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment || comment.type !== 'reddit') return

    // Add to analyzing set
    setAnalyzingComments(prev => new Set(prev).add(commentId))

    // Update comment to show analyzing state
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, analysis: { ...c.analysis, isAnalyzing: true } }
        : c
    ))

    try {
      const response = await fetch('/api/analyze-reddit-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: comment.content,
          keyword: comment.keyword || post.title,
          subreddit: comment.subreddit || 'unknown',
          postTitle: post.title
        })
      })

      if (response.ok) {
        const { analysis } = await response.json()
        
        // Update comment with real analysis
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, analysis: { ...analysis, isAnalyzing: false } }
            : c
        ))
      } else {
        throw new Error(`Analysis failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error analyzing comment:', error)
      
      // Remove analyzing state on error
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, analysis: { ...c.analysis, isAnalyzing: false } }
          : c
      ))
    } finally {
      // Remove from analyzing set
      setAnalyzingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-all duration-300 group">
      {/* Post Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <h6 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 flex-1">
            {post.title}
          </h6>
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 transition-colors ml-3 flex-shrink-0"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
        
        {post.content && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {post.content}
          </p>
        )}

        {/* Post Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
            <Globe className="w-3 h-3" />
            r/{post.subreddit}
          </span>
          <span className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
            <User className="w-3 h-3" />
            {post.author}
          </span>
          {post.redditScore !== undefined && (
            <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
              <ThumbsUp className="w-3 h-3" />
              {post.redditScore}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Post Analysis */}
      <div className="space-y-3 mb-4">
        {/* Sentiment Analysis */}
        {post.analysis?.sentiment && (
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Sentiment:</span>
              <span className={`flex items-center gap-1 text-sm font-medium ${getSentimentColor(post.analysis.sentiment.classification)}`}>
                {getSentimentIcon(post.analysis.sentiment.classification)}
                {post.analysis.sentiment.classification}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {post.analysis.sentiment.confidence}% confidence
            </div>
          </div>
        )}

        {/* Quality Score */}
        {post.analysis?.quality?.overall_quality && (
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-300">Quality Score:</span>
            <span className={`text-sm font-medium ${getScoreColor(post.analysis.quality.overall_quality)}`}>
              {post.analysis.quality.overall_quality}%
            </span>
          </div>
        )}

        {/* Key Points */}
        {post.analysis?.insights?.key_points && post.analysis.insights.key_points.length > 0 && (
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-300 mb-2">Key Points:</div>
            <div className="flex flex-wrap gap-2">
              {post.analysis.insights.key_points.slice(0, 3).map((point, i) => (
                <span key={i} className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stance and Tone */}
        {(post.analysis?.insights?.stance || post.analysis?.insights?.tone) && (
          <div className="flex gap-2">
            {post.analysis.insights.stance && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                {post.analysis.insights.stance}
              </span>
            )}
            {post.analysis.insights.tone && (
              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                {post.analysis.insights.tone}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleViewComments}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {showComments ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Comments
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View Comments {commentCount > 0 && `(${commentCount})`}
            </>
          )}
        </button>

        <button
          onClick={handleJoinDebate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Join Debate
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-700 pt-4">
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading comments...</span>
            </div>
          ) : commentsError ? (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              {commentsError}
            </div>
          ) : (
            <>
              {/* Comment Input */}
              {showCommentInput && (
                <CommentInput
                  postId={post.redditId}
                  onCommentAdded={handleCommentAdded}
                  onCancel={() => setShowCommentInput(false)}
                />
              )}

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-4 mt-4">
                  <h6 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Discussion ({comments.length} comments)
                  </h6>
                  {comments.map((comment, index) => (
                    <EnhancedRedditComment 
                      key={comment.id || index} 
                      comment={comment}
                      onAnalyze={handleAnalyzeComment}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet. Be the first to join the discussion!</p>
                  {!showCommentInput && user && (
                    <button
                      onClick={() => setShowCommentInput(true)}
                      className="mt-3 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Add the first comment
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}