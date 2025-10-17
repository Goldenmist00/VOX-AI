"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  Brain,
  X,
  Bell,
  User,
  FileUp,
  Loader2,
  CheckCircle,
  FileText,
  MessageSquare,
  Home,
  LayoutDashboard,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function UploadPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)


  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    
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

  const handleAnalyze = async () => {
    if (!uploadedFile) return
    
    setIsAnalyzing(true)
    
    try {
      // Read file content
      const content = await readFileContent(uploadedFile)
      
      // Redirect to analysis page with content
      router.push(`/analysis?content=${encodeURIComponent(content)}`)
    } catch (error) {
      console.error('Error reading file:', error)
      setIsAnalyzing(false)
      // Still redirect to analysis page with error state
      router.push('/analysis?error=file_read_error')
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      if (file.type === 'text/plain') {
        reader.readAsText(file)
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll need a different approach
        // For now, we'll read as text and let the API handle it
        reader.readAsText(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const handleClear = () => {
    setUploadedFile(null)
    setIsAnalyzing(false)
    setUploadProgress(0)
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
              <a href="/upload" className="flex items-center gap-2 text-blue-400 font-medium px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </a>
              {(user?.role === "ngo" || user?.role === "policymaker") && (
                <a href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </a>
              )}
              {user && (
                <a href="/profile" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                 Upload & Analyze Public Discussions
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
            
            {/* Upload Section */}
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
                        <Upload className="w-8 h-8 text-white" />
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
                        <FileText className="w-8 h-8 text-white" />
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
                            <CheckCircle className="w-5 h-5 text-green-400" />
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
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-5 h-5 text-white" />
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
                        <X className="w-5 h-5 text-white" />
                        <span>Clear</span>
                      </div>
                    </button>
                  </div>
                )}
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
    </div>
  )
}