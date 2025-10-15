"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  FileUp,
  LogIn,
  MessageSquare,
  Network,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Users,
  Home,
  Upload,
  LayoutDashboard
} from "lucide-react"
import { VoxAiSvgWordmark } from "@/components/vox-ai-svg-wordmark"

export default function VoxLanding() {
  const [currentCommand, setCurrentCommand] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [matrixChars, setMatrixChars] = useState<string[]>([])
  const [animatedBoxes, setAnimatedBoxes] = useState<boolean[]>([])
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [currentTyping, setCurrentTyping] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStep, setExecutionStep] = useState(0)
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  const [debates, setDebates] = useState(0)
  const [issues, setIssues] = useState(0)
  const [consensus, setConsensus] = useState(0)

  useEffect(() => {
    const animate = (setter: (n: number) => void, target: number, duration = 1200) => {
      const start = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setter(Math.floor(eased * target))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    animate(setDebates, 1284)
    animate(setIssues, 76)
    animate(setConsensus, 64)
  }, [])

  const [dots, setDots] = useState<Array<{ x: number; y: number; s: number; o: number }>>([])
  useEffect(() => {
    const d = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 2 + 1,
      o: Math.random() * 0.25 + 0.1,
    }))
    setDots(d)
    const iv = setInterval(() => {
      setDots((prev) =>
        prev.map((p) => ({
          ...p,
          x: (p.x + (Math.random() - 0.5) * 1.5 + 100) % 100,
          y: (p.y + (Math.random() - 0.5) * 1.5 + 100) % 100,
          o: Math.min(0.35, Math.max(0.08, p.o + (Math.random() - 0.5) * 0.1)),
        })),
      )
    }, 1500)
    return () => clearInterval(iv)
  }, [])

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const commands = [
    "hexa-cli init --ai-powered",
    "hexa-cli generate --model gpt-5 --context full",
    "hexa-cli review --agent claude-4 --interactive",
    "hexa-cli deploy --env production --optimize",
  ]

  const terminalSequences = [
    {
      command: "hexa-cli init --ai-powered",
      outputs: [
        "🚀 Initializing HEXA CLI project...",
        "📦 Installing dependencies...",
        "🤖 Configuring AI models...",
        "✅ Project initialized successfully!",
      ],
    },
    {
      command: "hexa-cli generate --model gpt-5 --context full",
      outputs: [
        "🧠 Loading GPT-5 model...",
        "📊 Analyzing codebase context...",
        "⚡ Generating optimized code...",
        "✨ Code generation complete!",
      ],
    },
    {
      command: "hexa-cli review --agent claude-4 --interactive",
      outputs: [
        "👁️  Starting interactive review...",
        "🔍 Claude-4 analyzing changes...",
        "💡 Suggesting improvements...",
        "🎯 Review session active!",
      ],
    },
    {
      command: "hexa-cli deploy --env production --optimize",
      outputs: [
        "🏗️  Building for production...",
        "⚡ Optimizing bundle size...",
        "🌐 Deploying to production...",
        "🎉 Deployment successful!",
      ],
    },
  ]

  const heroAsciiText = `██╗  ██╗███████╗██╗  ██╗ █████╗     ██████╗██╗     ██╗
██║  ██║██╔════╝╚██╗██╔╝██╔══██╗   ██╔════╝██║     ██║
███████║█████╗   ╚███╔╝ ███████║   ██║     ██║     ██║
██╔══██║██╔══╝   ██╔██╗ ██╔══██║   ██║     ██║     ██║
██║  ██║███████╗██╔╝ ██╗██║  ██║   ╚██████╗███████╗██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═════╝╚══════╝╚═╝`

  useEffect(() => {
    const chars = "VOXAI01010101ABCDEF█▓▒░▄▀■□▪▫".split("")
    const newMatrixChars = Array.from({ length: 100 }, () => chars[Math.floor(Math.random() * chars.length)])
    setMatrixChars(newMatrixChars)

    const interval = setInterval(() => {
      setMatrixChars((prev) => prev.map(() => chars[Math.floor(Math.random() * chars.length)]))
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const boxes = Array.from({ length: 6 }, () => Math.random() > 0.5)
    setAnimatedBoxes(boxes)

    const interval = setInterval(() => {
      setAnimatedBoxes((prev) => prev.map(() => Math.random() > 0.3))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const sequence = terminalSequences[currentCommand]
    const timeouts: NodeJS.Timeout[] = []

    const runSequence = async () => {
      setTerminalLines([])
      setCurrentTyping("")
      setIsExecuting(false)
      setExecutionStep(0)

      const command = sequence.command
      for (let i = 0; i <= command.length; i++) {
        timeouts.push(
          setTimeout(() => {
            setCurrentTyping(command.slice(0, i))
          }, i * 50),
        )
      }

      timeouts.push(
        setTimeout(
          () => {
            setIsExecuting(true)
            setCurrentTyping("")
            setTerminalLines((prev) => [...prev, `user@dev:~/project$ ${command}`])
          },
          command.length * 50 + 500,
        ),
      )

      sequence.outputs.forEach((output, index) => {
        timeouts.push(
          setTimeout(
            () => {
              setExecutionStep(index + 1)
              setTerminalLines((prev) => [...prev, output])
            },
            command.length * 50 + 1000 + index * 800,
          ),
        )
      })

      timeouts.push(
        setTimeout(
          () => {
            setCurrentCommand((prev) => (prev + 1) % commands.length)
          },
          command.length * 50 + 1000 + sequence.outputs.length * 800 + 2000,
        ),
      )
    }

    runSequence()

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [currentCommand])

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative">


      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-5">
        {dots.map((d, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-teal-400/30 blur-[2px] transition-all duration-700"
            style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s * 3, height: d.s * 3, opacity: d.o }}
          />
        ))}
        {/* connecting lines suggestion */}
        <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute inset-y-0 left-1/4 w-px bg-gradient-to-b from-transparent via-emerald-400/15 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm p-4 relative z-30 sticky top-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <a href="#" className="flex items-center gap-3">
            <div className="flex gap-2" aria-hidden="true">
              <div className="w-3 h-3 bg-blue-500" />
              <div className="w-3 h-3 bg-emerald-500" />
              <div className="w-3 h-3 bg-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white text-sm md:text-base tracking-[0.2em]">VOX</span>
              <span className="text-gray-400 text-sm md:text-base">AI</span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="/forums" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors relative group px-3 py-2 rounded-lg hover:bg-gray-800/50">
              <MessageSquare className="w-4 h-4" />
              <span>Forums</span>
              <span className="absolute bottom-[-2px] left-0 w-0 h-0.5 bg-emerald-400/20 transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#how" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors relative group px-3 py-2 rounded-lg hover:bg-gray-800/50">
              <BarChart3 className="w-4 h-4" />
              <span>How it works</span>
              <span className="absolute bottom-[-2px] left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#cta" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors relative group px-3 py-2 rounded-lg hover:bg-gray-800/50">
              <ArrowRight className="w-4 h-4" />
              <span>Explore</span>
              <span className="absolute bottom-[-2px] left-0 w-0 h-0.5 bg-emerald-400/20 transition-all duration-300 group-hover:w-full" />
            </a>
          </div>
          <a
            href="#login"
            className="group relative cursor-pointer"
            aria-label="NGO/Policymaker Login"
            title="NGO/Policymaker Login"
          >
            <div className="absolute inset-0 border border-emerald-500/40 bg-gray-900/20 transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/20" />
            <div className="relative border border-emerald-400/60 bg-transparent text-white font-medium px-4 py-2 text-sm transition-all duration-300 group-hover:border-emerald-300 group-hover:bg-gray-900/30 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-white" />
              <span>NGO/Policymaker Login</span>
            </div>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative px-6 py-16 lg:py-24 lg:px-12 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 relative z-25">
            <VoxAiSvgWordmark className="mx-auto w-[min(92vw,980px)] md:w-[min(90vw,1100px)]" />
            <span className="sr-only">VOX AI</span>
          </div>
          {/* End wordmark */}

          <div className="text-center mb-10">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
              Transform Public Debate into{" "}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Actionable Insight
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
              VOX AAI summarizes debates in real time, captures sentiment, and surfaces consensus so NGOs and
              policymakers can act with confidence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <a href="/forums" className="group relative cursor-pointer w-full sm:w-auto" aria-label="Join Debate">
              <div className="absolute inset-0 border border-blue-500/40 bg-blue-500/10 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/20" />
              <div className="relative border border-blue-400 bg-blue-400 text-black font-bold px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 group-hover:bg-blue-300 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5 text-white" />
                <span>Join Debate</span>
              </div>
            </a>

            <a href="/upload" className="group relative cursor-pointer w-full sm:w-auto" aria-label="Upload Chat">
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/20" />
              <div className="relative border-2 border-dashed border-emerald-400 bg-transparent text-white font-bold px-8 py-3 sm:py-4 text-lg transition-all duration-300 group-hover:border-emerald-300 group-hover:bg-gray-900/30 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center gap-2">
                <FileUp className="w-5 h-5 text-white" />
                <span>Upload Chat</span>
              </div>
            </a>

            <a
              href="#login"
              className="group relative cursor-pointer w-full sm:w-auto"
              aria-label="NGO/Policymaker Login"
            >
              <div className="absolute inset-0 border border-gray-600 bg-gray-900/20 transition-all duration-300 group-hover:border-white/80 group-hover:shadow-lg group-hover:shadow-white/10" />
              <div className="relative border border-gray-400 bg-transparent text-white font-medium px-6 sm:px-8 py-3 sm:py-4 text-base transition-all duration-300 group-hover:border-white group-hover:bg-gray-900/30 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-white" />
                <span>NGO/Policymaker Login</span>
              </div>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-gray-950/60 border border-gray-800 p-5 text-center">
              <div className="text-3xl font-bold text-blue-400">{debates.toLocaleString()}</div>
              <div className="text-gray-400 text-sm mt-1">Debates summarized</div>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 p-5 text-center">
              <div className="text-3xl font-bold text-emerald-400">{issues}</div>
              <div className="text-gray-400 text-sm mt-1">Issues adopted</div>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 p-5 text-center">
              <div className="text-3xl font-bold">
                <span className="text-blue-300">{consensus}</span>
                <span className="text-gray-400">%</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">Avg. consensus trend</div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="px-6 py-14 lg:px-12 border-t border-gray-800 bg-gray-950/30 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">What Vox AI Delivers</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Real-time scoring, full-spectrum sentiment, uploads, and decision dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card-interactive bg-black border border-gray-700 p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-white" />
                <h3 className="font-bold text-white">Real-Time Debate Scoring</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Agree / Disagree / Neutral voting with a live leaderboard of top contributors.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                <ThumbsUp className="w-4 h-4 text-white" />
                <ThumbsDown className="w-4 h-4 text-white" />
                <span>Leaderboard updates live</span>
              </div>
            </div>

            <div className="card-interactive bg-black border border-gray-700 p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
                <h3 className="font-bold text-white">AI Sentiment Analysis</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                VADER + RoBERTa capture both short and long-form sentiments for higher fidelity.
              </p>
              <div className="mt-4 text-xs text-gray-400">Granular tone and polarity over time.</div>
            </div>

            <div className="card-interactive bg-black border border-gray-700 p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <FileUp className="w-6 h-6 text-white" />
                <h3 className="font-bold text-white">Upload & Summarize</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upload .txt, .pdf, or .doc. Get topics, main points, contributors, and AI summaries.
              </p>
              <div className="mt-4 text-xs text-gray-400">Fast, structured outputs ready for briefing.</div>
            </div>

            <div className="card-interactive bg-black border border-gray-700 p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <Network className="w-6 h-6 text-white" />
                <h3 className="font-bold text-white">NGO & Policymaker Dashboards</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Track public consensus, sentiment trends, and recommended action plans.
              </p>
              <div className="mt-4 text-xs text-gray-400">Export insights or share access securely.</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="px-6 py-16 lg:px-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              3 simple steps from participation to policy action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 transform rotate-1 group-hover:rotate-2 transition-transform duration-300" />
              <div className="relative bg-black border border-gray-700 p-6 h-full hover:border-blue-300/60 transition-all duration-300">
                <div className="w-12 h-12 mb-4 bg-gray-900 border border-gray-600 flex items-center justify-center">
                  <span className="text-lg text-white">01</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Participate or Upload</h3>
                <p className="text-gray-400 text-sm">
                  Join ongoing debates or upload transcripts and documents for analysis.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300" />
              <div className="relative bg-black border border-gray-700 p-6 h-full hover:border-emerald-300/60 transition-all duration-300">
                <div className="w-12 h-12 mb-4 bg-gray-900 border border-gray-600 flex items-center justify-center">
                  <span className="text-lg text-white">02</span>
                </div>
                <h3 className="text-lg font-bold mb-2">AI Analyzes & Summarizes</h3>
                <p className="text-gray-400 text-sm">
                  Sentiment models evaluate arguments and produce concise, structured summaries.
                </p>
              </div>
            </div>

            <div className="relative group md:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 transform rotate-1 group-hover:rotate-2 transition-transform duration-300" />
              <div className="relative bg-black border border-gray-700 p-6 h-full hover:border-blue-300/60 transition-all duration-300">
                <div className="w-12 h-12 mb-4 bg-gray-900 border border-gray-600 flex items-center justify-center">
                  <span className="text-lg text-white">03</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Act on Insights</h3>
                <p className="text-gray-400 text-sm">
                  NGOs and policymakers view dashboards, track consensus, and move to action plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-6 py-16 lg:px-12 border-t border-gray-800 bg-gray-950/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to explore the public voice?</h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-10">
            Start participating or dive into insights. Subtle micro-interactions guide you through.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#join" className="group relative cursor-pointer w-full sm:w-auto" aria-label="Start Participating">
              <div className="absolute inset-0 border-2 border-blue-500/50 bg-blue-500/10 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/20" />
              <div className="relative border-2 border-blue-400 bg-blue-400 text-black font-bold px-8 py-4 text-lg transition-all duration-300 group-hover:bg-blue-300 transform translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center gap-2">
                <span>Start Participating</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </a>

            <a
              href="#insights"
              className="group relative cursor-pointer w-full sm:w-auto"
              aria-label="Explore Insights"
            >
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 transition-all duration-300 group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/20" />
              <div className="relative border-2 border-dashed border-emerald-400 bg-transparent text-white font-bold px-8 py-4 text-lg transition-all duration-300 group-hover:border-emerald-300 group-hover:bg-gray-900/30 transform translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center gap-2">
                <span>Explore Insights</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-12 lg:px-12 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-lg">Built for civil discourse.</span>
            </div>
            <div className="text-gray-700 text-sm">© {new Date().getFullYear()} VOX AAI. Insight from debate.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
