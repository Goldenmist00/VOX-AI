"use client"

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface CommentInputProps {
  postId: string
  onCommentAdded: (comment: any) => void
  onCancel: () => void
}

export default function CommentInput({ postId, onCommentAdded, onCancel }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.trim().length < 10) {
      setError('Comment must be at least 10 characters long')
      return
    }

    if (content.length > 2000) {
      setError('Comment cannot exceed 2000 characters')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/reddit/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: content.trim() })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onCommentAdded(data.data.comment)
        setContent('')
        onCancel() // Close the input after successful submission
      } else {
        setError(data.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mt-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
            Add your comment to the discussion
          </label>
          <textarea
            id="comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts on this topic..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-vertical"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${content.length > 2000 ? 'text-red-400' : 'text-gray-500'}`}>
              {content.length}/2000 characters
            </span>
            {content.trim().length > 0 && content.trim().length < 10 && (
              <span className="text-xs text-yellow-400">
                Minimum 10 characters required
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || content.trim().length < 10 || content.length > 2000}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}