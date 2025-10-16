"use client"

import { useState } from 'react'
import { User, ThumbsUp, Clock, ExternalLink } from 'lucide-react'

interface CommentCardProps {
  comment: {
    id: string
    type: 'reddit' | 'user'
    author: string
    content: string
    score?: number
    createdAt: string
    analysis?: {
      sentiment?: {
        overall: 'positive' | 'negative' | 'neutral'
        confidence: number
      }
      scores?: {
        overall_score: number
      }
      classification?: {
        stance: string
        tone: string
      }
    }
    permalink?: string
  }
}

export default function CommentCard({ comment }: CommentCardProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-400'
      case 'negative': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '👍'
      case 'negative': return '👎'
      default: return '😐'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`border rounded-lg p-4 transition-all duration-300 hover:border-gray-500 ${
      comment.type === 'reddit' 
        ? 'bg-gray-900/30 border-gray-700' 
        : 'bg-blue-900/20 border-blue-700/50'
    }`}>
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {comment.author}
            {comment.type === 'user' && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full ml-1">
                VOX User
              </span>
            )}
          </span>
          
          {comment.score !== undefined && comment.score > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              {comment.score} points
            </span>
          )}
          
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {comment.analysis?.sentiment && (
            <span className={`flex items-center gap-1 text-sm ${getSentimentColor(comment.analysis.sentiment.overall)}`}>
              <span>{getSentimentIcon(comment.analysis.sentiment.overall)}</span>
              {comment.analysis.sentiment.overall}
            </span>
          )}
          
          {comment.analysis?.scores?.overall_score && (
            <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(comment.analysis.scores.overall_score)} bg-gray-800/50`}>
              Q: {comment.analysis.scores.overall_score}%
            </span>
          )}
          
          {comment.type === 'reddit' && comment.permalink && (
            <a
              href={`https://reddit.com${comment.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      
      {/* Comment Content */}
      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
        {comment.content}
      </p>

      {/* Analysis Tags */}
      {(comment.analysis?.classification?.stance || comment.analysis?.classification?.tone) && (
        <div className="flex flex-wrap gap-2">
          {comment.analysis.classification.stance && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
              {comment.analysis.classification.stance}
            </span>
          )}
          {comment.analysis.classification.tone && (
            <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
              {comment.analysis.classification.tone}
            </span>
          )}
        </div>
      )}
    </div>
  )
}