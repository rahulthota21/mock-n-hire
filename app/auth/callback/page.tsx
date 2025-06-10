"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { fetchUserWithRetry } from '@/lib/auth'

export default function AuthCallback() {
  const router = useRouter()
  const { setUser } = useAppStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Authentication failed')
          router.push('/auth/login')
          return
        }

        if (data.session?.user) {
          console.log('Auth callback - User ID:', data.session.user.id)
          
          // Get user profile with retry
          const { profile, error: profileError } = await fetchUserWithRetry(data.session.user.id)

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            toast.error('Failed to load profile')
            router.push('/auth/login')
            return
          }

          if (profile) {
            setUser({
              id: profile.user_id,
              email: profile.email,
              name: profile.name,
              role: profile.role
            })
            
            toast.success('Successfully signed in!')
            router.push(`/dashboard/${profile.role}`)
          }
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error('Something went wrong')
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        <p className="text-white/60">Completing authentication...</p>
      </div>
    </div>
  )
}