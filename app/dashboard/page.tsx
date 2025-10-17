"use client"

import { useState } from "react"
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
  LogOut
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

  const publicIssues = [
    {
      id: 1,
      title: "Urban Pollution Control Measures",
      tags: ["Environment", "Health", "Policy"],
      sentiment: { positive: 62, neutral: 23, negative: 15 },
      consensusScore: 78,
      participants: 1847,
      summary: "Strong public support for stricter emission controls and green transportation initiatives. Citizens emphasize the urgent need for air quality monitoring and industrial regulation.",
      keyPoints: [
        "Mandatory emission testing for all vehicles",
        "Expansion of public transportation networks",
        "Industrial waste monitoring systems",
        "Green spaces development in urban areas",
        "Community awareness programs"
      ],
      contributors: [
        { name: "Environmental Coalition", tag: "Most Influential", score: 94 },
        { name: "Dr. Maria Santos", tag: "Expert Voice", score: 89 },
        { name: "Citizens Assembly", tag: "Community Leader", score: 85 }
      ],
      adoptedBy: ["Green Future NGO", "Urban Planning Dept"]
    },
    {
      id: 2,
      title: "Digital Privacy Rights Framework",
      tags: ["Technology", "Rights", "Law"],
      sentiment: { positive: 45, neutral: 31, negative: 24 },
      consensusScore: 65,
      participants: 2103,
      summary: "Mixed public opinion on data protection measures. Strong support for transparency but concerns about implementation complexity and business impact.",
      keyPoints: [
        "Clear data collection consent processes",
        "Right to data deletion and portability",
        "Regular privacy audits for companies",
        "Public education on digital rights",
        "International cooperation frameworks"
      ],
      contributors: [
        { name: "Digital Rights Foundation", tag: "Policy Expert", score: 92 },
        { name: "Tech Industry Rep", tag: "Balanced Speaker", score: 78 },
        { name: "Privacy Advocates", tag: "Critical Voice", score: 86 }
      ],
      adoptedBy: ["Privacy First NGO"]
    },
    {
      id: 3,
      title: "Affordable Housing Crisis Solutions",
      tags: ["Housing", "Economy", "Social"],
      sentiment: { positive: 71, neutral: 19, negative: 10 },
      consensusScore: 84,
      participants: 3241,
      summary: "Overwhelming public consensus on the need for immediate housing reform. Strong support for government intervention and innovative financing solutions.",
      keyPoints: [
        "Rent control and tenant protection laws",
        "Public-private housing partnerships",
        "First-time buyer assistance programs",
        "Zoning reform for affordable units",
        "Community land trust initiatives"
      ],
      contributors: [
        { name: "Housing Justice Coalition", tag: "Most Influential", score: 96 },
        { name: "City Planning Committee", tag: "Official Voice", score: 88 },
        { name: "Tenant Union Rep", tag: "Community Voice", score: 91 }
      ],
      adoptedBy: ["Shelter Alliance", "Housing Dept", "Community First NGO"]
    }
  ]

  const collaborators = [
    {
      id: 1,
      type: "ngo",
      name: "Green Future NGO",
      focus: "Environmental Policy",
      currentIssue: "Urban Pollution Control",
      contact: "contact@greenfuture.org",
      members: 1247
    },
    {
      id: 2,
      type: "policymaker",
      name: "Urban Planning Department",
      focus: "City Development",
      currentIssue: "Housing Crisis Solutions",
      contact: "planning@city.gov",
      members: 45
    },
    {
      id: 3,
      type: "ngo",
      name: "Digital Rights Foundation",
      focus: "Privacy & Technology",
      currentIssue: "Digital Privacy Framework",
      contact: "info@digitalrights.org",
      members: 892
    },
    {
      id: 4,
      type: "policymaker",
      name: "Health & Environment Office",
      focus: "Public Health Policy",
      currentIssue: "Urban Pollution Control",
      contact: "health@gov.state",
      members: 67
    }
  ]

  const analytics = {
    totalIssues: 127,
    activeCampaigns: userRole === "ngo" ? 8 : 12,
    avgConsensus: 73,
    totalParticipants: 15847,
    sentimentTrend: [65, 68, 71, 69, 74, 76, 73],
    engagementMetrics: {
      debates: 1284,
      uploads: 342,
      adoptions: userRole === "ngo" ? 23 : 45
    }
  }

  const campaignPlan = {
    title: "Urban Pollution Control Campaign",
    steps: [
      {
        step: 1,
        title: "Community Awareness Campaign",
        description: "Launch educational workshops in high-pollution areas, distribute air quality monitors, and create social media awareness campaigns.",
        timeline: "2-4 weeks",
        resources: "Community centers, volunteers, monitoring equipment"
      },
      {
        step: 2,
        title: "Stakeholder Engagement",
        description: "Organize roundtables with local businesses, government officials, and community leaders to build coalition support.",
        timeline: "4-6 weeks",
        resources: "Meeting venues, presentation materials, policy briefs"
      },
      {
        step: 3,
        title: "Policy Advocacy & Implementation",
        description: "Present unified policy recommendations to city council, monitor implementation, and maintain public engagement.",
        timeline: "8-12 weeks",
        resources: "Legal support, media outreach, monitoring systems"
      }
    ]
  }

  const policyBrief = {
    title: "Urban Pollution Control Policy Brief",
    consensus: "78% public consensus for immediate action",
    sentiment: "Strong positive sentiment (62%) with minimal opposition",
    demands: [
      "Mandatory vehicle emission testing within 6 months",
      "50% increase in public transportation funding",
      "Industrial monitoring systems by end of year",
      "Green space development in all districts"
    ],
    recommendations: [
      "Fast-track emission control legislation",
      "Establish public-private partnerships for green transport",
      "Create citizen oversight committee for implementation",
      "Allocate emergency funding for air quality monitoring"
    ]
  }

  const handleAdoptIssue = (issue: any) => {
    // Simulate adopting an issue
    console.log(`${userRole} adopted issue:`, issue.title)
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
              <div className="inline-flex bg-gray-900/50 border border-gray-700 rounded-lg p-1">
                <button 
                  onClick={() => setUserRole("ngo")}
                  className={`px-6 py-2 rounded-md transition-all ${
                    userRole === "ngo" 
                      ? "bg-emerald-500 text-white" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  View as NGO
                </button>
                <button 
                  onClick={() => setUserRole("policymaker")}
                  className={`px-6 py-2 rounded-md transition-all ${
                    userRole === "policymaker" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  View as Policymaker
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 lg:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Analytics Dashboard */}
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

            {/* Public Issues Panel */}
            {/* Integration Status Section */}
            <div className="mb-12">
              <IntegrationStatus />
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">Top Analyzed Public Discussions</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {publicIssues.map((issue) => (
                  <div key={issue.id} className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-gray-500 transition-all duration-300">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold mb-3">{issue.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {issue.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                            <Hash className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sentiment Breakdown */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-2">Public Sentiment</div>
                      <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                        <div 
                          className="bg-green-500 transition-all duration-500"
                          style={{ width: `${issue.sentiment.positive}%` }}
                        />
                        <div 
                          className="bg-gray-500 transition-all duration-500"
                          style={{ width: `${issue.sentiment.neutral}%` }}
                        />
                        <div 
                          className="bg-red-500 transition-all duration-500"
                          style={{ width: `${issue.sentiment.negative}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{issue.sentiment.positive}% Positive</span>
                        <span>{issue.sentiment.negative}% Negative</span>
                      </div>
                    </div>

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
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                        >
                          <Target className="w-4 h-4" />
                          Adopt Issue
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-gray-700/50 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>

                    {/* Adopted By */}
                    {issue.adoptedBy.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-2">Adopted by:</div>
                        <div className="flex flex-wrap gap-1">
                          {issue.adoptedBy.map((org, index) => (
                            <span key={index} className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                              {org}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Collaboration Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Users2 className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold">Collaborate for Change</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="bg-gray-950/60 border border-gray-700 p-6 hover:border-emerald-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      {collab.type === "ngo" ? (
                        <Building className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Shield className="w-6 h-6 text-blue-400" />
                      )}
                      <div>
                        <h3 className="font-bold text-sm">{collab.name}</h3>
                        <div className="text-xs text-gray-400 capitalize">{collab.type}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-400">Focus: </span>
                        <span className="text-white">{collab.focus}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Current: </span>
                        <span className="text-blue-300">{collab.currentIssue}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Members: </span>
                        <span className="text-emerald-300">{collab.members}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowCollaboration(true)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Connect & Discuss
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Public Mood
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">Positive</span>
                      <span className="text-sm">{selectedIssue.sentiment.positive}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selectedIssue.sentiment.positive}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Neutral</span>
                      <span className="text-sm">{selectedIssue.sentiment.neutral}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-gray-500 h-2 rounded-full"
                        style={{ width: `${selectedIssue.sentiment.neutral}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-red-400">Negative</span>
                      <span className="text-sm">{selectedIssue.sentiment.negative}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${selectedIssue.sentiment.negative}%` }}
                      />
                    </div>
                  </div>
                </div>
                
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
                    onClick={() => { setShowSummary(false); setShowCampaignPlan(true) }}
                    className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    Generate Campaign Plan
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setShowSummary(false); setShowPolicyBrief(true) }}
                    className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    Generate Policy Brief
                  </button>
                </>
              )}
              <button className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-5 h-5" />
                Download Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Plan Modal */}
      {showCampaignPlan && (
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
            
            <div className="space-y-6">
              {campaignPlan.steps.map((step) => (
                <div key={step.step} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-400 font-medium">Timeline: </span>
                      <span className="text-gray-300">{step.timeline}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-medium">Resources: </span>
                      <span className="text-gray-300">{step.resources}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 mt-8">
              <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                <Copy className="w-5 h-5" />
                Copy Plan
              </button>
              <button className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors">
                <Save className="w-5 h-5" />
                Save to Dashboard
              </button>
              <button className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Brief Modal */}
      {showPolicyBrief && (
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 text-emerald-400">Public Consensus</h3>
                  <p className="text-gray-300">{policyBrief.consensus}</p>
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
                    {policyBrief.demands.map((demand, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <ArrowRight className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <span className="text-gray-300">{demand}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 text-purple-400">Policy Recommendations</h3>
                  <ul className="space-y-2">
                    {policyBrief.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                        <span className="text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors">
                <Download className="w-5 h-5" />
                Download Policy Note
              </button>
              <button className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
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