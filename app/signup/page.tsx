"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import {
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Users,
  Building,
  CheckCircle,
  AlertCircle,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userType, setUserType] = useState<"citizen" | "organization">("citizen")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    position: "",
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  const { signup, isAuthenticated, canAccessDashboard } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (canAccessDashboard) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    }
  }, [isAuthenticated, canAccessDashboard, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Basic validation
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    if (userType !== 'citizen' && !formData.organization.trim()) newErrors.organization = "Organization is required for organization accounts"
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms and conditions"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    // Call signup API
    const result = await signup({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: userType === 'organization' ? 'ngo' : userType, // Convert organization to ngo
      organization: userType !== 'citizen' ? formData.organization : undefined,
      position: userType !== 'citizen' ? formData.position : undefined,
    })
    
    if (result.success) {
      // Redirect based on user role
      if (canAccessDashboard) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    } else {
      setErrors({ general: result.error || 'Signup failed' })
    }
    
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const getUserTypeInfo = () => {
    switch (userType) {
      case "citizen":
        return {
          title: "Citizen Account",
          description: "Join debates, vote on issues, and make your voice heard in policy discussions.",
          color: "emerald"
        }
      case "organization":
        return {
          title: "Organization Account",
          description: "Represent your NGO or policy organization, access advanced analytics, collaborate with stakeholders, and track public sentiment for data-driven decisions.",
          color: "blue"
        }
    }
  }

  const typeInfo = getUserTypeInfo()

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative">
      {/* Animated Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-x-0 top-1/4 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute inset-x-0 top-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />
        <div className="absolute inset-y-0 left-1/5 w-px bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent" />
        <div className="absolute inset-y-0 right-1/4 w-px bg-gradient-to-b from-transparent via-blue-400/15 to-transparent" />
        
        {/* Floating particles */}
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400/15 blur-[1px] animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 2}px`,
              height: `${Math.random() * 3 + 2}px`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm p-4 relative z-30">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex gap-2" aria-hidden="true">
              <div className="w-3 h-3 bg-blue-500" />
              <div className="w-3 h-3 bg-emerald-500" />
              <div className="w-3 h-3 bg-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white text-sm md:text-base tracking-[0.2em]">VOX</span>
              <span className="text-gray-400 text-sm md:text-base">AI</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Already have an account?
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <UserPlus className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Join VOX AI</h1>
            </div>
            <p className="text-gray-400">
              Create your account and start participating in meaningful civic discourse
            </p>
          </div>

          {/* User Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Choose your account type:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setUserType("citizen")}
                className={`p-6 border rounded-lg text-left transition-all duration-200 ${
                  userType === "citizen"
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-gray-600 bg-gray-900/50 hover:border-gray-500"
                }`}
              >
                <Users className={`w-8 h-8 mb-3 ${userType === "citizen" ? "text-emerald-400" : "text-gray-400"}`} />
                <h3 className={`text-lg font-medium mb-2 ${userType === "citizen" ? "text-emerald-400" : "text-white"}`}>
                  Citizen
                </h3>
                <p className="text-sm text-gray-400">
                  Join debates, vote on issues, and make your voice heard in policy discussions. Perfect for individual citizens who want to participate in civic engagement.
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setUserType("organization")}
                className={`p-6 border rounded-lg text-left transition-all duration-200 ${
                  userType === "organization"
                    ? "border-blue-400 bg-blue-400/10"
                    : "border-gray-600 bg-gray-900/50 hover:border-gray-500"
                }`}
              >
                <Building className={`w-8 h-8 mb-3 ${userType === "organization" ? "text-blue-400" : "text-gray-400"}`} />
                <h3 className={`text-lg font-medium mb-2 ${userType === "organization" ? "text-blue-400" : "text-white"}`}>
                  Organization
                </h3>
                <p className="text-sm text-gray-400">
                  For NGOs, policy organizations, government agencies, and institutional users. Access advanced analytics, collaboration tools, and comprehensive insights.
                </p>
              </button>
            </div>
            
            {/* Account Type Info */}
            <div className={`mt-4 p-4 rounded-lg border ${
              typeInfo.color === "emerald" ? "border-emerald-400/20 bg-emerald-400/5" :
              "border-blue-400/20 bg-blue-400/5"
            }`}>
              <h4 className={`font-medium mb-2 ${
                typeInfo.color === "emerald" ? "text-emerald-400" :
                "text-blue-400"
              }`}>
                {typeInfo.title}
              </h4>
              <p className="text-sm text-gray-300">{typeInfo.description}</p>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      errors.firstName ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    }`}
                    placeholder="Enter first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      errors.lastName ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    }`}
                    placeholder="Enter last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      errors.email ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Organization Fields */}
            {userType === "organization" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-2">
                    Organization *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                        errors.organization ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      }`}
                      placeholder="e.g. Greenpeace, Ministry of Environment, Policy Institute"
                    />
                  </div>
                  {errors.organization && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.organization}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                    Position/Title *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                        errors.position ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      }`}
                      placeholder="e.g. Program Director, Policy Analyst, Minister"
                    />
                  </div>
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.position}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
                  placeholder="City, State/Province, Country"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      errors.password ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    }`}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      errors.confirmPassword ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 text-emerald-400 bg-gray-900 border-gray-600 rounded focus:ring-emerald-400 focus:ring-2"
                />
                <span className="text-sm text-gray-300">
                  I agree to the{" "}
                  <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    Privacy Policy
                  </Link>
                  *
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.agreeToTerms}
                </p>
              )}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="subscribeNewsletter"
                  checked={formData.subscribeNewsletter}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 text-emerald-400 bg-gray-900 border-gray-600 rounded focus:ring-emerald-400 focus:ring-2"
                />
                <span className="text-sm text-gray-300">
                  Subscribe to our newsletter for updates on policy discussions and platform features
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative cursor-pointer w-full"
            >
              <div className="absolute inset-0 border border-blue-500/40 bg-blue-500/10 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/20" />
              <div className="relative border border-blue-400 bg-blue-400 text-black font-bold px-6 py-3 text-base transition-all duration-300 group-hover:bg-blue-300 transform translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-8 p-6 bg-gray-900/30 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-4">Why join VOX AI?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Real-time Engagement</p>
                  <p className="text-gray-400">Participate in live debates and see instant sentiment analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">AI-Powered Insights</p>
                  <p className="text-gray-400">Get intelligent analysis of discussions and policy impacts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Document Analysis</p>
                  <p className="text-gray-400">Upload and analyze policy documents with advanced AI</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Collaborative Platform</p>
                  <p className="text-gray-400">Connect with NGOs, policymakers, and fellow citizens</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}