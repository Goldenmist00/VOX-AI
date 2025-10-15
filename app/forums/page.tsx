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
  X
} from "lucide-react"

// Helper function to extract sentiment label from both old and new formats
function getSentimentLabel(sentiment: any): string {
  if (typeof sentiment === 'string') {
    return sentiment
  } else if (sentiment && typeof sentiment === 'object' && sentiment.sentiment_label) {
    return sentiment.sentiment_label.toLowerCase()
  }
  return 'neutral'
}

export default function ForumsPage() {
  const [activeFilter, setActiveFilter] = useState("trending")
  const [selectedDebate, setSelectedDebate] = useState<number | null>(null)
  const [userType, setUserType] = useState<"citizen" | "ngo">("citizen")
  const [sentimentData, setSentimentData] = useState({ positive: 45, negative: 25, neutral: 30 })
  const [keywords, setKeywords] = useState([
    "Climate Action", "Carbon Tax", "Renewable Energy", "Green Jobs", "Sustainability"
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDebateModal, setShowDebateModal] = useState(false)
  const [showJoinDebateModal, setShowJoinDebateModal] = useState(false)
  const [showNewDebateModal, setShowNewDebateModal] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [userVotes, setUserVotes] = useState<{[key: number]: 'agree' | 'disagree' | 'neutral' | null}>({})
  const [messages, setMessages] = useState<any[]>([])
  const [newDebateTitle, setNewDebateTitle] = useState("")
  const [newDebateDescription, setNewDebateDescription] = useState("")
  const [newDebateTags, setNewDebateTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")

  const [debates, setDebates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sampleDebates] = useState([
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
      trending: true,
      votes: { agree: 648, disagree: 387, neutral: 212 }
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
      trending: false,
      votes: { agree: 339, disagree: 401, neutral: 152 }
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
      trending: true,
      votes: { agree: 862, disagree: 820, neutral: 421 }
    }
  ])

  const sampleMessages = [
    {
      id: 1,
      debateId: 1,
      author: "EcoAdvocate2024",
      message: "Carbon tax is essential for reducing emissions. Countries like Sweden have shown it works effectively without harming the economy.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      sentiment: "positive",
      votes: { agree: 23, disagree: 5, neutral: 2 },
      aiScore: 85,
      keywords: ["carbon", "emissions", "sweden", "economy"],
      contextMatch: true,
      geminiAnalysis: true
    },
    {
      id: 2,
      debateId: 1,
      author: "BusinessOwner",
      message: "While I support environmental action, carbon tax could burden small businesses. We need targeted incentives instead of blanket taxes.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      sentiment: "neutral",
      votes: { agree: 18, disagree: 12, neutral: 8 },
      aiScore: 78,
      keywords: ["environmental", "businesses", "incentives", "taxes"],
      contextMatch: true,
      geminiAnalysis: true
    },
    {
      id: 3,
      debateId: 1,
      author: "ClimateScientist",
      message: "The IPCC reports clearly show we need immediate action. Carbon pricing is one of the most effective policy tools available.",
      timestamp: new Date(Date.now() - 1000 * 60 * 8),
      sentiment: "positive",
      votes: { agree: 31, disagree: 3, neutral: 4 },
      aiScore: 92,
      keywords: ["ipcc", "carbon", "pricing", "policy", "tools"],
      contextMatch: true,
      geminiAnalysis: true
    },
    {
      id: 4,
      debateId: 1,
      author: "TaxpayerConcern",
      message: "Another tax? We're already overtaxed. Focus on innovation and technology solutions instead of punishing consumers.",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      sentiment: "negative",
      votes: { agree: 15, disagree: 19, neutral: 6 },
      aiScore: 65,
      keywords: ["innovation", "technology", "solutions", "consumers"],
      contextMatch: false,
      geminiAnalysis: true
    }
  ]

  const leaderboard = [
    { id: 1, username: "PolicyExpert2024", avatar: "PE", aiScore: 94, clarity: 89, engagement: 97 },
    { id: 2, username: "CitizenAdvocate", avatar: "CA", aiScore: 88, clarity: 92, engagement: 84 },
    { id: 3, username: "DebateChampion", avatar: "DC", aiScore: 85, clarity: 87, engagement: 83 },
    { id: 4, username: "ThoughtLeader", avatar: "TL", aiScore: 82, clarity: 85, engagement: 79 }
  ]

  // Load debates from MongoDB
  useEffect(() => {
    loadDebates()
  }, [activeFilter, searchQuery])

  // Initialize messages
  useEffect(() => {
    setMessages(sampleMessages)
  }, [])

  const loadDebates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeFilter) params.append('filter', activeFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`/api/debates?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setDebates(data)
      } else {
        console.error('Failed to load debates:', data.error)
        // Fallback to sample data
        setDebates(sampleDebates)
      }
    } catch (error) {
      console.error('Error loading debates:', error)
      // Fallback to sample data
      setDebates(sampleDebates)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (debateId: string) => {
    try {
      const response = await fetch(`/api/messages?debateId=${debateId}`)
      const data = await response.json()
      
      if (response.ok) {
        setMessages(data)
      } else {
        console.error('Failed to load messages:', data.error)
        setMessages(sampleMessages.filter(m => m.debateId.toString() === debateId))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages(sampleMessages.filter(m => m.debateId.toString() === debateId))
    }
  }

  // Real-time sentiment updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSentimentData(prev => ({
        positive: Math.max(20, Math.min(60, prev.positive + (Math.random() - 0.5) * 4)),
        negative: Math.max(15, Math.min(50, prev.negative + (Math.random() - 0.5) * 3)),
        neutral: Math.max(15, Math.min(40, prev.neutral + (Math.random() - 0.5) * 2))
      }))
      
      // Update debate participant counts
      setDebates(prev => prev.map(debate => ({
        ...debate,
        participants: debate.participants + Math.floor(Math.random() * 3)
      })))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle voting on debates
  const handleVote = async (debateId: string, voteType: 'agree' | 'disagree' | 'neutral') => {
    try {
      setUserVotes(prev => ({ ...prev, [debateId]: voteType }))
      
      const response = await fetch(`/api/debates/${debateId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType })
      })
      
      if (response.ok) {
        const updatedDebate = await response.json()
        setDebates(prev => prev.map(debate => 
          debate._id === debateId ? updatedDebate : debate
        ))
      }
    } catch (error) {
      console.error('Error voting on debate:', error)
    }
  }

  // Handle message voting with Gemini re-scoring
  const handleMessageVote = async (messageId: string, voteType: 'agree' | 'disagree' | 'neutral') => {
    try {
      const response = await fetch(`/api/messages/${messageId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType })
      })
      
      if (response.ok) {
        const updatedMessage = await response.json()
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? updatedMessage : msg
        ))
      }
    } catch (error) {
      console.error('Error voting on message:', error)
    }
  }



  // Send new message with Gemini analysis
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDebate) return
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debateId: selectedDebate,
          author: userType === "citizen" ? "You" : "NGO Representative",
          authorType: userType,
          message: newMessage
        })
      })
      
      if (response.ok) {
        const savedMessage = await response.json()
        setMessages(prev => [...prev, savedMessage])
        setNewMessage("")
        
        // Reload debates to get updated stats
        loadDebates()
        
        // Update keywords if this message had any
        if (savedMessage.keywords && savedMessage.keywords.length > 0) {
          const newKeywords = [...new Set([...keywords, ...savedMessage.keywords])]
          setKeywords(newKeywords.slice(0, 8))
        }
      } else {
        const error = await response.json()
        console.error('Failed to send message:', error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Create new debate
  const handleCreateDebate = async () => {
    if (!newDebateTitle.trim() || !newDebateDescription.trim()) return
    
    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDebateTitle,
          description: newDebateDescription,
          tags: newDebateTags,
          author: userType === "citizen" ? "You" : "NGO Representative",
          authorType: userType
        })
      })
      
      if (response.ok) {
        const savedDebate = await response.json()
        setDebates(prev => [savedDebate, ...prev])
        setNewDebateTitle("")
        setNewDebateDescription("")
        setNewDebateTags([])
        setShowNewDebateModal(false)
      } else {
        const error = await response.json()
        console.error('Failed to create debate:', error)
      }
    } catch (error) {
      console.error('Error creating debate:', error)
    }
  }

  // Add tag to new debate
  const handleAddTag = () => {
    if (currentTag.trim() && !newDebateTags.includes(currentTag.trim())) {
      setNewDebateTags(prev => [...prev, currentTag.trim()])
      setCurrentTag("")
    }
  }

  // Remove tag from new debate
  const handleRemoveTag = (tagToRemove: string) => {
    setNewDebateTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  // Filter debates based on search (filtering is now done server-side)
  const filteredDebates = debates

  // Get messages for selected debate
  const debateMessages = messages.filter(msg => msg.debateId === selectedDebate)

  // Format timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return "Unknown"
    
    const now = new Date()
    const messageTime = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    
    if (isNaN(messageTime.getTime())) return "Unknown"
    
    const diff = now.getTime() - messageTime.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

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
            <div className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
              <a href="/forums" className="text-blue-400 font-medium">Forums</a>
              <a href="/upload" className="text-gray-400 hover:text-white transition-colors">Upload</a>
              <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => setUserType(userType === "citizen" ? "ngo" : "citizen")}
              className="flex items-center gap-2 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-sm">{userType === "citizen" ? "Citizen" : "NGO"}</span>
            </button>
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

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topics (e.g., Climate Policy, Internet Censorship...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <button 
                onClick={() => setShowNewDebateModal(true)}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 border border-blue-500/40 bg-blue-500/10 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/20" />
                <div className="relative border border-blue-400 bg-blue-400 text-black font-bold px-8 py-4 text-lg transition-all duration-300 group-hover:bg-blue-300 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>Start Debate</span>
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
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Debate Cards */}
                <div className="space-y-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <h3 className="text-xl font-bold text-gray-400 mb-2">Loading debates...</h3>
                      <p className="text-gray-500">Fetching real-time discussions</p>
                    </div>
                  ) : filteredDebates.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-400 mb-2">No debates found</h3>
                      <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    filteredDebates.map((debate) => (
                    <div key={debate.id} className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-gray-500 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{debate.title}</h3>
                            {debate.trending && (
                              <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3" />
                                Trending
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 mb-3">{debate.description}</p>
                          <div className="flex items-center gap-2 mb-4">
                            {debate.tags.map((tag) => (
                              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                <Hash className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Users className="w-4 h-4" />
                            <span>{debate.participants.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            <span>{debate.messages}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sentiment Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>Sentiment Analysis</span>
                          <span>AI Score: {debate.aiScore}/100</span>
                        </div>
                        <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${debate.sentiment.positive}%` }}
                          />
                          <div
                            className="bg-gray-500 transition-all duration-500"
                            style={{ width: `${debate.sentiment.neutral}%` }}
                          />
                          <div
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${debate.sentiment.negative}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Positive {debate.sentiment.positive}%</span>
                          <span>Neutral {debate.sentiment.neutral}%</span>
                          <span>Negative {debate.sentiment.negative}%</span>
                        </div>
                      </div>

                      {/* Voting Buttons */}
                      <div className="flex items-center gap-2 mb-4">
                        <button 
                          onClick={() => handleVote(debate._id, 'agree')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            userVotes[debate._id] === 'agree' 
                              ? 'bg-green-500/30 text-green-300 border border-green-500/50' 
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Agree ({debate.votes?.agree || 0})</span>
                        </button>
                        
                        <button 
                          onClick={() => handleVote(debate._id, 'disagree')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            userVotes[debate._id] === 'disagree' 
                              ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>Disagree ({debate.votes?.disagree || 0})</span>
                        </button>
                        
                        <button 
                          onClick={() => handleVote(debate._id, 'neutral')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            userVotes[debate._id] === 'neutral' 
                              ? 'bg-gray-500/30 text-gray-300 border border-gray-500/50' 
                              : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                          <span>Neutral ({debate.votes?.neutral || 0})</span>
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedDebate(debate._id)
                              setShowDebateModal(true)
                              loadMessages(debate._id)
                            }}
                            className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Debate
                          </button>

                          {userType === "ngo" && (
                            <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors">
                              <Target className="w-4 h-4" />
                              🔹 Adopt This Issue
                            </button>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedDebate(debate._id)
                            setShowJoinDebateModal(true)
                            loadMessages(debate._id)
                          }}
                          className="group relative cursor-pointer"
                        >
                          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/20" />
                          <div className="relative border-2 border-dashed border-emerald-400 bg-transparent text-white font-medium px-4 py-2 text-sm transition-all duration-300 group-hover:border-emerald-300 group-hover:bg-gray-900/30 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-300" />
                            <span>Join Debate</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Gemini AI Keywords */}
                <div className="bg-gray-950/60 border border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold">Gemini Keywords</h3>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                      Live Analysis
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
                        style={{
                          animation: `pulse 2s ease-in-out infinite ${index * 0.2}s`
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Keywords extracted from debate context and participant messages
                  </div>
                </div>

                {/* Real-time Sentiment */}
                <div className="bg-gray-950/60 border border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
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
                    <Award className="w-5 h-5 text-yellow-400" />
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

      {/* Debate Modal */}
      {showDebateModal && selectedDebate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {debates.find(d => d.id === selectedDebate)?.title}
              </h2>
              <button 
                onClick={() => setShowDebateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {debateMessages.map((message) => (
                  <div key={message.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">
                          {message.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{message.author}</div>
                          <div className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          getSentimentLabel(message.sentiment) === 'positive' ? 'bg-green-500/20 text-green-400' :
                          getSentimentLabel(message.sentiment) === 'negative' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {getSentimentLabel(message.sentiment)}
                        </span>
                        <span className="text-blue-400">AI: {message.aiScore}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3">{message.message}</p>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleMessageVote(message.id, 'agree')}
                        className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs hover:bg-green-500/20 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {message.votes.agree}
                      </button>
                      <button 
                        onClick={() => handleMessageVote(message.id, 'disagree')}
                        className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        {message.votes.disagree}
                      </button>
                      <button 
                        onClick={() => handleMessageVote(message.id, 'neutral')}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-400 rounded text-xs hover:bg-gray-500/20 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                        {message.votes.neutral}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 bg-gray-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-400">
                  <Eye className="w-6 h-6 opacity-50" />
                  <div>
                    <p className="text-sm">You are viewing this debate in read-only mode.</p>
                    <p className="text-xs mt-1">Join the discussion to participate and comment.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowDebateModal(false)
                    setShowJoinDebateModal(true)
                  }}
                  className="group relative cursor-pointer"
                >
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/20" />
                  <div className="relative border-2 border-dashed border-emerald-400 bg-transparent text-white font-medium px-6 py-3 transition-all duration-300 group-hover:border-emerald-300 group-hover:bg-gray-900/30 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-300" />
                    <span>Join Debate</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Debate Modal (Interactive) */}
      {showJoinDebateModal && selectedDebate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-emerald-900/20 to-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold">
                  {debates.find(d => d.id === selectedDebate)?.title}
                </h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                  Live Discussion
                </span>
              </div>
              <button 
                onClick={() => setShowJoinDebateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {debateMessages.map((message) => (
                  <div key={message.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">
                          {message.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{message.author}</div>
                          <div className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          getSentimentLabel(message.sentiment) === 'positive' ? 'bg-green-500/20 text-green-400' :
                          getSentimentLabel(message.sentiment) === 'negative' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {getSentimentLabel(message.sentiment)}
                        </span>
                        <span className="text-blue-400">AI: {message.aiScore}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3">{message.message}</p>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleMessageVote(message.id, 'agree')}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs hover:bg-green-500/20 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {message.votes.agree}
                      </button>
                      <button 
                        onClick={() => handleMessageVote(message.id, 'disagree')}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs hover:bg-red-500/20 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        {message.votes.disagree}
                      </button>
                      <button 
                        onClick={() => handleMessageVote(message.id, 'neutral')}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-xs hover:bg-gray-500/20 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                        {message.votes.neutral}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 bg-gradient-to-r from-emerald-900/10 to-blue-900/10">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {userType === "citizen" ? "Y" : "N"}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Share your thoughts on this debate..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none transition-colors"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Gemini AI will analyze sentiment, keywords & relevancy (10-100 score)</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {newMessage.length}/500
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Debate Modal */}
      {showNewDebateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Start New Debate</h2>
              <button 
                onClick={() => setShowNewDebateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter debate title..."
                  value={newDebateTitle}
                  onChange={(e) => setNewDebateTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  placeholder="Describe what this debate is about..."
                  value={newDebateDescription}
                  onChange={(e) => setNewDebateDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                  />
                  <button 
                    onClick={handleAddTag}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newDebateTags.map((tag) => (
                    <span 
                      key={tag}
                      className="flex items-center gap-2 bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleCreateDebate}
                disabled={!newDebateTitle.trim() || !newDebateDescription.trim()}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Debate
              </button>
              <button 
                onClick={() => setShowNewDebateModal(false)}
                className="px-6 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
