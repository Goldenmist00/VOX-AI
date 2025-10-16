"use client"

import { useState } from 'react'
import { 
  User, 
  ThumbsUp, 
  ThumbsDown,
  Minus,
  Clock, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Star,
  BarChart3,
  Brain,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react'

interface EnhancedRedditCommentProps {
  comment: {
    id: string
    type: 'reddit' | 'user'
    author: string
    content: string
    score?: number
    createdAt: string
    permalink?: string
    subreddit?: string
    keyword?: string
    analysis?: {
      sentiment?: {
        classification: 'positive' | 'negative' | 'neutral'
        confidence: number
        positive_score: number
        negative_score: number
        neutral_score: number
      }
      relevancy?: {
        score: number
        reasoning: string
        keywords_matched: string[]
      }
      quality?: {
        clarity: number
        coherence: number
        informativeness: number
        overall_quality: number
      }
      engagement?: {
        score: number
        factors: string[]
        discussion_potential: number
      }
      insights?: {
        key_points: string[]
        stance: 'supporting' | 'opposing' | 'neutral' | 'questioning'
        tone: 'formal' | 'casual' | 'emotional' | 'analytical'
        credibility_indicators: string[]
      }
      contributor?: {
        score: number
        expertise_level: 'novice' | 'intermediate' | 'expert'
        contribution_type: 'opinion' | 'fact' | 'experience' | 'question'
      }
      isAnalyzing?: boolean
    }
  }
  onAnalyze?: (commentId: string) => void
}

export default function EnhancedRedditComment({ comment, onAnalyze }: EnhancedRedditCommentProps) {
  const [expandedAnalysis, setExpandedAnalysis] = useState(false)

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

  const getExpertiseColor = (level: string) => {
    switch (level) {
      case 'expert': return 'text-purple-400'
      case 'intermediate': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'supporting': return 'bg-emerald-500/20 text-emerald-400'
      case 'opposing': return 'bg-red-500/20 text-red-400'
      case 'questioning': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const handleAnalyze = () => {
    if (onAnalyze) {
      onAnalyze(comment.id)
    }
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
            <span className={`${comment.analysis.isAnalyzing ? 'text-gray-400' : getSentimentColor(comment.analysis.sentiment.classification)} flex items-center gap-1 text-sm`}>
              {comment.analysis.isAnalyzing ? (
                <>
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  {getSentimentIcon(comment.analysis.sentiment.classification)}
                  {comment.analysis.sentiment.classification}
                </>
              )}
            </span>
          )}
          
          {comment.analysis?.quality?.overall_quality !== undefined && (
            <span className={`text-xs px-2 py-1 rounded-full ${comment.analysis.isAnalyzing ? 'text-gray-400 bg-gray-800/50' : getScoreColor(comment.analysis.quality.overall_quality) + ' bg-gray-800/50'}`}>
              {comment.analysis.isAnalyzing ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>...</span>
                </div>
              ) : (
                `Q: ${comment.analysis.quality.overall_quality}%`
              )}
            </span>
          )}

          {comment.analysis?.contributor?.expertise_level && !comment.analysis.isAnalyzing && (
            <span className={`text-xs px-2 py-1 rounded-full ${getExpertiseColor(comment.analysis.contributor.expertise_level)} bg-gray-800/50`}>
              {comment.analysis.contributor.expertise_level}
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

          {/* Analysis Toggle Button */}
          {comment.analysis && (
            <button
              onClick={() => setExpandedAnalysis(!expandedAnalysis)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {expandedAnalysis ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Comment Content */}
      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
        {comment.content}
      </p>

      {/* Quick Analysis Stats */}
      {comment.analysis && !comment.analysis.isAnalyzing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {comment.analysis.quality && (
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <div className="text-xs text-gray-400">Quality</div>
              <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.quality.overall_quality)}`}>
                {comment.analysis.quality.overall_quality}%
              </div>
            </div>
          )}
          {comment.analysis.relevancy && (
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <div className="text-xs text-gray-400">Relevancy</div>
              <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.relevancy.score)}`}>
                {comment.analysis.relevancy.score}%
              </div>
            </div>
          )}
          {comment.analysis.engagement && (
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <div className="text-xs text-gray-400">Engagement</div>
              <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.engagement.score)}`}>
                {comment.analysis.engagement.score}%
              </div>
            </div>
          )}
          {comment.analysis.contributor && (
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <div className="text-xs text-gray-400">Contributor</div>
              <div className={`text-sm font-semibold ${getScoreColor(comment.analysis.contributor.score)}`}>
                {comment.analysis.contributor.score}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Tags */}
      {comment.analysis?.insights && !comment.analysis.isAnalyzing && (
        <div className="flex flex-wrap gap-2 mb-3">
          {comment.analysis.insights.stance && (
            <span className={`text-xs px-2 py-1 rounded-full ${getStanceColor(comment.analysis.insights.stance)}`}>
              {comment.analysis.insights.stance}
            </span>
          )}
          {comment.analysis.insights.tone && (
            <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
              {comment.analysis.insights.tone}
            </span>
          )}
          {comment.analysis.contributor?.contribution_type && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
              {comment.analysis.contributor.contribution_type}
            </span>
          )}
        </div>
      )}

      {/* Expanded Analysis */}
      {expandedAnalysis && comment.analysis && !comment.analysis.isAnalyzing && (
        <div className="border-t border-gray-700 pt-4 space-y-4">
          {/* Detailed Sentiment */}
          {comment.analysis.sentiment && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h6 className="font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Sentiment Analysis
              </h6>
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
          )}

          {/* Key Points */}
          {comment.analysis.insights?.key_points && comment.analysis.insights.key_points.length > 0 && (
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

          {/* Relevancy Analysis */}
          {comment.analysis.relevancy && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h6 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Relevancy Analysis
              </h6>
              <p className="text-sm text-gray-300 mb-2">{comment.analysis.relevancy.reasoning}</p>
              {comment.analysis.relevancy.keywords_matched.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {comment.analysis.relevancy.keywords_matched.map((keyword, index) => (
                    <span key={index} className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Credibility Indicators */}
          {comment.analysis.insights?.credibility_indicators && comment.analysis.insights.credibility_indicators.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h6 className="font-semibold text-emerald-400 mb-2">Credibility Indicators</h6>
              <ul className="space-y-1">
                {comment.analysis.insights.credibility_indicators.map((indicator, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Analyze Button for comments without analysis */}
      {!comment.analysis && comment.type === 'reddit' && onAnalyze && (
        <div className="border-t border-gray-700 pt-3">
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Analyze with AI
          </button>
        </div>
      )}
    </div>
  )
}