"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { Switch } from "@/components/ui/switch"
import { useAppStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Palette, User, LogOut, Trash2, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, theme, accentColor, setTheme, setAccentColor, setUser } = useAppStore()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  const handleSave = () => {
    // Mock save
    toast.success("Settings saved successfully!")
  }

  const handleDeleteAccount = () => {
    // Mock account deletion
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setUser(null)
      toast.success("Account deleted successfully")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/60">Customize your Mock'n-Hire experience</p>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Appearance</h2>
          </div>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Dark Mode</p>
                <p className="text-sm text-white/60">Toggle between light and dark themes</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <p className="font-medium text-white">Accent Color</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAccentColor('ice-blue')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accentColor === 'ice-blue'
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                  <p className="text-sm font-medium text-white">Ice Blue</p>
                </button>
                <button
                  onClick={() => setAccentColor('aqua-green')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accentColor === 'aqua-green'
                      ? 'border-green-400 bg-green-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-green-400 to-cyan-500"></div>
                  <p className="text-sm font-medium text-white">Aqua Green</p>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <GlassInput
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <GlassInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <div className="pt-2">
              <GlassButton
                onClick={handleSave}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6 space-y-6 border-red-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
          </div>

          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-sm text-white/60">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <GlassButton
                onClick={handleDeleteAccount}
                className="bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-400"
              >
                Delete Account
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}