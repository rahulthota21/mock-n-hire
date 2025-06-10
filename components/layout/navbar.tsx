"use client"

import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth"
import { motion } from "framer-motion"
import { Brain, LogOut, Settings, User } from "lucide-react" 
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { GlassCard } from "../ui/glass-card"
import { toast } from "sonner"

export function Navbar() {
  const { user, setUser } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()

  // Don't show navbar on landing page or auth pages
  if (!user || pathname === '/' || pathname.startsWith('/auth/')) {
    return null
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setUser(null)
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to sign out')
    }
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 p-4"
    >
      <GlassCard className="flex items-center justify-between px-6 py-3" hover={false}>
        <Link href={`/dashboard/${user.role}`} className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mock'n-Hire</h1>
            <p className="text-xs text-white/60">AI Hiring Suite</p>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5">
            <User className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80">{user.name}</span>
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full font-medium",
              user.role === 'recruiter' 
                ? "bg-blue-500/20 text-blue-300" 
                : "bg-green-500/20 text-green-300"
            )}>
              {user.role}
            </span>
          </div>

          <Link href="/settings">
            <motion.button 
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-white/60" />
            </motion.button>
          </Link>

          <motion.button 
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5 text-red-400" />
          </motion.button>
        </div>
      </GlassCard>
    </motion.nav>
  )
}