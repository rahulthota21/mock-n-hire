import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: 'recruiter' | 'student'
  name: string
}

interface AppState {
  // User & Auth
  user: User | null
  isLoading: boolean
  
  // Theme & UI
  theme: 'dark' | 'light'
  accentColor: 'ice-blue' | 'aqua-green'
  
  // Modals & UI State
  showNewScreeningModal: boolean
  showSettingsModal: boolean
  currentSessionId: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  setAccentColor: (color: 'ice-blue' | 'aqua-green') => void
  setShowNewScreeningModal: (show: boolean) => void
  setShowSettingsModal: (show: boolean) => void
  setCurrentSessionId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isLoading: false,
      theme: 'dark',
      accentColor: 'ice-blue',
      showNewScreeningModal: false,
      showSettingsModal: false,
      currentSessionId: null,
      
      // Actions
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setShowNewScreeningModal: (showNewScreeningModal) => set({ showNewScreeningModal }),
      setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId })
    }),
    {
      name: 'mocknhire-storage',
      partialize: (state) => ({ 
        user: state.user, 
        theme: state.theme, 
        accentColor: state.accentColor 
      })
    }
  )
)