"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Users,
  FileText,
  Download,
  Eye,
  Target,
  Zap,
  TrendingUp,
  MessageSquare,
  Hash,
  Award,
  Bell,
  User,
  ChevronDown,
  Copy,
  Save,
  Mail,
  Phone,
  Calendar,
  Activity,
  PieChart,
  LineChart,
  Building,
  Shield,
  X,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Globe,
  Users2,
  Briefcase,
  Home,
  Upload,
  LayoutDashboard,
  LogOut,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import IntegrationStatus from "@/components/IntegrationStatus"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [userRole, setUserRole] = useState<"ngo" | "policymaker">("ngo")
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showCampaignPlan, setShowCampaignPlan] = useState(false)
  const [showPolicyBrief, setShowPolicyBrief] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  // Real data states
  const [analytics, setAnalytics] = useState<any>(null)
  const [publicIssues, setPublicIssues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [campaignPlan, setCampaignPlan] = useState<any>(null)
  const [policyBrief, setPolicyBrief] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [adoptedIssues, setAdoptedIssues] = useState<any[]>([])
  const [isAdopting, setIsAdopting] = useState(false)
  const [showAdoptModal, setShowAdoptModal] = useState(false)
  const [adoptIssueData, setAdoptIssueData] = useState<any>(null)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)

  // Fetch dashboard analytics on mount and when user role changes
  useEffect(() => {
    if (user && ['ngo', 'policymaker'].includes(user.role)) {
      fetchDashboardData()
      fetchAdoptedIssues()
    }
  }, [user])

  // Update user role based on actual user data
  useEffect(() => {
    if (user && user.role) {
      setUserRole(user.role as "ngo" | "policymaker")
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch('/api/dashboard/analytics', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
        setPublicIssues(data.publicIssues)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdoptedIssues = async () => {
    try {
      const response = await fetch('/api/dashboard/adopt-issue', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAdoptedIssues(data.adoptedIssues || [])
      }
    } catch (err) {
      console.error('Error fetching adopted issues:', err)
    }
  }

  const generateCampaignPlan = async (issue: any) => {
    try {
      setIsGenerating(true)
      
      const response = await fetch('/api/dashboard/generate-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issueId: issue.id,
          issueTitle: issue.title,
          issueDescription: issue.description,
          sentiment: issue.sentiment,
          consensusScore: issue.consensusScore,
          keyPoints: issue.keyPoints
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCampaignPlan(data.campaignPlan)
        setShowCampaignPlan(true)
      } else {
        alert('Failed to generate campaign plan. Please try again.')
      }
    } catch (err) {
      console.error('Error generating campaign plan:', err)
      alert('Error generating campaign plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePolicyBrief = async (issue: any) => {
    try {
      setIsGenerating(true)
      
      const response = await fetch('/api/dashboard/generate-policy-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issueId: issue.id,
          issueTitle: issue.title,
          issueDescription: issue.description,
          sentiment: issue.sentiment,
          consensusScore: issue.consensusScore,
          keyPoints: issue.keyPoints
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPolicyBrief(data.policyBrief)
        setShowPolicyBrief(true)
      } else {
        alert('Failed to generate policy brief. Please try again.')
      }
    } catch (err) {
      console.error('Error generating policy brief:', err)
      alert('Error generating policy brief')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadCampaignPlan = () => {
    const plan = generatedPlan || campaignPlan
    if (!plan) return
    
    let content = `${plan.title}\n\n`
    if (plan.objective) {
      content += `OBJECTIVE:\n${plan.objective}\n\n`
    }
    if (plan.targetAudience) {
      content += `TARGET AUDIENCE:\n${plan.targetAudience}\n\n`
    }
    
    content += `CAMPAIGN STEPS:\n\n`
    plan.steps?.forEach((step: any) => {
      content += `STEP ${step.step}: ${step.title}\n`
      content += `${step.description}\n`
      content += `Timeline: ${step.timeline}\n`
      content += `Resources: ${step.resources}\n`
      if (step.successMetrics) {
        content += `Success Metrics: ${step.successMetrics}\n`
      }
      if (step.keyActivities) {
        content += `Key Activities:\n${step.keyActivities.map((a: string) => `  - ${a}`).join('\n')}\n`
      }
      content += `\n`
    })

    if (plan.risks) {
      content += `\nRISKS:\n${plan.risks.map((r: string) => `- ${r}`).join('\n')}\n`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign-plan-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPolicyBrief = () => {
    const brief = generatedPlan || policyBrief
    if (!brief) return
    
    let content = `${brief.title}\n\n`
    
    if (brief.executiveSummary) {
      content += `EXECUTIVE SUMMARY:\n${brief.executiveSummary}\n\n`
    }
    
    content += `PUBLIC CONSENSUS:\n${brief.consensus}\n\n`
    content += `SENTIMENT ANALYSIS:\n${brief.sentiment}\n\n`
    
    if (brief.urgency) {
      content += `URGENCY LEVEL: ${brief.urgency.toUpperCase()}\n\n`
    }
    
    if (brief.publicDemands) {
      content += `PUBLIC DEMANDS:\n${brief.publicDemands.map((d: string) => `- ${d}`).join('\n')}\n\n`
    }
    
    if (brief.policyRecommendations) {
      content += `POLICY RECOMMENDATIONS:\n${brief.policyRecommendations.map((r: string) => `- ${r}`).join('\n')}\n\n`
    }
    
    if (brief.implementationPriority) {
      content += `IMPLEMENTATION PRIORITY:\n`
      if (brief.implementationPriority.immediate) {
        content += `\nImmediate Actions:\n${brief.implementationPriority.immediate.map((i: string) => `  - ${i}`).join('\n')}\n`
      }
      if (brief.implementationPriority.shortTerm) {
        content += `\nShort-term Actions:\n${brief.implementationPriority.shortTerm.map((i: string) => `  - ${i}`).join('\n')}\n`
      }
      if (brief.implementationPriority.longTerm) {
        content += `\nLong-term Actions:\n${brief.implementationPriority.longTerm.map((i: string) => `  - ${i}`).join('\n')}\n\n`
      }
    }

    if (brief.costBenefitSummary) {
      content += `COST-BENEFIT ANALYSIS:\n${brief.costBenefitSummary}\n\n`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `policy-brief-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadIssueInsights = (issue: any) => {
    let content = `${issue.title}\n\n`
    content += `DESCRIPTION:\n${issue.description || issue.summary}\n\n`
    content += `TAGS: ${issue.tags?.join(', ') || 'No tags'}\n\n`
    
    if (issue.sentiment) {
      content += `SENTIMENT ANALYSIS:\n`
      content += `- Positive: ${issue.sentiment.positive || 0}%\n`
      content += `- Neutral: ${issue.sentiment.neutral || 0}%\n`
      content += `- Negative: ${issue.sentiment.negative || 0}%\n\n`
    }
    
    content += `CONSENSUS SCORE: ${issue.consensusScore || 0}/100\n\n`
    content += `PARTICIPANTS: ${issue.participants || 0}\n\n`
    
    if (issue.keyPoints && issue.keyPoints.length > 0) {
      content += `KEY POINTS:\n${issue.keyPoints.map((p: string) => `- ${p}`).join('\n')}\n\n`
    }
    
    if (issue.contributors && issue.contributors.length > 0) {
      content += `TOP CONTRIBUTORS:\n`
      issue.contributors.forEach((c: any) => {
        content += `- ${c.name} (${c.tag}): Score ${c.score}\n`
      })
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `issue-insights-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleAdoptIssue = async (issue: any) => {
    // Check if already adopted
    const alreadyAdopted = adoptedIssues.some(
      (adopted: any) => adopted.debateId._id === issue.id || adopted.debateId === issue.id
    )

    if (alreadyAdopted) {
      alert('You have already adopted this issue!')
      return
    }

    // Store the issue and start generating the plan
    setAdoptIssueData(issue)
    setShowAdoptModal(true)
    setIsGenerating(true)
    setGeneratedPlan(null)

    // Generate appropriate plan based on user role
    try {
      const endpoint = userRole === 'ngo' 
        ? '/api/dashboard/generate-campaign' 
        : '/api/dashboard/generate-policy-brief'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          issueId: issue.id,
          issueTitle: issue.title,
          issueDescription: issue.description,
          sentiment: issue.sentiment,
          consensusScore: issue.consensusScore,
          keyPoints: issue.keyPoints
        })
      })

      if (response.ok) {
        const data = await response.json()
        const plan = userRole === 'ngo' ? data.campaignPlan : data.policyBrief
        setGeneratedPlan(plan)
      } else {
        alert('Failed to generate action plan. You can still adopt the issue.')
      }
    } catch (err) {
      console.error('Error generating plan:', err)
      alert('Error generating action plan. You can still adopt the issue.')
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmAdoptIssue = async () => {
    if (!adoptIssueData) return

    try {
      setIsAdopting(true)
      
      const response = await fetch('/api/dashboard/adopt-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          debateId: adoptIssueData.id,
          notes: `Adopted by ${userRole} for action`,
          campaignPlan: userRole === 'ngo' ? generatedPlan : undefined,
          policyBrief: userRole === 'policymaker' ? generatedPlan : undefined
        })
      })

      if (response.ok) {
        alert('Issue adopted successfully with action plan!')
        setShowAdoptModal(false)
        setAdoptIssueData(null)
        setGeneratedPlan(null)
        fetchAdoptedIssues() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to adopt issue')
      }
    } catch (err) {
      console.error('Error adopting issue:', err)
      alert('Error adopting issue')
    } finally {
      setIsAdopting(false)
    }
  }

  const getSentimentColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-500'
      case 'negative': return 'bg-red-500'
      case 'neutral': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
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
              <a href="/dashboard" className="flex items-center gap-2 text-blue-400 font-medium px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </a>
              <a href="/profile" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5 text-white" />
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <a href="/profile" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                  <User className="w-4 h-4" />
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="text-gray-500">({user.role})</span>
                </a>
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
                🏛️ Public Insight Dashboard
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
                Where NGOs and Policymakers turn collective public voice into real-world action.
              </p>
              {user && (
                <div className="inline-flex items-center gap-3 bg-gray-900/50 border border-gray-700 rounded-lg px-6 py-3">
                  <div className={`w-3 h-3 rounded-full ${
                    userRole === "ngo" ? "bg-emerald-500" : "bg-blue-500"
                  } animate-pulse`} />
                  <span className="text-lg font-medium text-gray-300">
                    Viewing as 
                  </span>
                  <span className={`text-xl font-bold ${
                    userRole === "ngo" ? "text-emerald-400" : "text-blue-400"
                  }`}>
                    {userRole === "ngo" ? "NGO" : "Policymaker"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 lg:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Analytics Dashboard */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                <span className="ml-4 text-gray-400">Loading dashboard data...</span>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 mb-12">
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={fetchDashboardData}
                  className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <div className="bg-gray-950/60 border border-gray-700 p-6 hover:border-blue-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="w-6 h-6 text-white" />
                      <h3 className="font-bold">Total Issues</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">{analytics.totalIssues}</div>
                    <div className="text-sm text-gray-400">Analyzed discussions</div>
                  </div>

                  <div className="bg-gray-950/60 border border-gray-700 p-6 hover:border-emerald-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="w-6 h-6 text-white" />
                      <h3 className="font-bold">Active {userRole === "ngo" ? "Campaigns" : "Policies"}</h3>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{analytics.activeCampaigns}</div>
                    <div className="text-sm text-gray-400">In progress</div>
                  </div>

                  <div className="bg-gray-950/60 border border-gray-700 p-6 hover:border-yellow-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-white" />
                      <h3 className="font-bold">Avg Consensus</h3>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{analytics.avgConsensus}%</div>
                    <div className="text-sm text-gray-400">Public agreement</div>
                  </div>

                  <div className="bg-gray-950/60 border border-gray-700 p-6 hover:border-purple-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-6 h-6 text-purple-400" />
                      <h3 className="font-bold">Participants</h3>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{analytics.totalParticipants.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total voices</div>
                  </div>
                </div>
              </>
            ) : null}

            {/* Public Issues Panel */}
            {/* Integration Status Section */}
            {!isLoading && !error && (
              <>
                <div className="mb-12">
                  <IntegrationStatus />
                </div>

                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">Top Analyzed Public Discussions</h2>
                  </div>
                  
                  {publicIssues.length === 0 ? (
                    <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-8 text-center">
                      <p className="text-gray-400">No public discussions available yet. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {publicIssues.map((issue) => {
                        const isAdopted = adoptedIssues.some(
                          (adopted: any) => (adopted.debateId._id || adopted.debateId) === issue.id
                        )
                        return (
                  <div key={issue.id} className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-gray-500 transition-all duration-300">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold mb-3">{issue.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {issue.tags?.map((tag: string) => (
                          <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                            <Hash className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sentiment Breakdown */}
                    {issue.sentiment && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Public Sentiment</div>
                        <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                          <div 
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${issue.sentiment.positive || 0}%` }}
                          />
                          <div 
                            className="bg-gray-500 transition-all duration-500"
                            style={{ width: `${issue.sentiment.neutral || 0}%` }}
                          />
                          <div 
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${issue.sentiment.negative || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{issue.sentiment.positive || 0}% Positive</span>
                          <span>{issue.sentiment.negative || 0}% Negative</span>
                        </div>
                      </div>
                    )}

                    {/* Consensus Score */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Consensus Score</span>
                        <span className="text-lg font-bold text-blue-400">{issue.consensusScore}/100</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${issue.consensusScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                      <Users className="w-4 h-4" />
                      <span>{issue.participants.toLocaleString()} participants</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button 
                        onClick={() => { setSelectedIssue(issue); setShowSummary(true) }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Summary
                      </button>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAdoptIssue(issue)}
                          disabled={isAdopting || isAdopted}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isAdopted 
                              ? 'bg-emerald-500/40 text-emerald-300 cursor-not-allowed'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {isAdopting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Target className="w-4 h-4" />
                              {isAdopted ? 'Adopted' : 'Adopt Issue'}
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => downloadIssueInsights(issue)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-700/50 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>

                    {/* Adopted By */}
                    {isAdopted && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-2">Status:</div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-emerald-300">You have adopted this issue</span>
                        </div>
                      </div>
                    )}
                  </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && selectedIssue && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedIssue.title}</h2>
              <button 
                onClick={() => setShowSummary(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    AI Summary
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{selectedIssue.summary}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {selectedIssue.keyPoints.map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                        <span className="text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-6">
                {selectedIssue.sentiment && (
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      Public Mood
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400">Positive</span>
                        <span className="text-sm">{selectedIssue.sentiment.positive || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${selectedIssue.sentiment.positive || 0}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Neutral</span>
                        <span className="text-sm">{selectedIssue.sentiment.neutral || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${selectedIssue.sentiment.neutral || 0}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Negative</span>
                        <span className="text-sm">{selectedIssue.sentiment.negative || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${selectedIssue.sentiment.negative || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Top Contributors
                  </h3>
                  <div className="space-y-3">
                    {selectedIssue.contributors.map((contributor: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                        <div>
                          <div className="font-medium">{contributor.name}</div>
                          <div className="text-sm text-yellow-400">{contributor.tag}</div>
                        </div>
                        <div className="text-lg font-bold text-blue-400">{contributor.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              {userRole === "ngo" ? (
                <>
                  <button 
                    onClick={() => { 
                      setShowSummary(false); 
                      generateCampaignPlan(selectedIssue);
                    }}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Generate Campaign Plan
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { 
                      setShowSummary(false); 
                      generatePolicyBrief(selectedIssue);
                    }}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Generate Policy Brief
                      </>
                    )}
                  </button>
                </>
              )}
              <button 
                onClick={() => downloadIssueInsights(selectedIssue)}
                className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Plan Modal */}
      {showCampaignPlan && campaignPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                {campaignPlan.title}
              </h2>
              <button 
                onClick={() => setShowCampaignPlan(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {campaignPlan.objective && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-sm font-bold text-blue-400 mb-2">Objective</h3>
                <p className="text-gray-300">{campaignPlan.objective}</p>
              </div>
            )}
            
            <div className="space-y-6">
              {campaignPlan.steps?.map((step: any) => (
                <div key={step.step} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-blue-400 font-medium">Timeline: </span>
                      <span className="text-gray-300">{step.timeline}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-medium">Resources: </span>
                      <span className="text-gray-300">{step.resources}</span>
                    </div>
                  </div>
                  {step.successMetrics && (
                    <div className="text-sm">
                      <span className="text-purple-400 font-medium">Success Metrics: </span>
                      <span className="text-gray-300">{step.successMetrics}</span>
                    </div>
                  )}
                  {step.keyActivities && step.keyActivities.length > 0 && (
                    <div className="mt-3">
                      <span className="text-yellow-400 font-medium text-sm">Key Activities:</span>
                      <ul className="mt-2 space-y-1">
                        {step.keyActivities.map((activity: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-emerald-400 mt-1 flex-shrink-0" />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(campaignPlan, null, 2))
                  alert('Campaign plan copied to clipboard!')
                }}
                className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <Copy className="w-5 h-5" />
                Copy Plan
              </button>
              <button 
                onClick={downloadCampaignPlan}
                className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Brief Modal */}
      {showPolicyBrief && policyBrief && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-400" />
                {policyBrief.title}
              </h2>
              <button 
                onClick={() => setShowPolicyBrief(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {policyBrief.executiveSummary && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-sm font-bold text-blue-400 mb-2">Executive Summary</h3>
                <p className="text-gray-300">{policyBrief.executiveSummary}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 text-emerald-400">Public Consensus</h3>
                  <p className="text-gray-300">{policyBrief.consensus}</p>
                  {policyBrief.urgency && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-gray-400">Urgency:</span>
                      <span className={`text-sm font-bold ${
                        policyBrief.urgency === 'critical' ? 'text-red-400' :
                        policyBrief.urgency === 'high' ? 'text-orange-400' :
                        policyBrief.urgency === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {policyBrief.urgency.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 text-blue-400">Sentiment Analysis</h3>
                  <p className="text-gray-300">{policyBrief.sentiment}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 text-yellow-400">Top Public Demands</h3>
                  <ul className="space-y-2">
                    {policyBrief.publicDemands?.map((demand: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <ArrowRight className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{demand}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 text-purple-400">Policy Recommendations</h3>
                  <ul className="space-y-2">
                    {policyBrief.policyRecommendations?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {policyBrief.implementationPriority && (
              <div className="mt-8 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-emerald-400">Implementation Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {policyBrief.implementationPriority.immediate && (
                    <div>
                      <h4 className="text-sm font-bold text-red-400 mb-2">Immediate</h4>
                      <ul className="space-y-1">
                        {policyBrief.implementationPriority.immediate.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-300">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {policyBrief.implementationPriority.shortTerm && (
                    <div>
                      <h4 className="text-sm font-bold text-yellow-400 mb-2">Short-term</h4>
                      <ul className="space-y-1">
                        {policyBrief.implementationPriority.shortTerm.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-300">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {policyBrief.implementationPriority.longTerm && (
                    <div>
                      <h4 className="text-sm font-bold text-green-400 mb-2">Long-term</h4>
                      <ul className="space-y-1">
                        {policyBrief.implementationPriority.longTerm.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-300">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={downloadPolicyBrief}
                className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Policy Brief
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(policyBrief, null, 2))
                  alert('Policy brief copied to clipboard!')
                }}
                className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Copy className="w-5 h-5" />
                Copy Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Modal */}
      {showCollaboration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Connect & Collaborate</h2>
              <button 
                onClick={() => setShowCollaboration(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Start a Conversation</h3>
                <textarea 
                  placeholder="Hi! I'm interested in collaborating on urban pollution control measures. Would you like to discuss potential joint initiatives?"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                  <Mail className="w-5 h-5" />
                  Send Message
                </button>
                <button className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors">
                  <Calendar className="w-5 h-5" />
                  Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adopt Issue Modal with AI Plan Generation */}
      {showAdoptModal && adoptIssueData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Target className="w-6 h-6 text-emerald-400" />
                Adopt Issue: {adoptIssueData.title}
              </h2>
              <button 
                onClick={() => {
                  setShowAdoptModal(false)
                  setAdoptIssueData(null)
                  setGeneratedPlan(null)
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                disabled={isAdopting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Generating State */}
            {isGenerating && (
              <div className="py-12 text-center">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  🤖 AI is Generating Your Action Plan...
                </h3>
                <p className="text-gray-400">
                  Creating a comprehensive {userRole === 'ngo' ? 'campaign plan' : 'policy brief'} based on public sentiment and consensus data
                </p>
              </div>
            )}

            {/* Generated Plan Display */}
            {!isGenerating && generatedPlan && (
              <div className="space-y-6">
                {/* Plan Header */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">
                      AI-Generated {userRole === 'ngo' ? 'Campaign Plan' : 'Policy Brief'}
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    {generatedPlan.objective || generatedPlan.executiveSummary || generatedPlan.title}
                  </p>
                </div>

                {/* Plan Preview - Condensed */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 max-h-[400px] overflow-y-auto">
                  {userRole === 'ngo' && generatedPlan.steps ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-white mb-4">Campaign Steps:</h4>
                      {generatedPlan.steps.map((step: any) => (
                        <div key={step.step} className="border-l-4 border-emerald-500 pl-4 py-2">
                          <div className="font-medium text-emerald-400">Step {step.step}: {step.title}</div>
                          <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                          <div className="text-xs text-gray-500 mt-2">Timeline: {step.timeline}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-bold text-white mb-4">Key Recommendations:</h4>
                      {generatedPlan.policyRecommendations?.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{rec}</span>
                        </div>
                      ))}
                      {generatedPlan.publicDemands && (
                        <>
                          <h4 className="font-bold text-white mb-2 mt-6">Public Demands:</h4>
                          {generatedPlan.publicDemands.map((demand: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <ArrowRight className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">{demand}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-700">
                  <button 
                    onClick={() => {
                      if (userRole === 'ngo') {
                        downloadCampaignPlan()
                      } else {
                        downloadPolicyBrief()
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Full Plan
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generatedPlan, null, 2))
                      alert('Plan copied to clipboard!')
                    }}
                    className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    Copy to Clipboard
                  </button>
                  <div className="flex-1" />
                  <button 
                    onClick={() => {
                      setShowAdoptModal(false)
                      setAdoptIssueData(null)
                      setGeneratedPlan(null)
                    }}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    disabled={isAdopting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmAdoptIssue}
                    disabled={isAdopting}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdopting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adopting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm & Adopt Issue
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isGenerating && !generatedPlan && (
              <div className="py-12 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Unable to Generate Plan
                </h3>
                <p className="text-gray-400 mb-6">
                  You can still adopt this issue without an AI-generated plan
                </p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => {
                      setShowAdoptModal(false)
                      setAdoptIssueData(null)
                    }}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmAdoptIssue}
                    disabled={isAdopting}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {isAdopting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adopting...
                      </>
                    ) : (
                      <>
                        Adopt Without Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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