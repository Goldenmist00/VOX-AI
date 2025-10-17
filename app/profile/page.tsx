"use client"

import { useState, useEffect } from "react"
import {
  User,
  MessageSquare,
  Upload,
  Star,
  Trophy,
  Zap,
  Crown,
  Shield,
  Flame,
  Heart,
  Globe,
  Users,
  Calendar,
  Edit3,
  Settings,
  Bell,
  LogOut,
  Home,
  LayoutDashboard,
  Check,
  Lock,
  Activity,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth()
  
  // All state declarations must come before any early returns
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "citizen",
    bio: "Passionate about social change and community engagement. Working towards a better future through meaningful discussions and collaborative action.",
    location: "",
    joinedDate: "",
    avatar: null
  })

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "citizen"
      }))
    }
  }, [user])

  // Gamification data - will be loaded from API
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    xpToNext: 1000,
    totalContributions: 0,
    debatesJoined: 0,
    uploadsShared: 0,
    commentsPosted: 0,
    likesReceived: 0,
    streak: 0,
    rank: "Newcomer"
  })

  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const [achievements, setAchievements] = useState<any[]>([
    // Default achievements for testing - will be replaced by API data
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Joined the VOX AI community',
      icon: 'Star',
      unlocked: true,
      rarity: 'common',
      xp: 50,
      unlockedDate: new Date().toISOString()
    }
  ])

  // Fetch user profile data function
  const fetchProfileData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/profile', {
          credentials: 'include'
        })
        const data = await response.json()

        if (response.status === 401) {
          // Authentication failed, redirect to login
          console.error('Authentication failed, redirecting to login')
          logout()
          return
        }

        if (data.success) {
          // Verify the returned user matches the authenticated user
          if (data.user.email !== user?.email) {
            console.error('Profile data mismatch - user email does not match authenticated user')
            logout()
            return
          }

          console.log('Profile data received:', data) // Debug log

          // Update profile data with all available fields
          setProfileData(prev => ({
            ...prev,
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            email: data.user.email || "",
            role: data.user.role || "citizen",
            bio: data.user.bio || prev.bio,
            location: data.user.location || "",
            joinedDate: data.user.joinedDate || ""
          }))

          // Update user stats with comprehensive data
          setUserStats({
            level: data.stats.level || 1,
            xp: data.stats.xp || 0,
            xpToNext: data.stats.xpToNext || 0,
            xpRequiredForNext: data.stats.xpRequiredForNext || 1000,
            totalXpEarned: data.stats.totalXpEarned || 0,
            totalContributions: data.stats.totalContributions || 0,
            debatesJoined: data.stats.debatesJoined || 0,
            uploadsShared: data.stats.uploadsShared || 0,
            commentsPosted: data.stats.commentsPosted || 0,
            likesReceived: data.stats.likesReceived || 0,
            streak: data.stats.streak || 0,
            rank: data.stats.rank || "Newcomer",
            influenceScore: data.stats.influenceScore || 0,
            trustScore: data.stats.trustScore || 0,
            progressInfo: data.stats.progressInfo || {}
          })
          
          // Update achievements with icons
          const achievementsWithIcons = (data.stats.achievements || []).map((achievement: any) => ({
            ...achievement,
            icon: getAchievementIcon(achievement.icon || achievement.id)
          }))
          setAchievements(achievementsWithIcons)
          
          // Update recent activity
          setRecentActivity(data.stats.recentActivity || [])
          
          console.log('Profile data updated successfully') // Debug log
        } else {
          console.error('Failed to fetch profile data:', data.error)
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setLoading(false)
      }
    }

  // Fetch user profile data on mount and user change
  useEffect(() => {
    if (user) {
      fetchProfileData()
    }
  }, [user])

  const getAchievementIcon = (iconName: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'Star': <Star className="w-6 h-6" />,
      'MessageSquare': <MessageSquare className="w-6 h-6" />,
      'Trophy': <Trophy className="w-6 h-6" />,
      'Heart': <Heart className="w-6 h-6" />,
      'Flame': <Flame className="w-6 h-6" />,
      'Upload': <Upload className="w-6 h-6" />,
      'Crown': <Crown className="w-6 h-6" />,
      'Shield': <Shield className="w-6 h-6" />
    }
    return iconMap[iconName] || <Star className="w-6 h-6" />
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600'
      case 'uncommon': return 'text-green-400 border-green-600'
      case 'rare': return 'text-blue-400 border-blue-600'
      case 'epic': return 'text-purple-400 border-purple-600'
      case 'legendary': return 'text-orange-400 border-orange-600'
      default: return 'text-gray-400 border-gray-600'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ngo': return <Heart className="w-5 h-5 text-emerald-400" />
      case 'policymaker': return <Shield className="w-5 h-5 text-blue-400" />
      case 'citizen': return <Users className="w-5 h-5 text-purple-400" />
      default: return <User className="w-5 h-5 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ngo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'policymaker': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'citizen': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const calculateProgress = () => {
    if (!userStats.xpRequiredForNext) return 0
    return (userStats.xp / userStats.xpRequiredForNext) * 100
  }

  const saveProfileChanges = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          bio: profileData.bio,
          location: profileData.location
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('Profile updated successfully')
        setIsEditing(false)
        // Refresh profile data
        fetchProfileData()
      } else {
        console.error('Failed to update profile:', data.error)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, authLoading])

  // Don't render anything if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
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
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{profileData.firstName || 'User'} {profileData.lastName || ''}</span>
              <span className="text-gray-500">({profileData.role})</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <header className="px-6 py-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center gap-4 mb-6 animate-pulse">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-700 rounded-full"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-700 rounded w-64 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-96 mb-3"></div>
                  <div className="flex gap-6">
                    <div className="h-4 bg-gray-700 rounded w-32"></div>
                    <div className="h-4 bg-gray-700 rounded w-40"></div>
                  </div>
                </div>
                <div className="w-32 h-10 bg-gray-700 rounded"></div>
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    {profileData.firstName?.[0] || 'U'}{profileData.lastName?.[0] || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {userStats.level}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{profileData.firstName || 'User'} {profileData.lastName || ''}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getRoleColor(profileData.role)}`}>
                      {getRoleIcon(profileData.role)}
                      {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{profileData.bio}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {profileData.location || 'Location not set'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {profileData.joinedDate ? new Date(profileData.joinedDate).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            )}

            {/* Level Progress */}
            <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-6 mb-8">
              {loading ? (
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-700 rounded"></div>
                      <div>
                        <div className="h-5 bg-gray-700 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 bg-gray-700 rounded w-16 mb-1"></div>
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-700 rounded w-12"></div>
                    <div className="h-3 bg-gray-700 rounded w-12"></div>
                    <div className="h-3 bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6 text-orange-400" />
                      <div>
                        <h3 className="text-lg font-bold">Level {userStats.level} - {userStats.rank}</h3>
                        <p className="text-gray-400 text-sm">{userStats.xp} / {userStats.xpRequiredForNext || userStats.xpToNext} XP</p>
                        {userStats.progressInfo?.isNewcomer && (
                          <p className="text-emerald-400 text-xs">🚀 Newcomer Bonus: {userStats.progressInfo.xpMultiplier}x XP!</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">{userStats.xpToNext}</div>
                      <div className="text-sm text-gray-400">XP to next level</div>
                      {userStats.progressInfo?.nextLevelReward && (
                        <div className="text-xs text-emerald-400">+{userStats.progressInfo.nextLevelReward} bonus XP</div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Level {userStats.level}</span>
                    <span>{calculateProgress().toFixed(1)}% ({userStats.xp}/{userStats.xpRequiredForNext || userStats.xpToNext})</span>
                    <span>Level {userStats.level + 1}</span>
                  </div>
                  {userStats.progressInfo?.isNewcomer && (
                    <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-emerald-400 text-xs text-center">
                        🌟 Welcome! You're earning {userStats.progressInfo.xpMultiplier}x XP to help you get started!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 lg:px-12 pb-16">
          <div className="max-w-7xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-8 bg-gray-950/60 border border-gray-700 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
                { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-950/60 border border-gray-700 p-4 rounded-lg text-center animate-pulse">
                        <div className="w-8 h-8 bg-gray-700 rounded mx-auto mb-2"></div>
                        <div className="h-6 bg-gray-700 rounded w-12 mx-auto mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded w-20 mx-auto"></div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-gray-950/60 border border-gray-700 p-4 rounded-lg text-center">
                        <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{userStats.debatesJoined}</div>
                        <div className="text-sm text-gray-400">Debates Joined</div>
                      </div>
                      <div className="bg-gray-950/60 border border-gray-700 p-4 rounded-lg text-center">
                        <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{userStats.uploadsShared}</div>
                        <div className="text-sm text-gray-400">Documents Shared</div>
                      </div>
                      <div className="bg-gray-950/60 border border-gray-700 p-4 rounded-lg text-center">
                        <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{userStats.likesReceived}</div>
                        <div className="text-sm text-gray-400">Likes Received</div>
                      </div>
                      <div className="bg-gray-950/60 border border-gray-700 p-4 rounded-lg text-center">
                        <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{userStats.streak}</div>
                        <div className="text-sm text-gray-400">Day Streak</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Achievements */}
                <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Recent Achievements
                  </h3>
                  <div className="space-y-3">
                    {achievements.filter(a => a.unlocked).slice(-3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)} border`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{achievement.title}</div>
                          <div className="text-xs text-gray-400">{achievement.description}</div>
                        </div>
                        <div className="text-orange-400 text-sm font-bold">+{achievement.xp} XP</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`bg-gray-950/60 border rounded-lg p-6 transition-all duration-300 ${
                      achievement.unlocked
                        ? `${getRarityColor(achievement.rarity)} hover:scale-105`
                        : 'border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${achievement.unlocked ? getRarityColor(achievement.rarity) : 'text-gray-600'} border`}>
                        {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${achievement.unlocked ? 'text-orange-400' : 'text-gray-500'}`}>
                          +{achievement.xp} XP
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{achievement.rarity}</div>
                      </div>
                    </div>
                    <h3 className={`font-bold mb-2 ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">{achievement.description}</p>
                    
                    {achievement.unlocked ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Unlocked {achievement.unlockedDate}
                      </div>
                    ) : achievement.progress !== undefined ? (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{achievement.progress}/{achievement.total}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${(achievement.progress! / achievement.total!) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Requirements not met</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </h3>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 bg-gray-800/50 rounded-lg">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <div>
                            <div className="font-medium text-white">{activity.action}</div>
                            <div className="text-sm text-gray-400">{activity.topic}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 text-sm font-bold">+{activity.xp} XP</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity found. Start participating in debates to see your activity here!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-400" />
                    Profile Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button 
                      onClick={saveProfileChanges}
                      className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="bg-gray-950/60 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    Notification Settings
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'New debate notifications', enabled: true },
                      { label: 'Comment replies', enabled: true },
                      { label: 'Achievement unlocks', enabled: true },
                      { label: 'Weekly summary', enabled: false },
                      { label: 'Policy updates', enabled: true }
                    ].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-white">{setting.label}</span>
                        <button
                          className={`w-12 h-6 rounded-full transition-colors ${
                            setting.enabled ? 'bg-orange-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              setting.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}