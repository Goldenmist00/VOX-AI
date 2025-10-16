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
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import CommentSystem from "../components/CommentSystem"
import DebateViewModal from "../components/DebateViewModal"

export default function ForumsPage() {
  const { user, logout } = useAuth()
  const [activeFilter, setActiveFilter] = useState("trending")
  const [selectedDebate, setSelectedDebate] = useState<number | null>(null)
  const [sentimentData, setSentimentData] = useState({ positive: 45, negative: 25, neutral: 30 })
  const [keywords, setKeywords] = useState([
    "Climate Action", "Carbon Tax", "Renewable Energy", "Green Jobs", "Sustainability"
  ])
  const [joinedDebates, setJoinedDebates] = useState<Set<number>>(new Set())
  const [showCreateDebate, setShowCreateDebate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allComments, setAllComments] = useState<any[]>([])
  const [dynamicKeywords, setDynamicKeywords] = useState([
    "Climate Action", "Carbon Tax", "Renewable Energy", "Green Jobs", "Sustainability"
  ])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [isCreatingDebate, setIsCreatingDebate] = useState(false)
  const [createDebateError, setCreateDebateError] = useState("")

  const [debates, setDebates] = useState([
    {
      id: 1,
      title: "Should Carbon Tax Be Implemented Nationwide?",
      description: "Discussing the economic and environmental impacts of implementing a federal carbon tax policy.",
      tags: ["Environment", "Policy", "Economy"],
      participants: 1247,
      sentiment: { positive: 52, negative: 31, neutral: 17 },
      activity: "high",
      aiScore: 87,
      messages: 342,
      trending: true
    },
    {
      id: 2,
      title: "Internet Censorship vs Free Speech",
      description: "Balancing online safety with freedom of expression in the digital age.",
      tags: ["Technology", "Rights", "Law"],
      participants: 892,
      sentiment: { positive: 38, negative: 45, neutral: 17 },
      activity: "medium",
      aiScore: 73,
      messages: 156,
      trending: false
    },
    {
      id: 3,
      title: "Universal Basic Income: Economic Solution or Risk?",
      description: "Exploring the potential benefits and drawbacks of implementing UBI programs.",
      tags: ["Economy", "Social Policy", "Innovation"],
      participants: 2103,
      sentiment: { positive: 41, negative: 39, neutral: 20 },
      activity: "high",
      aiScore: 91,
      messages: 578,
      trending: true
    }
  ])

  const leaderboard = [
    { id: 1, username: "PolicyExpert2024", avatar: "PE", aiScore: 94, clarity: 89, engagement: 97 },
    { id: 2, username: "CitizenAdvocate", avatar: "CA", aiScore: 88, clarity: 92, engagement: 84 },
    { id: 3, username: "DebateChampion", avatar: "DC", aiScore: 85, clarity: 87, engagement: 83 },
    { id: 4, username: "ThoughtLeader", avatar: "TL", aiScore: 82, clarity: 85, engagement: 79 }
  ]

  const handleJoinDebate = (debateId: number) => {
    setJoinedDebates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(debateId)) {
        newSet.delete(debateId)
      } else {
        newSet.add(debateId)
      }
      return newSet
    })
  }

  const handleViewDebate = (debateId: number) => {
    setSelectedDebate(debateId)
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
  const calculateDebateSentiment = (debateId: number) => {
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
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

    // Combine with original keywords and remove duplicates
    const combined = [...new Set([...dynamicKeywords, ...topWords])]
    return combined.slice(0, 8) // Limit to 8 keywords
  }

  // Add comment to global state
  const addComment = (comment: any, debateId: number) => {
    const commentWithDebateId = { ...comment, debateId }
    setAllComments(prev => [commentWithDebateId, ...prev])
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
        
        // Update the debates array (we'll need to make it stateful)
        setDebates(prev => [newDebate, ...prev])
        
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
      debate.tags.some(tag => tag.toLowerCase().includes(query)) ||
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

  useEffect(() => {
    // Add some initial mock comments for demonstration
    const initialComments = [
      {
        id: "1",
        content: "I believe carbon tax is essential for reducing emissions. The economic benefits outweigh the costs.",
        analysis: { sentiment: { overall: "positive" } },
        debateId: 1
      },
      {
        id: "2", 
        content: "Carbon tax will hurt low-income families the most. We need alternative solutions.",
        analysis: { sentiment: { overall: "negative" } },
        debateId: 1
      },
      {
        id: "3",
        content: "What about implementing carbon tax with rebates for low-income households?",
        analysis: { sentiment: { overall: "positive" } },
        debateId: 1
      },
      {
        id: "4",
        content: "Internet censorship is necessary to protect children from harmful content online.",
        analysis: { sentiment: { overall: "positive" } },
        debateId: 2
      },
      {
        id: "5",
        content: "Censorship violates our fundamental right to free speech and expression.",
        analysis: { sentiment: { overall: "negative" } },
        debateId: 2
      }
    ]
    setAllComments(initialComments)
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
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative">
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
                🗣️ Real-Time Debate Analyzer
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
        <div className="px-6 lg:px-12 pb-16">
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

                {/* Filter Tabs */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex bg-gray-900/50 border border-gray-700 rounded-lg p-1">
                    {[
                      { id: "trending", label: "Trending", icon: TrendingUp },
                      { id: "latest", label: "Latest", icon: Clock },
                      { id: "active", label: "Most Active", icon: Activity }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveFilter(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeFilter === id
                          ? "bg-blue-500 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Debate Cards */}
                <div className="space-y-6">
                  {filteredDebates.map((debate) => (
                    <div key={debate.id} className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-gray-500 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{debate.title}</h3>
                            {debate.trending && (
                              <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-white" />
                                Trending
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 mb-3">{debate.description}</p>
                          <div className="flex items-center gap-2 mb-4">
                            {debate.tags.map((tag) => (
                              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                <Hash className="w-3 h-3 text-white" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Users className="w-4 h-4 text-white" />
                            <span>{debate.participants.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MessageSquare className="w-4 h-4 text-white" />
                            <span>{debate.messages}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sentiment Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>Live Sentiment Analysis</span>
                          <span>AI Score: {debate.aiScore}/100</span>
                        </div>
                        {(() => {
                          const debateSentiment = calculateDebateSentiment(debate.id)
                          return (
                            <>
                              <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="bg-green-500 transition-all duration-500"
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
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>Positive {debateSentiment.positive}%</span>
                                <span>Neutral {debateSentiment.neutral}%</span>
                                <span>Negative {debateSentiment.negative}%</span>
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleViewDebate(debate.id)}
                            className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-white" />
                            View Debate
                          </button>
                          
                          <button 
                            onClick={() => handleJoinDebate(debate.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                              joinedDebates.has(debate.id)
                                ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                                : "bg-gray-700/50 text-gray-300 hover:bg-emerald-500/20 hover:text-emerald-400"
                            }`}
                          >
                            {joinedDebates.has(debate.id) ? (
                              <>
                                <MessageSquare className="w-4 h-4 text-white" />
                                Joined
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 text-white" />
                                Join Debate
                              </>
                            )}
                          </button>
                        </div>

                        {user && (user.role === "ngo" || user.role === "policymaker") && (
                          <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors">
                            <Target className="w-4 h-4 text-white" />
                            🔹 Adopt This Issue
                          </button>
                        )}
                      </div>

                      {/* Comment System */}
                      <CommentSystem 
                        debateId={debate.id}
                        debateTopic={debate.title}
                        isJoined={joinedDebates.has(debate.id)}
                        onCommentAdded={addComment}
                      />
                    </div>
                  ))}
                  
                  {/* No Results Message */}
                  {searchQuery && filteredDebates.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No debates found</h3>
                        <p className="text-gray-500">
                          No debates match your search for "<span className="text-white">{searchQuery}</span>"
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Try searching for different keywords or check your spelling
                        </p>
                      </div>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Keywords */}
                <div className="bg-gray-950/60 border border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-white" />
                    <h3 className="font-bold">AI Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dynamicKeywords.map((keyword, index) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
                        style={{
                          animation: `pulse 2s ease-in-out infinite ${index * 0.2}s`
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Real-time Sentiment */}
                <div className="bg-gray-950/60 border border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-white" />
                    <h3 className="font-bold">Live Sentiment</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">Positive</span>
                      <span className="text-sm">{Math.round(sentimentData.positive)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${sentimentData.positive}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Neutral</span>
                      <span className="text-sm">{Math.round(sentimentData.neutral)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${sentimentData.neutral}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-red-400">Negative</span>
                      <span className="text-sm">{Math.round(sentimentData.negative)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${sentimentData.negative}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-gray-950/60 border border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-white" />
                    <h3 className="font-bold">Top Contributors</h3>
                  </div>
                  <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full text-xs font-bold">
                          {user.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.username}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>Score: {user.aiScore}</span>
                            <span>•</span>
                            <span>Clarity: {user.clarity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-400">#{index + 1}</div>
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

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-12 lg:px-12 bg-gray-950 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-lg">Built for civil discourse.</span>
            </div>
            <div className="text-gray-700 text-sm">© {new Date().getFullYear()} VOX AI. Insight from debate.</div>
          </div>
        </div>
      </footer>

      {/* Create Debate Modal */}
      {showCreateDebate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Debate</h2>
              <button 
                onClick={() => setShowCreateDebate(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDebate} className="space-y-6">
              {createDebateError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                  {createDebateError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Debate Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Enter a compelling debate title..."
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 200 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  maxLength={1000}
                  placeholder="Describe the debate topic and key points for discussion..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 1000 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  placeholder="Enter tags separated by commas (e.g., Environment, Policy, Economy)"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 10 tags, 50 characters each</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreateDebate(false)
                    setCreateDebateError("")
                  }}
                  disabled={isCreatingDebate}
                  className="flex-1 bg-gray-700 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingDebate}
                  className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingDebate ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Debate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debate View Modal */}
      <DebateViewModal
        debate={selectedDebate ? debates.find(d => d.id === selectedDebate) || null : null}
        isOpen={selectedDebate !== null}
        onClose={() => setSelectedDebate(null)}
      />
    </div>
  )
}