"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { useAppStore } from "@/lib/store"
import { signIn, signUp, signInWithGoogle } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { Brain, Chrome, Users, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [role, setRole] = useState<'recruiter' | 'student'>('recruiter')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  
  const { setUser } = useAppStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (isSignup) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match")
          return
        }

        const { data, error } = await signUp(formData.email, formData.password, formData.name, role)
        
        if (error) {
          console.error('Signup error:', error)
          toast.error('Failed to create account')
          return
        }

        if (data?.user && data.profile) {
          setUser({
            id: data.profile.user_id,
            email: data.profile.email,
            name: data.profile.name,
            role: data.profile.role
          })
          
          toast.success('Account created successfully!')
          
          // Add delay before redirect
          await new Promise(resolve => setTimeout(resolve, 1000))
          router.push(`/dashboard/${data.profile.role}`)
        }
      } else {
        const { data, error } = await signIn(formData.email, formData.password)
        
        if (error) {
          console.error('Sign in error:', error)
          toast.error('Failed to sign in')
          return
        }

        if (data?.user && data.profile) {
          setUser({
            id: data.profile.user_id,
            email: data.profile.email,
            name: data.profile.name,
            role: data.profile.role
          })
          
          toast.success('Welcome back!')
          router.push(`/dashboard/${data.profile.role}`)
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google')
      }
    } catch (error) {
      console.error('Google auth error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 space-y-6" hover={false}>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mock'n-Hire</h1>
            <p className="text-white/60">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </p>
          </div>

          {/* Auth Toggle */}
          <div className="flex p-1 rounded-lg bg-white/5">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isSignup 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isSignup 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Role Selection */}
          {isSignup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-white/80">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`p-4 rounded-lg border transition-all ${
                    role === 'recruiter'
                      ? 'border-blue-400/50 bg-blue-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <div className="text-sm font-medium text-white">Recruiter</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-4 rounded-lg border transition-all ${
                    role === 'student'
                      ? 'border-green-400/50 bg-green-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <div className="text-sm font-medium text-white">Student</div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <GlassInput
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            )}
            
            <GlassInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <GlassInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />

            {isSignup && (
              <GlassInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            )}

            <GlassButton
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              {isSignup ? 'Create Account' : 'Sign In'}
            </GlassButton>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-white/60">or</span>
            </div>
          </div>

          {/* Google Auth */}
          <GlassButton
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center space-x-2"
            loading={isLoading}
          >
            <Chrome className="w-5 h-5" />
            <span>Continue with Google</span>
          </GlassButton>
        </GlassCard>
      </motion.div>
    </div>
  )
}