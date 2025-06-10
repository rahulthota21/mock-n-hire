"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Eye, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Brain,
  Download,
  Filter
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const mockSessions = [
  {
    id: 'session-1',
    date: '2024-01-15',
    role: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    duration: '12:45',
    overallScore: 85,
    stressLevel: 28,
    questionsCount: 5,
    status: 'completed'
  },
  {
    id: 'session-2',
    date: '2024-01-12',
    role: 'Product Manager',
    company: 'StartupXYZ',
    duration: '15:30',
    overallScore: 78,
    stressLevel: 42,
    questionsCount: 6,
    status: 'completed'
  },
  {
    id: 'session-3',
    date: '2024-01-10',
    role: 'Full Stack Developer',
    company: 'DevStudio',
    duration: '11:20',
    overallScore: 92,
    stressLevel: 22,
    questionsCount: 4,
    status: 'completed'
  },
  {
    id: 'session-4',
    date: '2024-01-08',
    role: 'Data Scientist',
    company: 'DataFlow',
    duration: '14:15',
    overallScore: 71,
    stressLevel: 55,
    questionsCount: 5,
    status: 'completed'
  },
  {
    id: 'session-5',
    date: '2024-01-05',
    role: 'UX Designer',
    company: 'DesignHub',
    duration: '10:45',
    overallScore: 88,
    stressLevel: 31,
    questionsCount: 4,
    status: 'completed'
  },
  {
    id: 'session-6',
    date: '2024-01-03',
    role: 'Backend Developer',
    company: 'CloudTech',
    duration: '13:25',
    overallScore: 76,
    stressLevel: 38,
    questionsCount: 5,
    status: 'completed'
  }
]

export default function SessionHistoryPage() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const router = useRouter()

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 bg-green-500/10 border-green-400/30'
    if (score >= 75) return 'text-blue-400 bg-blue-500/10 border-blue-400/30'
    if (score >= 65) return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30'
    return 'text-red-400 bg-red-500/10 border-red-400/30'
  }

  const getStressColor = (stress: number) => {
    if (stress <= 30) return 'text-green-400'
    if (stress <= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStressIcon = (stress: number) => {
    if (stress <= 30) return <TrendingDown className="w-4 h-4" />
    if (stress <= 50) return <Minus className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }

  const filteredSessions = mockSessions.filter(session => {
    if (filter === 'all') return true
    if (filter === 'high') return session.overallScore >= 85
    if (filter === 'medium') return session.overallScore >= 70 && session.overallScore < 85
    if (filter === 'low') return session.overallScore < 70
    return true
  })

  const averageScore = Math.round(
    mockSessions.reduce((acc, session) => acc + session.overallScore, 0) / mockSessions.length
  )

  const averageStress = Math.round(
    mockSessions.reduce((acc, session) => acc + session.stressLevel, 0) / mockSessions.length
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <GlassButton
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </GlassButton>
          <div>
            <h1 className="text-3xl font-bold text-white">Interview History</h1>
            <p className="text-white/60">Track your progress and performance over time</p>
          </div>
        </div>
        
        <GlassButton
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export All</span>
        </GlassButton>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-400">{mockSessions.length}</div>
            <p className="text-white/60">Total Sessions</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getScoreColor(averageScore).split(' ')[0]}`}>
              {averageScore}%
            </div>
            <p className="text-white/60">Average Score</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getStressColor(averageStress)}`}>
              {averageStress}%
            </div>
            <p className="text-white/60">Average Stress</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-400">
              {mockSessions.filter(s => s.overallScore >= 80).length}
            </div>
            <p className="text-white/60">High Scores</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center space-x-4"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-white/60" />
          <span className="text-white/80 font-medium">Filter by performance:</span>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Sessions' },
            { key: 'high', label: 'High (85%+)' },
            { key: 'medium', label: 'Medium (70-84%)' },
            { key: 'low', label: 'Low (<70%)' }
          ].map((filterOption) => (
            <GlassButton
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`text-sm ${
                filter === filterOption.key 
                  ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' 
                  : ''
              }`}
            >
              {filterOption.label}
            </GlassButton>
          ))}
        </div>
      </motion.div>

      {/* Sessions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Date */}
                  <div className="flex items-center space-x-2 text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{session.date}</span>
                  </div>

                  {/* Role & Company */}
                  <div>
                    <h3 className="font-semibold text-white">{session.role}</h3>
                    <p className="text-sm text-white/60">{session.company}</p>
                  </div>

                  {/* Duration */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{session.duration}</p>
                    <p className="text-xs text-white/60">Duration</p>
                  </div>

                  {/* Questions */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{session.questionsCount}</p>
                    <p className="text-xs text-white/60">Questions</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Stress Level */}
                  <div className="flex items-center space-x-2">
                    {getStressIcon(session.stressLevel)}
                    <span className={`text-sm font-medium ${getStressColor(session.stressLevel)}`}>
                      {session.stressLevel}% stress
                    </span>
                  </div>

                  {/* Score Badge */}
                  <Badge className={`${getScoreColor(session.overallScore)} font-medium`}>
                    {session.overallScore}% score
                  </Badge>

                  {/* View Button */}
                  <GlassButton
                    onClick={() => router.push(`/interview/${session.id}/summary`)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Report</span>
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <GlassCard className="p-8 max-w-md mx-auto">
            <Brain className="w-12 h-12 mx-auto mb-4 text-white/40" />
            <h3 className="text-lg font-semibold text-white mb-2">No sessions found</h3>
            <p className="text-white/60 mb-4">
              No interview sessions match your current filter criteria.
            </p>
            <GlassButton
              onClick={() => setFilter('all')}
              variant="primary"
            >
              Show All Sessions
            </GlassButton>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}