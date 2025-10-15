"use client"

import { useState } from "react"
import {
  Upload,
  FileText,
  Users,
  Brain,
  BarChart3,
  Download,
  Copy,
  X,
  Check,
  Bell,
  User,
  Target,
  Zap,
  TrendingUp,
  MessageSquare,
  Hash,
  Award,
  Eye,
  Sparkles,
  FileUp,
  Cloud,
  Loader2,
  CheckCircle
} from "lucide-react"

export default function UploadPage() {
  const [userType, setUserType] = useState<"citizen" | "ngo">("citizen")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [showActionPlan, setShowActionPlan] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const analysisResults = {
    topic: {
      title: "Urban Development Policies",
      description: "Discussion focused on sustainable city planning, affordable housing initiatives, and public transportation infrastructure."
    },
    mainPoints: [
      { text: "Affordable housing shortage requires immediate government intervention", sentiment: "negative" },
      { text: "Public transportation expansion could reduce urban congestion by 40%", sentiment: "positive" },
      { text: "Green building standards should be mandatory for new developments", sentiment: "positive" },
      { text: "Current zoning laws limit innovative housing solutions", sentiment: "negative" },
      { text: "Community input is essential for successful urban planning", sentiment: "neutral" }
    ],
    contributors: [
      { name: "Dr. Sarah Chen", tag: "Most Influential", score: 94 },
      { name: "Marcus Rodriguez", tag: "Balanced Speaker", score: 87 },
      { name: "Planning Committee", tag: "Critical Contributor", score: 82 },
      { name: "Citizens Coalition", tag: "Community Voice", score: 79 }
    ],
    summary: "The discussion reveals a strong consensus on the need for comprehensive urban development reform. Participants emphasized the critical shortage of affordable housing and the potential for public transportation to address multiple urban challenges simultaneously. There's notable agreement on implementing green building standards, though concerns were raised about current regulatory barriers. The conversation highlighted the importance of community engagement in planning processes, with speakers advocating for more inclusive decision-making frameworks.",
    sentiment: {
      positive: 45,
      neutral: 32,
      negative: 23,
      overall: "Balanced"
    }
  }

  const actionPlan = [
    {
      step: 1,
      title: "Community Engagement Campaign",
      description: "Launch public forums and digital surveys to gather comprehensive community input on housing priorities.",
      timeline: "2-4 weeks"
    },
    {
      step: 2,
      title: "Policy Research & Advocacy",
      description: "Develop evidence-based policy proposals for zoning reform and green building incentives.",
      timeline: "6-8 weeks"
    },
    {
      step: 3,
      title: "Stakeholder Coalition Building",
      description: "Build partnerships with local government, developers, and community organizations for implementation.",
      timeline: "8-12 weeks"
    }
  ]

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setAnalysisComplete(false)
    
    // Simulate upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleAnalyze = () => {
    if (!uploadedFile) return
    
    setIsAnalyzing(true)
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 3000)
  }

  const handleClear = () => {
    setUploadedFile(null)
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    setUploadProgress(0)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysisResults.summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (allowedTypes.includes(file.type)) {
        handleFileUpload(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-500/20'
      case 'negative': return 'text-red-400 bg-red-500/20'
      case 'neutral': return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
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
            <div className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
              <a href="/forums" className="text-gray-400 hover:text-white transition-colors">Forums</a>
              <a href="/upload" className="text-blue-400 font-medium">Upload</a>
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                📤 Upload & Analyze Public Discussions
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Upload transcripts or documents — let AI summarize debates, identify contributors, and uncover public sentiment.
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 lg:px-12 pb-16">
          <div className="max-w-6xl mx-auto">
            
            {!analysisComplete ? (
              /* Upload Section */
              <div className="max-w-2xl mx-auto">
                {/* Upload Panel */}
                <div 
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-500/10' 
                      : 'border-gray-600 bg-gray-900/30 hover:border-gray-500 hover:bg-gray-900/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileSelect}
                  />
                  
                  {!uploadedFile ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Cloud className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Drag & drop or click to upload your file</h3>
                        <p className="text-gray-400 mb-4">Supports .txt, .pdf, .docx files</p>
                        <label 
                          htmlFor="file-upload"
                          className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
                        >
                          <FileUp className="w-5 h-5" />
                          Choose File
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{uploadedFile.name}</h3>
                        <p className="text-gray-400 mb-4">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                        
                        {uploadProgress < 100 ? (
                          <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                            <CheckCircle className="w-5 h-5" />
                            <span>Upload Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {uploadedFile && uploadProgress >= 100 && (
                  <div className="flex gap-4 justify-center mt-8">
                    <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="group relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 border border-blue-500/40 bg-blue-500/10 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/20" />
                      <div className="relative border border-blue-400 bg-blue-400 text-black font-bold px-8 py-4 text-lg transition-all duration-300 group-hover:bg-blue-300 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-5 h-5" />
                            <span>Analyze Document</span>
                          </>
                        )}
                      </div>
                    </button>

                    <button 
                      onClick={handleClear}
                      className="group relative cursor-pointer"
                    >
                      <div className="absolute inset-0 border border-gray-600 bg-gray-900/20 transition-all duration-300 group-hover:border-gray-500 group-hover:shadow-lg group-hover:shadow-gray-500/20" />
                      <div className="relative border border-gray-500 bg-transparent text-white font-medium px-8 py-4 text-lg transition-all duration-300 group-hover:border-gray-400 group-hover:bg-gray-900/30 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        <span>Clear</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Analysis Results */
              <div className="space-y-8">
                {/* Topic Extraction Card */}
                <div className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-blue-400/50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Hash className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">Identified Topic</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="inline-block bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full border border-blue-500/30">
                      {analysisResults.topic.title}
                    </div>
                    <p className="text-gray-300">{analysisResults.topic.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Main Points Card */}
                  <div className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-emerald-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-xl font-bold">Main Points</h2>
                    </div>
                    <div className="space-y-4">
                      {analysisResults.mainPoints.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            point.sentiment === 'positive' ? 'bg-green-500' :
                            point.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          <p className="text-gray-300 flex-1">{point.text}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(point.sentiment)}`}>
                            {point.sentiment}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contributors Card */}
                  <div className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-yellow-400/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <Users className="w-6 h-6 text-yellow-400" />
                      <h2 className="text-xl font-bold">Contributors</h2>
                    </div>
                    <div className="space-y-4">
                      {analysisResults.contributors.map((contributor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                          <div>
                            <div className="font-medium">{contributor.name}</div>
                            <div className="text-sm text-yellow-400">{contributor.tag}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-400">{contributor.score}</div>
                            <div className="text-xs text-gray-400">AI Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-purple-400/50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold">AI Summary</h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-300 leading-relaxed">{analysisResults.summary}</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Summary'}
                      </button>
                      <button className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sentiment Overview */}
                <div className="card-interactive bg-gray-950/60 border border-gray-700 p-6 hover:border-green-400/50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                    <h2 className="text-xl font-bold">Sentiment Overview</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400">Positive</span>
                        <span className="text-sm">{analysisResults.sentiment.positive}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${analysisResults.sentiment.positive}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Neutral</span>
                        <span className="text-sm">{analysisResults.sentiment.neutral}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div 
                          className="bg-gray-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${analysisResults.sentiment.neutral}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Negative</span>
                        <span className="text-sm">{analysisResults.sentiment.negative}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div 
                          className="bg-red-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${analysisResults.sentiment.negative}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                          {analysisResults.sentiment.overall}
                        </div>
                        <div className="text-gray-400">Overall Tone</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NGO-Specific Features */}
                {userType === "ngo" && (
                  <div className="card-interactive bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Target className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-xl font-bold">NGO Actions</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                        <Target className="w-5 h-5" />
                        🔹 Adopt This Issue
                      </button>
                      <button 
                        onClick={() => setShowActionPlan(true)}
                        className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Zap className="w-5 h-5" />
                        🤖 Generate Action Plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Back to Upload Button */}
                <div className="text-center">
                  <button 
                    onClick={handleClear}
                    className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors mx-auto"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Another Document
                  </button>
                </div>
              </div>
            )}
          </div>
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
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-400 mb-8">
              Create a 3-step campaign plan based on this discussion.
            </p>
            <div className="space-y-6">
              {actionPlan.map((step) => (
                <div key={step.step} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-3">{step.description}</p>
                  <div className="text-sm text-blue-400">Timeline: {step.timeline}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <button className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors">
                <Download className="w-5 h-5" />
                Export Plan
              </button>
              <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                <Target className="w-5 h-5" />
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