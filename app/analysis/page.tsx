"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Hash,
  MessageSquare,
  Users,
  FileText,
  BarChart3,
  Award,
  TrendingUp,
  Download,
  Copy,
  Check,
  Bell,
  User,
  Target,
  Zap,
  ArrowLeft,
  Sparkles,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Activity,
  Clock,
  X,
  Cpu,
  Home,
  Upload,
  LayoutDashboard,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

function AnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showActionPlan, setShowActionPlan] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [actionPlan, setActionPlan] = useState<any[]>([])
  const [isGeneratingActionPlan, setIsGeneratingActionPlan] = useState(false)

  // Load analysis data from API
  useEffect(() => {
    const loadAnalysis = async () => {
      const content = searchParams.get('content')
      const error = searchParams.get('error')
      
      if (error) {
        setError('Failed to read uploaded file. Please try again.')
        setIsLoading(false)
        return
      }
      
      if (!content) {
        setError('No document content provided for analysis.')
        setIsLoading(false)
        return
      }
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to analyze document')
        }
        
        const data = await response.json()
        setAnalysisResults(data.analysis)
        setIsLoading(false)
      } catch (err) {
        console.error('Analysis error:', err)
        setError('Failed to analyze document. Please try again.')
        setIsLoading(false)
      }
    }
    
    loadAnalysis()
  }, [searchParams])

  const generateActionPlan = async () => {
    if (!analysisResults) return
    
    setIsGeneratingActionPlan(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: searchParams.get('content'),
          actionPlanTopic: analysisResults.topic.title,
          actionPlanSummary: analysisResults.summary
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate action plan')
      }
      
      const data = await response.json()
      setActionPlan(data.actionPlan || [])
      setShowActionPlan(true)
    } catch (err) {
      console.error('Action plan generation error:', err)
      // Fallback to default action plan
      setActionPlan([
        {
          step: 1,
          title: "Community Engagement Campaign",
          description: "Launch public forums and digital surveys to gather comprehensive community input on housing priorities.",
          timeline: "2-4 weeks",
          resources: ["Community organizers", "Digital platform", "Meeting venues"]
        },
        {
          step: 2,
          title: "Policy Research & Advocacy",
          description: "Develop evidence-based policy proposals for zoning reform and green building incentives.",
          timeline: "6-8 weeks",
          resources: ["Policy researchers", "Legal experts", "Data analysts"]
        },
        {
          step: 3,
          title: "Stakeholder Coalition Building",
          description: "Build partnerships with local government, developers, and community organizations for implementation.",
          timeline: "8-12 weeks",
          resources: ["Partnership coordinators", "Government liaisons", "Community leaders"]
        }
      ])
      setShowActionPlan(true)
    } finally {
      setIsGeneratingActionPlan(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysisResults.summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
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

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 lg:px-12 bg-gray-950 relative z-20">
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
              <a href="/forums" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                <MessageSquare className="w-4 h-4" />
                <span>Forums</span>
              </a>
              <a href="/upload" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </a>
              <a href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </a>
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
      </header>

      {/* Page Header */}
      <div className="px-6 lg:px-12 py-12 bg-gray-950 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">AI Analysis Complete</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
               Debate Analysis Report
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive AI-powered insights from your uploaded discussion
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">Analyzing Document</h2>
                <p className="text-gray-400">AI is processing your document and generating insights...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-red-400">Analysis Failed</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <button 
                  onClick={() => router.push('/upload')}
                  className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            </div>
          ) : analysisResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Topic Card */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Hash className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">Discussion Topic</h2>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{analysisResults.topic.title}</h3>
                  <p className="text-gray-400 mb-4">{analysisResults.topic.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                      {analysisResults.topic.category}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      {analysisResults.topic.date}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                      {analysisResults.topic.duration}
                    </span>
                  </div>
                </div>

                {/* Main Points */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">Key Discussion Points</h2>
                  </div>
                  <div className="space-y-4">
                    {analysisResults.mainPoints.map((point: any, index: number) => (
                      <div key={index} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-gray-200 flex-1">{point.text}</p>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`${getSentimentColor(point.sentiment)} flex items-center gap-1`}>
                              {getSentimentIcon(point.sentiment)}
                              {point.sentiment}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4 text-white" />
                              {point.relevance}% relevance
                            </span>
                            <div className="relative group">
                              <span className="flex items-center gap-1 cursor-pointer hover:text-blue-400 transition-colors">
                                <Users className="w-4 h-4 text-white" />
                                {point.mentions} mentions
                              </span>
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
                                <div className="text-xs text-gray-300 mb-1">Contributors:</div>
                                <div className="space-y-1">
                                  {point.contributors.map((contributor: string, idx: number) => (
                                    <div key={idx} className="text-xs text-blue-400 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                      {contributor}
                                    </div>
                                  ))}
                                </div>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600"></div>
                              </div>
                            </div>
                          </div>
                          <div className="relative group">
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-gray-600 transition-colors">
                              {point.contributors.length} contributors
                            </span>
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
                              <div className="text-xs text-gray-300 mb-1">All Contributors:</div>
                              <div className="space-y-1">
                                {point.contributors.map((contributor: string, idx: number) => (
                                  <div key={idx} className="text-xs text-emerald-400 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                                    {contributor}
                                  </div>
                                ))}
                              </div>
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">AI Summary</h2>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">{analysisResults.summary}</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                      {copied ? 'Copied!' : 'Copy Summary'}
                    </button>
                    <button className="flex items-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                      <Download className="w-4 h-4 text-white" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Proposed Solution */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">Proposed Solution</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Solution Overview */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Solution Overview
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {typeof analysisResults.solution === 'string' 
                          ? analysisResults.solution 
                          : analysisResults.solution?.recommendation || 'Solution details not available'
                        }
                      </p>
                    </div>

                    {/* Implementation Framework */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Implementation Framework
                      </h3>
                      
                      {typeof analysisResults.solution === 'object' && analysisResults.solution?.timeline ? (
                        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-3">Timeline</h4>
                          <p className="text-sm text-gray-400">{analysisResults.solution.timeline}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <span className="text-blue-400 font-bold text-sm">1</span>
                              </div>
                              <h4 className="font-semibold text-white">Immediate Actions</h4>
                            </div>
                            <p className="text-sm text-gray-400">Short-term solutions that can be implemented within 1-3 months to address urgent concerns.</p>
                          </div>
                          
                          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <span className="text-emerald-400 font-bold text-sm">2</span>
                              </div>
                              <h4 className="font-semibold text-white">Strategic Planning</h4>
                            </div>
                            <p className="text-sm text-gray-400">Medium-term initiatives requiring 3-12 months for comprehensive policy development and stakeholder alignment.</p>
                          </div>
                          
                          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <span className="text-purple-400 font-bold text-sm">3</span>
                              </div>
                              <h4 className="font-semibold text-white">Long-term Vision</h4>
                            </div>
                            <p className="text-sm text-gray-400">Sustainable solutions spanning 1-3 years for systemic change and lasting impact.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stakeholders */}
                    {typeof analysisResults.solution === 'object' && analysisResults.solution?.stakeholders && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Key Stakeholders
                        </h3>
                        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                          <p className="text-sm text-gray-400">{analysisResults.solution.stakeholders}</p>
                        </div>
                      </div>
                    )}

                    {/* Success Metrics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Success Metrics
                      </h3>
                      
                      {typeof analysisResults.solution === 'object' && analysisResults.solution?.successMetrics ? (
                        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-3">Key Success Metrics</h4>
                          <p className="text-sm text-gray-400">{analysisResults.solution.successMetrics}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Community Engagement</div>
                            <div className="text-emerald-400 font-semibold">Increased participation in public forums</div>
                          </div>
                          <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Policy Implementation</div>
                            <div className="text-blue-400 font-semibold">Adoption of recommended policies</div>
                          </div>
                          <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Stakeholder Satisfaction</div>
                            <div className="text-purple-400 font-semibold">Positive feedback from all parties</div>
                          </div>
                          <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                            <div className="text-sm text-gray-400 mb-1">Measurable Outcomes</div>
                            <div className="text-yellow-400 font-semibold">Quantifiable improvements in key areas</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Sentiment Overview */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold">Sentiment Overview</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-white" />
                        Positive
                      </span>
                      <span className="text-emerald-400 font-semibold">{analysisResults.sentiment.positive}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Minus className="w-4 h-4 text-white" />
                        Neutral
                      </span>
                      <span className="text-gray-400 font-semibold">{analysisResults.sentiment.neutral}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4 text-white" />
                        Negative
                      </span>
                      <span className="text-red-400 font-semibold">{analysisResults.sentiment.negative}%</span>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-medium">Overall</span>
                        <span className="text-gray-300 font-semibold">{analysisResults.sentiment.overall}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Contributors */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold">Top Contributors</h3>
                  </div>
                  <div className="space-y-3">
                    {analysisResults.contributors
                      .sort((a: any, b: any) => b.score - a.score)
                      .slice(0, 5)
                      .map((contributor: any, index: number) => (
                      <div key={index} className="relative group">
                        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">#{index + 1}</span>
                            </div>
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-blue-400 font-semibold text-sm">{contributor.avatar}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contributor.name}</span>
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                {contributor.tag}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{contributor.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-400">{contributor.score}</div>
                            <div className="text-xs text-gray-500">score</div>
                          </div>
                        </div>
                        
                        {/* Detailed Contributor Info Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-20 min-w-[300px]">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">#{index + 1}</span>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-blue-400 font-semibold text-lg">{contributor.avatar}</span>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{contributor.name}</h4>
                                <p className="text-sm text-gray-400">{contributor.role}</p>
                                <p className="text-xs text-yellow-400">Ranked #{index + 1} Contributor</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-gray-700/50 rounded p-2">
                                <div className="text-gray-400 text-xs">Contributions</div>
                                <div className="text-emerald-400 font-semibold">{contributor.contributions}</div>
                              </div>
                              <div className="bg-gray-700/50 rounded p-2">
                                <div className="text-gray-400 text-xs">Clarity Score</div>
                                <div className="text-blue-400 font-semibold">{contributor.clarity}%</div>
                              </div>
                              <div className="bg-gray-700/50 rounded p-2">
                                <div className="text-gray-400 text-xs">Engagement</div>
                                <div className="text-purple-400 font-semibold">{contributor.engagement}%</div>
                              </div>
                              <div className="bg-gray-700/50 rounded p-2">
                                <div className="text-gray-400 text-xs">Overall Score</div>
                                <div className="text-yellow-400 font-semibold">{contributor.score}</div>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-600">
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                {contributor.tag}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold">Key Insights</h3>
                  </div>
                  <div className="space-y-2">
                    {analysisResults.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {user && (user.role === "ngo" || user.role === "policymaker") && (
                  <div className="bg-gray-950 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Take Action</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                        <Target className="w-5 h-5 text-white" />
                        🔹 Adopt This Issue
                      </button>
                      <button 
                        onClick={generateActionPlan}
                        disabled={isGeneratingActionPlan}
                        className="w-full flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-3 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingActionPlan ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 text-white" />
                            <span>🤖 Generate Action Plan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Plan Modal */}
      {showActionPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">AI Action Plan Generator</h2>
              <button 
                onClick={() => setShowActionPlan(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="space-y-6">
              {actionPlan.map((step, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-bold">{step.step}</span>
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-4 h-4 text-white" />
                      {step.timeline}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Activity className="w-4 h-4 text-white" />
                      {step.resources.length} resources
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 mt-8">
              <button className="flex items-center gap-2 bg-gray-700 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
                <Download className="w-5 h-5 text-white" />
                Export Plan
              </button>
              <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                <Target className="w-5 h-5 text-white" />
                Add to Dashboard
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

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analysis...</p>
        </div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  )
}