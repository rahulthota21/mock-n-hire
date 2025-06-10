"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { motion } from "framer-motion"
import { Upload, Brain, Calendar, TrendingUp, FileText, Play, Eye } from "lucide-react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockSessions = [
  {
    id: 'session-1',
    role: 'Frontend Developer',
    date: '2024-01-15',
    score: 78,
    status: 'completed'
  },
  {
    id: 'session-2',
    role: 'Product Manager',
    date: '2024-01-12', 
    score: 82,
    status: 'completed'
  },
  {
    id: 'session-3',
    role: 'Data Analyst',
    date: '2024-01-10',
    score: 71,
    status: 'completed'
  }
]

export default function StudentDashboard() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobRole, setJobRole] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setResumeFile(acceptedFiles[0])
      toast.success("Resume uploaded successfully!")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  })

  const handleGenerateInterview = async () => {
    if (!resumeFile || !jobRole) {
      toast.error("Please upload your resume and specify the job role")
      return
    }

    setIsGenerating(true)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate mock session ID and redirect
    const sessionId = 'session-' + Date.now()
    toast.success("Interview generated! Get ready...")
    
    setIsGenerating(false)
    router.push(`/interview/${sessionId}`)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10'
    if (score >= 70) return 'text-yellow-400 bg-yellow-500/10'
    return 'text-red-400 bg-red-500/10'
  }

  const handleViewReport = (sessionId: string) => {
    router.push(`/interview/${sessionId}/summary`)
  }

  const handleViewAllSessions = () => {
    router.push('/session-history')
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
        <p className="text-white/60">Practice with AI-powered mock interviews</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{mockSessions.length}</p>
              <p className="text-white/60">Interviews Taken</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.round(mockSessions.reduce((acc, s) => acc + s.score, 0) / mockSessions.length)}
              </p>
              <p className="text-white/60">Average Score</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">5</p>
              <p className="text-white/60">This Month</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* New Interview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Start New Mock Interview</h3>
            <p className="text-white/60">Upload your resume and get personalized interview questions</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Resume Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/80">
                Upload Resume *
              </label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-blue-400/50 bg-blue-500/10' 
                    : 'border-white/20 hover:border-white/30'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-3 text-white/40" />
                <p className="text-white/80 mb-1">
                  {resumeFile ? resumeFile.name : "Drag & drop your resume"}
                </p>
                <p className="text-xs text-white/60">PDF, DOC, DOCX supported</p>
              </div>
            </div>

            {/* Job Role */}
            <div className="space-y-4">
              <GlassInput
                label="Target Job Role *"
                placeholder="e.g. Software Engineer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />

              <div className="pt-2">
                <GlassButton
                  variant="primary"
                  onClick={handleGenerateInterview}
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={!resumeFile || !jobRole}
                  loading={isGenerating}
                >
                  <Play className="w-5 h-5" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Interview'}</span>
                </GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Past Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Interview History</h2>
          <GlassButton
            size="sm"
            onClick={handleViewAllSessions}
            className="flex items-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>View All</span>
          </GlassButton>
        </div>
        
        <div className="grid gap-4">
          {mockSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{session.role}</h3>
                      <p className="text-sm text-white/60">{session.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(session.score)}`}>
                      Score: {session.score}%
                    </span>
                    <GlassButton 
                      size="sm"
                      onClick={() => handleViewReport(session.id)}
                    >
                      View Report
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}