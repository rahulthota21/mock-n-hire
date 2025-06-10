"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { fetchCurrentUser } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setLoading } = useAppStore()
  const processed = useRef<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setUser(null)
          router.replace('/auth/login')
          processed.current = null
          return
        }

        const uid = session.user.id

        // Stop if we've already succeeded for this UID
        if (processed.current === uid) return

        try {
          // Keep retrying until we definitely have the row
          const profile = await fetchCurrentUser(uid, 20)  // 20×300 ms = 6 s max
          setUser(profile)
          processed.current = uid  // mark as done
          router.replace(`/dashboard/${profile.role}`)
        } catch (err) {
          console.warn('Auth-provider fetch failed — will wait for next auth event', err)
          // DO NOT set a fatal error flag; just return and wait
        }
      }
    )

    // Initial session check
    const checkSession = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setUser(null)
          return
        }

        const uid = session.user.id
        if (processed.current === uid) return

        const profile = await fetchCurrentUser(uid, 20)
        setUser(profile)
        processed.current = uid
      } catch (error) {
        console.warn('Initial session check failed — will wait for next auth event', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
    return () => subscription.unsubscribe()
  }, [router, setUser, setLoading])

  return <>{children}</>
}