"use client"

import { useEffect, useState } from "react"
import {
  Search,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Bell,
  User,
  Filter,
  Zap,
  Target,
  Award,
  Eye,
  Plus,
  ArrowRight,
  Hash,
  BarChart3,
  Brain,
  Sparkles,
  Home,
  Upload,
  LayoutDashboard,
  X,
  LogOut,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import CommentSystem from "../components/CommentSystem"
import DebateViewModal from "../components/DebateViewModal"

import TrendingKeywords from "@/components/TrendingKeywords"
import InteractiveRedditPost from "@/components/InteractiveRedditPost"

export default function ForumsPage() {
  const { user, logout } = useAuth()
  const [activeFilter, setActiveFilter] = useState("trending")
  const [selectedDebate, setSelectedDebate] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'join'>('view')
  const [sentimentData, setSentimentData] = useState({ positive: 45, negative: 25, neutral: 30 })
  const [keywords, setKeywords] = useState([
    "Climate Action", "Carbon Tax", "Renewable Energy", "Green Jobs", "Sustainability"
  ])
  const [joinedDebates, setJoinedDebates] = useState<Set<string>>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vox-joined-debates')
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch (e) {
          console.error('Error loading joined debates:', e)
        }
      }
    }
    return new Set()
  })
  const [showCreateDebate, setShowCreateDebate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allComments, setAllComments] = useState<any[]>([])
  const [dynamicKeywords, setDynamicKeywords] = useState([
    "Climate Action", "Carbon Tax", "Renewable Energy", "Green Jobs", "Sustainability"
  ])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [isCreatingDebate, setIsCreatingDebate] = useState(false)
  const [createDebateError, setCreateDebateError] = useState("")

  const [debates, setDebates] = useState<any[]>([])
  const [isLoadingDebates, setIsLoadingDebates] = useState(true)
  const [debatesError, setDebatesError] = useState("")

  // Reddit RSS Integration State
  const [selectedSource, setSelectedSource] = useState<'vox' | 'reddit' | 'upload'>('vox')
  const [redditKeyword, setRedditKeyword] = useState("")
  const [redditPosts, setRedditPosts] = useState<any[]>([])
  const [redditComments, setRedditComments] = useState<any[]>([])
  const [isLoadingReddit, setIsLoadingReddit] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState("")
  const [redditError, setRedditError] = useState("")
  const [quotaExceeded, setQuotaExceeded] = useState(false)
  const [showRedditSearch, setShowRedditSearch] = useState(false)
  const [isLoadingAllPosts, setIsLoadingAllPosts] = useState(false)
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([])


  const [selectedKeywordForAnalysis, setSelectedKeywordForAnalysis] = useState("")
  const [redditStats, setRedditStats] = useState({
    totalComments: 0,
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topSubreddits: []
  })

  const leaderboard = [
    { id: 1, username: "PolicyExpert2024", avatar: "PE", aiScore: 94, clarity: 89, engagement: 97 },
    { id: 2, username: "CitizenAdvocate", avatar: "CA", aiScore: 88, clarity: 92, engagement: 84 },
    { id: 3, username: "DebateChampion", avatar: "DC", aiScore: 85, clarity: 87, engagement: 83 },
    { id: 4, username: "ThoughtLeader", avatar: "TL", aiScore: 82, clarity: 85, engagement: 79 }
  ]

  const handleJoinDebate = (debateId: string) => {
    // Just open the debate view modal in join mode
    // Don't mark as joined until user actually posts a comment
    setModalMode('join')
    setSelectedDebate(debateId)
  }

  const handleViewDebate = (debateId: string) => {
    // Open the debate view modal in view mode
    setModalMode('view')
    setSelectedDebate(debateId)
  }

  const handleCommentPosted = (debateId: string) => {
    // Mark debate as joined when user actually posts a comment
    setJoinedDebates(prev => {
      const newSet = new Set(prev)
      newSet.add(debateId)
      
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('vox-joined-debates', JSON.stringify(Array.from(newSet)))
      }
      
      return newSet
    })
  }

  // Calculate real-time sentiment from all comments
  const calculateLiveSentiment = () => {
    if (allComments.length === 0) {
      return { positive: 45, negative: 25, neutral: 30 }
    }

    const sentimentCounts = allComments.reduce((acc, comment) => {
      const sentiment = comment.analysis?.sentiment?.overall || 'neutral'
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, { positive: 0, negative: 0, neutral: 0 })

    const total = allComments.length
    return {
      positive: Math.round((sentimentCounts.positive / total) * 100),
      negative: Math.round((sentimentCounts.negative / total) * 100),
      neutral: Math.round((sentimentCounts.neutral / total) * 100)
    }
  }

  // Calculate sentiment for a specific debate
  const calculateDebateSentiment = (debateId: string) => {
    const debateComments = allComments.filter(comment => comment.debateId === debateId)

    if (debateComments.length === 0) {
      // Return default sentiment if no comments
      return { positive: 50, negative: 25, neutral: 25 }
    }

    const sentimentCounts = debateComments.reduce((acc, comment) => {
      const sentiment = comment.analysis?.sentiment?.overall || 'neutral'
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, { positive: 0, negative: 0, neutral: 0 })

    const total = debateComments.length
    return {
      positive: Math.round((sentimentCounts.positive / total) * 100),
      negative: Math.round((sentimentCounts.negative / total) * 100),
      neutral: Math.round((sentimentCounts.neutral / total) * 100)
    }
  }

  // Extract keywords from comment content
  const extractKeywordsFromComments = () => {
    if (allComments.length === 0) return dynamicKeywords

    const allText = allComments.map(comment => comment.content).join(' ')
    const words = allText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)

    const wordCounts = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {})

    const topWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

    // Combine with original keywords and remove duplicates
    const combined = [...new Set([...dynamicKeywords, ...topWords])]
    return combined.slice(0, 8) // Limit to 8 keywords
  }

  // Add comment to global state
  const addComment = (comment: any, debateId: string) => {
    const commentWithDebateId = { ...comment, debateId }
    setAllComments(prev => [commentWithDebateId, ...prev])
  }

  // Refresh all comments to update live sentiment
  const refreshAllComments = async () => {
    if (debates.length > 0) {
      await loadAllComments(debates)
    }
  }

  // Fetch debates from database
  const fetchDebates = async () => {
    setIsLoadingDebates(true)
    setDebatesError("")
    try {
      const response = await fetch('/api/debates?limit=20&sortBy=createdAt&order=desc', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setDebates(data.debates)
        
        // Load comments for all debates to update live sentiment
        await loadAllComments(data.debates)
      } else {
        setDebatesError('Failed to load debates')
      }
    } catch (error) {
      console.error('Error fetching debates:', error)
      setDebatesError('Network error. Please try again.')
    } finally {
      setIsLoadingDebates(false)
    }
  }

  // Load all comments from all debates for live sentiment analysis
  const loadAllComments = async (debatesList: any[]) => {
    try {
      const allCommentsPromises = debatesList.map(async (debate) => {
        try {
          const response = await fetch(`/api/messages?debateId=${debate.id}&limit=100`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            return data.messages.map((msg: any) => ({
              id: msg._id,
              content: msg.content,
              author: msg.author?.firstName ? `${msg.author.firstName} ${msg.author.lastName}` : "Unknown",
              timestamp: msg.createdAt,
              analysis: msg.analysis,
              debateId: debate.id
            }))
          }
          return []
        } catch (error) {
          console.error(`Error loading comments for debate ${debate.id}:`, error)
          return []
        }
      })

      const allCommentsResults = await Promise.all(allCommentsPromises)
      const flattenedComments = allCommentsResults.flat()
      setAllComments(flattenedComments)
    } catch (error) {
      console.error('Error loading all comments:', error)
    }
  }

  // Handle creating a new debate
  const handleCreateDebate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreatingDebate(true)
    setCreateDebateError("")

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string

    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, description, tags }),
      })

      const data = await response.json()

      if (response.ok) {
        // Add the new debate to the local state
        const newDebate = {
          id: data.debate._id,
          title: data.debate.title,
          description: data.debate.description,
          tags: data.debate.tags,
          participants: data.debate.participants,
          sentiment: data.debate.sentiment,
          activity: data.debate.activity,
          aiScore: data.debate.aiScore,
          messages: data.debate.messages,
          trending: data.debate.trending
        }

        // Refresh the debates list to include the new debate
        fetchDebates()

        // Close the modal and reset form
        setShowCreateDebate(false)
        e.currentTarget.reset()
      } else {
        setCreateDebateError(data.error || 'Failed to create debate')
      }
    } catch (error) {
      console.error('Error creating debate:', error)
      setCreateDebateError('Network error. Please try again.')
    } finally {
      setIsCreatingDebate(false)
    }
  }

  const filteredDebates = debates.filter(debate => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const matches = (
      debate.title.toLowerCase().includes(query) ||
      debate.description.toLowerCase().includes(query) ||
      debate.tags.some((tag: string) => tag.toLowerCase().includes(query)) ||
      // Search by participant count ranges
      (query.includes('high') && debate.participants > 1000) ||
      (query.includes('low') && debate.participants < 100) ||
      (query.includes('medium') && debate.participants >= 100 && debate.participants <= 1000) ||
      // Search by sentiment
      (query.includes('positive') && debate.sentiment.positive > 60) ||
      (query.includes('negative') && debate.sentiment.negative > 60) ||
      (query.includes('neutral') && debate.sentiment.neutral > 60) ||
      // Search by activity level
      (query.includes('active') && debate.activity === 'high') ||
      (query.includes('trending') && debate.activity === 'high') ||
      (query.includes('quiet') && debate.activity === 'low')
    )

    // Debug logging
    if (searchQuery.trim()) {
      console.log(`Searching for "${query}" in "${debate.title}": ${matches}`)
    }

    return matches
  })

  // Generate search suggestions
  const searchSuggestions = [
    ...dynamicKeywords,
    "high participants",
    "low participants",
    "positive sentiment",
    "negative sentiment",
    "active debates",
    "trending topics"
  ].filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()) &&
    suggestion.toLowerCase() !== searchQuery.toLowerCase()
  ).slice(0, 5)

  // Reddit RSS Integration Functions
  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeywordForAnalysis(keyword)
    loadPostsForKeyword(keyword)
  }

  // Load all available keywords from the database
  const loadAvailableKeywords = async () => {
    try {
      const response = await fetch('/api/reddit-rss?action=trending&limit=20', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setAvailableKeywords(data.data.map((item: any) => item.keyword))
        }
      }
    } catch (error) {
      console.error('Error loading available keywords:', error)
    }
  }

  // Load all Reddit posts from database
  const loadAllRedditPosts = async () => {
    setIsLoadingAllPosts(true)
    try {
      const response = await fetch('/api/reddit-rss?action=data&keyword=&limit=50&type=posts', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRedditPosts(data.data.posts || [])
          console.log(`Loaded ${data.data.posts?.length || 0} previous Reddit posts`)
        }
      }
    } catch (error) {
      console.error('Error loading all Reddit posts:', error)
    } finally {
      setIsLoadingAllPosts(false)
    }
  }

  // Load posts for a specific keyword
  const loadPostsForKeyword = async (keyword: string) => {
    try {
      const response = await fetch(`/api/reddit-rss?action=data&keyword=${encodeURIComponent(keyword)}&limit=20&type=posts`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Merge with existing posts, avoiding duplicates
          const newPosts = data.data.posts || []
          setRedditPosts(prev => {
            const existingIds = new Set(prev.map(p => p._id || p.redditId))
            const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p._id || p.redditId))
            return [...prev, ...uniqueNewPosts]
          })
        }
      }
    } catch (error) {
      console.error('Error loading posts for keyword:', error)
    }
  }

  const handleRedditSearch = async () => {
    if (!redditKeyword.trim()) return

    setIsLoadingReddit(true)
    setRedditError("")
    setRedditPosts([])
    setRedditComments([])
    setLoadingProgress("Fetching Reddit posts...")

    try {
      const response = await fetch('/api/reddit-rss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          keyword: redditKeyword.trim(),
          maxPosts: 8,
          includeComments: true,
          maxCommentsPerPost: 3
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLoadingProgress("Processing Reddit data...")
        setSelectedKeywordForAnalysis(redditKeyword.trim())
        setRedditStats({
          totalComments: data.data.totalStored,
          sentiment: data.data.statistics.sentiment,
          topSubreddits: data.data.statistics.topSubreddits
        })

        // Fetch the actual posts and comments data
        setLoadingProgress("Loading posts and comments...")
        const dataResponse = await fetch(`/api/reddit-rss?action=data&keyword=${encodeURIComponent(redditKeyword.trim())}&limit=15`, {
          credentials: 'include'
        })

        if (dataResponse.ok) {
          const dataResult = await dataResponse.json()
          console.log('Data retrieval result:', dataResult)
          if (dataResult.success) {
            console.log('Posts found:', dataResult.data.posts?.length || 0)
            console.log('Comments found:', dataResult.data.comments?.length || 0)
            
            // Add new posts to existing ones, avoiding duplicates
            const newPosts = dataResult.data.posts || []
            setRedditPosts(prev => {
              const existingIds = new Set(prev.map(p => p._id || p.redditId))
              const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p._id || p.redditId))
              return [...uniqueNewPosts, ...prev] // New posts at the top
            })
            
            setRedditComments(dataResult.data.comments || [])
            
            // Update available keywords
            if (!availableKeywords.includes(redditKeyword.trim())) {
              setAvailableKeywords(prev => [redditKeyword.trim(), ...prev])
            }
          } else {
            console.error('Data retrieval failed:', dataResult.error)
          }
        } else {
          console.error('Data response not ok:', dataResponse.status)
        }

        console.log(`Successfully fetched ${data.data.totalStored} Reddit items for "${redditKeyword}"`)

        // Check if quota was exceeded and show appropriate message
        if (data.message && data.message.includes('quota')) {
          setQuotaExceeded(true)
          setRedditError('AI analysis quota exceeded. Showing Reddit data without AI insights.')
        } else {
          setQuotaExceeded(false)
        }
      } else {
        // Handle quota exceeded errors more gracefully
        if (data.error && (data.error.includes('quota') || data.error.includes('Too Many Requests'))) {
          setQuotaExceeded(true)
          setRedditError('AI analysis quota exceeded. Please try again later or upgrade your plan.')
        } else {
          setQuotaExceeded(false)
          setRedditError(data.error || 'Failed to fetch Reddit data')
        }
      }
    } catch (error) {
      console.error('Error fetching Reddit data:', error)
      setRedditError('Network error. Please try again.')
    } finally {
      setIsLoadingReddit(false)
      setLoadingProgress("")
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

  useEffect(() => {
    // Fetch debates from database (this will also load all comments)
    fetchDebates()
  }, [])

  useEffect(() => {
    // Update sentiment data based on real comments
    const interval = setInterval(() => {
      const liveSentiment = calculateLiveSentiment()
      setSentimentData(liveSentiment)

      // Update keywords based on comments
      const newKeywords = extractKeywordsFromComments()
      setDynamicKeywords(newKeywords)
    }, 2000)
    return () => clearInterval(interval)
  }, [allComments])

  return (
    <div className="min-h-screen bg-black text-white font-mono relative">
      {/* Background Effects */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-25 gap-1 h-full">
            {Array.from({ length: 500 }).map((_, i) => (
              <div key={i} className="text-gray-600 text-[10px] matrix-flow">
                {i % 7 === 0 ? "·" : "∙"}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute inset-y-0 left-1/4 w-px bg-gradient-to-b from-transparent via-emerald-400/15 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm p-4 relative z-20 sticky top-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3">
              <div className="flex gap-2" aria-hidden="true">
                <div className="w-3 h-3 bg-blue-500" />
                <div className="w-3 h-3 bg-emerald-500" />
                <div className="w-3 h-3 bg-gray-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">VOX</span>
                <span className="text-xl font-bold text-blue-400">AI</span>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </a>
              <a href="/forums" className="flex items-center gap-2 text-blue-400 font-medium px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <MessageSquare className="w-4 h-4" />
                <span>Forums</span>
              </a>
              <a href="/upload" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </a>
              {(user?.role === "ngo" || user?.role === "policymaker") && (
                <a href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5 text-white" />
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <User className="w-4 h-4" />
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="text-gray-500">({user.role})</span>
                </div>
                <button
                  onClick={logout}
                  className="group relative cursor-pointer"
                  aria-label="Logout"
                  title="Logout"
                >
                  <div className="absolute inset-0 border border-red-500/40 bg-gray-900/20 transition-all duration-300 group-hover:border-red-400 group-hover:shadow-lg group-hover:shadow-red-400/20" />
                  <div className="relative border border-red-400/60 bg-transparent text-white font-medium px-3 py-1.5 text-sm transition-all duration-300 group-hover:border-red-300 group-hover:bg-gray-900/30 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-full">
                <User className="w-5 h-5 text-white" />
                <span className="text-sm">Guest</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <header className="px-6 py-12 lg:px-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                 Real-Time Debate Analyzer
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Join live debates and see collective opinion evolve through AI insights.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowCreateDebate(true)}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/20" />
                <div className="relative border-2 border-dashed border-emerald-400 bg-transparent text-white font-bold px-8 py-4 text-lg transition-all duration-300 group-hover:border-emerald-300 group-hover:bg-gray-900/30 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-white" />
                  <span>Create Debate</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 lg:px-12 pb-16 forums-container">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

              {/* Main Debate Area */}
              <div className="lg:col-span-3">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search debates by title, topic, or tags (e.g., 'Carbon Tax', 'Environment', 'Policy')..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearchSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Search Suggestions Dropdown */}
                    {showSearchSuggestions && searchQuery && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(suggestion)
                              setShowSearchSuggestions(false)
                            }}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                          >
                            <Search className="w-4 h-4 text-gray-400" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {searchQuery && (
                    <div className="mt-2 text-sm text-gray-400">
                      {filteredDebates.length} debate{filteredDebates.length !== 1 ? 's' : ''} found for "{searchQuery}"
                    </div>
                  )}
                </div>

                {/* Reddit Integration Search */}
                <div className="mb-6 bg-gray-900/30 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-orange-400" />
                      <h3 className="text-lg font-semibold text-white">Reddit Insights</h3>
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                        Live Data
                      </span>
                    </div>
                    <button
                      onClick={() => setShowRedditSearch(!showRedditSearch)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {showRedditSearch ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>

                  {showRedditSearch && (
                    <div className="space-y-4">
                      {/* Source Selector */}
                      <div className="flex gap-2">
                        {[
                          { id: 'vox', label: 'Vox Forum', icon: MessageSquare },
                          { id: 'reddit', label: 'Reddit', icon: Globe },
                          { id: 'upload', label: 'Uploads', icon: Upload }
                        ].map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            onClick={() => setSelectedSource(id as any)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedSource === id
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Reddit Keyword Search */}
                      {selectedSource === 'reddit' && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search Reddit for any topic (e.g., 'climate change', 'renewable energy')..."
                                value={redditKeyword}
                                onChange={(e) => setRedditKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleRedditSearch()}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors"
                              />
                            </div>
                            <button
                              onClick={handleRedditSearch}
                              disabled={!redditKeyword.trim() || isLoadingReddit}
                              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoadingReddit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Search className="w-4 h-4" />
                              )}
                              {isLoadingReddit ? (loadingProgress || 'Analyzing...') : 'Fetch & Analyze'}
                            </button>
                          </div>

                          {redditError && (
                            <div className={`text-sm rounded-lg p-3 ${quotaExceeded
                              ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                              : 'text-red-400 bg-red-500/10 border border-red-500/20'
                              }`}>
                              {quotaExceeded && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-yellow-400">⚠️</span>
                                  <span className="font-semibold">AI Analysis Limited</span>
                                </div>
                              )}
                              {redditError}
                              {quotaExceeded && (
                                <div className="mt-2 text-xs text-yellow-300">
                                  Reddit data is still available, but AI sentiment analysis and insights are temporarily unavailable.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Available Keywords Section */}
                          {availableKeywords.length > 0 && (
                            <div className="mb-4">
                              <h6 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-orange-400" />
                                Previously Searched Keywords
                              </h6>
                              <div className="flex flex-wrap gap-2">
                                {availableKeywords.slice(0, 8).map((keyword, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleKeywordSelect(keyword)}
                                    className={`group relative cursor-pointer transition-all duration-300 ${
                                      selectedKeywordForAnalysis === keyword 
                                        ? 'scale-105' 
                                        : 'hover:scale-105'
                                    }`}
                                  >
                                    <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                                      selectedKeywordForAnalysis === keyword
                                        ? 'bg-orange-500/20 border border-orange-500/50 shadow-lg shadow-orange-400/20'
                                        : 'bg-gray-800/50 border border-gray-600 group-hover:border-orange-500/30 group-hover:bg-orange-500/10'
                                    }`} />
                                    <div className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                                      selectedKeywordForAnalysis === keyword
                                        ? 'text-orange-300'
                                        : 'text-gray-300 group-hover:text-orange-400'
                                    }`}>
                                      {keyword}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reddit Stats */}
                          {redditStats.totalComments > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-800/30 rounded-lg mb-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-400">{redditStats.totalComments}</div>
                                <div className="text-xs text-gray-400">Items Analyzed</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">
                                  {Math.round((redditStats.sentiment.positive / redditStats.totalComments) * 100)}%
                                </div>
                                <div className="text-xs text-gray-400">Positive Sentiment</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                  {redditStats.topSubreddits.length}
                                </div>
                                <div className="text-xs text-gray-400">Subreddits</div>
                              </div>
                            </div>
                          )}

                          {/* Extended Reddit Data Display */}
                          {(redditPosts.length > 0 || redditComments.length > 0) && (
                            <div className="mt-6">
                              <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Globe className="w-6 h-6 text-orange-400" />
                                Reddit Analysis Results
                                <span className="text-sm bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                                  {redditPosts.length + redditComments.length} items
                                </span>
                              </h4>

                              {/* Interactive Reddit Posts */}
                              {(redditPosts.length > 0 || isLoadingAllPosts) && (
                                <div className="mb-8">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-lg font-semibold text-white flex items-center gap-2">
                                      <MessageSquare className="w-5 h-5 text-orange-400" />
                                      Reddit Posts ({redditPosts.length})
                                      {selectedKeywordForAnalysis && (
                                        <span className="text-sm bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                                          {selectedKeywordForAnalysis}
                                        </span>
                                      )}
                                    </h5>
                                    {redditPosts.length > 0 && (
                                      <button
                                        onClick={() => {
                                          setRedditPosts([])
                                          setSelectedKeywordForAnalysis('')
                                          loadAllRedditPosts()
                                        }}
                                        className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        Refresh All
                                      </button>
                                    )}
                                  </div>
                                  
                                  {isLoadingAllPosts ? (
                                    <div className="flex items-center justify-center py-12">
                                      <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                                      <span className="ml-2 text-gray-400">Loading previous Reddit posts...</span>
                                    </div>
                                  ) : redditPosts.length > 0 ? (
                                    <div className="space-y-6">
                                      {redditPosts.map((post, index) => (
                                        <InteractiveRedditPost key={post._id || index} post={post} />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-400">
                                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                      <p>No Reddit posts found. Try searching for a keyword above.</p>
                                    </div>
                                  )}
                                </div>
                              )}


                            </div>
                          )}


                        </div>
                      )}
                    </div>
                  )}
                </div>



                {/* Debates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoadingDebates ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3 mb-4"></div>
                        <div className="flex gap-2 mb-4">
                          <div className="h-6 bg-gray-700 rounded w-16"></div>
                          <div className="h-6 bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="h-8 bg-gray-700 rounded w-full"></div>
                      </div>
                    ))
                  ) : debatesError ? (
                    <div className="col-span-full text-center py-12">
                      <div className="text-red-400 mb-4">{debatesError}</div>
                      <button
                        onClick={fetchDebates}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredDebates.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        {searchQuery ? 'No debates found' : 'No debates yet'}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {searchQuery
                          ? `No debates match "${searchQuery}". Try a different search term.`
                          : 'Be the first to start a meaningful discussion in the community.'
                        }
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowCreateDebate(true)}
                          className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          Create First Debate
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredDebates.map((debate) => {
                      const debateSentiment = calculateDebateSentiment(debate.id)
                      const isJoined = joinedDebates.has(debate.id)

                      return (
                        <div key={debate.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-all duration-300 group">
                          <div className="mb-4">
                            <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors">
                              {debate.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                              {debate.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {debate.tags?.map((tag: string) => (
                                <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                  <Hash className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Sentiment Breakdown */}
                          <div className="mb-4">
                            <div className="text-sm text-gray-400 mb-2">Sentiment Analysis</div>
                            <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                              <div
                                className="bg-emerald-500 transition-all duration-500"
                                style={{ width: `${debateSentiment.positive}%` }}
                              />
                              <div
                                className="bg-gray-500 transition-all duration-500"
                                style={{ width: `${debateSentiment.neutral}%` }}
                              />
                              <div
                                className="bg-red-500 transition-all duration-500"
                                style={{ width: `${debateSentiment.negative}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>{debateSentiment.positive}% Positive</span>
                              <span>{debateSentiment.negative}% Negative</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{debate.participants || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{debate.messages || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              <span className={debate.activity === 'high' ? 'text-emerald-400' : 'text-gray-400'}>
                                {debate.activity || 'low'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDebate(debate.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleJoinDebate(debate.id)}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${isJoined
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                              <Target className="w-4 h-4" />
                              {isJoined ? 'Joined' : 'Join'}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Live Sentiment */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold">Live Sentiment</h3>
                  </div>

                {/* Real-time Sentiment */}
                <div className="bg-gray-950/60 border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-white" />
                      <h3 className="font-bold">Live Sentiment</h3>
                    </div>
                    <button
                      onClick={refreshAllComments}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded text-xs transition-colors"
                      title="Refresh sentiment analysis"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">Positive</span>
                      <span className="text-sm">{Math.round(sentimentData.positive)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${sentimentData.positive}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Minus className="w-4 h-4" />
                        Neutral
                      </span>
                      <span className="font-bold text-gray-400">{sentimentData.neutral}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${sentimentData.neutral}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-red-400 flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4" />
                        Negative
                      </span>
                      <span className="font-bold text-red-400">{sentimentData.negative}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${sentimentData.negative}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reddit Keywords */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-orange-400" />
                      <h3 className="text-lg font-semibold">Reddit Keywords</h3>
                    </div>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                      {availableKeywords.length} topics
                    </span>
                  </div>

                  {availableKeywords.length > 0 ? (
                    <div className="space-y-2">
                      {availableKeywords.slice(0, 8).map((keyword, index) => (
                        <button
                          key={index}
                          onClick={() => handleKeywordSelect(keyword)}
                          className={`group w-full text-left transition-all duration-300 ${
                            selectedKeywordForAnalysis === keyword 
                              ? 'scale-[1.02]' 
                              : 'hover:scale-[1.02]'
                          }`}
                        >
                          <div className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
                            selectedKeywordForAnalysis === keyword
                              ? 'bg-orange-500/20 border border-orange-500/50 shadow-lg shadow-orange-400/10'
                              : 'bg-gray-800/50 border border-gray-600 group-hover:border-orange-500/30 group-hover:bg-orange-500/10'
                          }`}>
                            {/* Animated background effect */}
                            <div className={`absolute inset-0 transition-all duration-500 ${
                              selectedKeywordForAnalysis === keyword
                                ? 'bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent'
                                : 'bg-gradient-to-r from-transparent via-gray-700/5 to-transparent group-hover:from-orange-500/5'
                            }`} />
                            
                            <div className="relative p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Hash className={`w-4 h-4 transition-colors ${
                                  selectedKeywordForAnalysis === keyword
                                    ? 'text-orange-300'
                                    : 'text-gray-400 group-hover:text-orange-400'
                                }`} />
                                <span className={`font-medium transition-colors ${
                                  selectedKeywordForAnalysis === keyword
                                    ? 'text-orange-200'
                                    : 'text-gray-300 group-hover:text-orange-300'
                                }`}>
                                  {keyword}
                                </span>
                              </div>
                              
                              <div className={`flex items-center gap-1 text-xs transition-colors ${
                                selectedKeywordForAnalysis === keyword
                                  ? 'text-orange-400'
                                  : 'text-gray-500 group-hover:text-orange-400'
                              }`}>
                                <BarChart3 className="w-3 h-3" />
                                <span>Analyzed</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {availableKeywords.length > 8 && (
                        <div className="text-center pt-2">
                          <span className="text-xs text-gray-500">
                            +{availableKeywords.length - 8} more keywords
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No Reddit keywords yet</p>
                      <p className="text-xs text-gray-500 mt-1">Search for topics to see them here</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {availableKeywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedKeywordForAnalysis('')
                            loadAllRedditPosts()
                          }}
                          className="flex-1 text-xs bg-gray-800/50 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 px-2 py-1.5 rounded transition-colors"
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => setShowRedditSearch(!showRedditSearch)}
                          className="flex-1 text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-2 py-1.5 rounded transition-colors"
                        >
                          New Search
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-2">Forum Keywords:</div>
                    <div className="flex flex-wrap gap-2">
                      {dynamicKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
                          onClick={() => handleKeywordSelect(keyword)}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold">Top Contributors</h3>
                  </div>

                  <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full text-white font-bold text-sm">
                          {user.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.username}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              {user.aiScore}
                            </span>
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {user.clarity}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {user.engagement}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-400">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Debate Modal */}
      {showCreateDebate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Debate</h3>
              <button
                onClick={() => setShowCreateDebate(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="Enter debate title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                  placeholder="Describe the debate topic..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  placeholder="Enter tags separated by commas (e.g., Environment, Policy, Economy)"
                  maxLength={500}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Each tag max 50 characters, max 10 tags. Don't include # symbols.
                </p>
              </div>

              {createDebateError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {createDebateError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreatingDebate}
                  className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingDebate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Debate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateDebate(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debate View Modal */}
      {selectedDebate && (
        <DebateViewModal
          debate={debates.find(d => d.id === selectedDebate) || null}
          isOpen={!!selectedDebate}
          onClose={() => setSelectedDebate(null)}
          mode={modalMode}
          onCommentPosted={handleCommentPosted}
        />
      )}


    </div>
  )
}