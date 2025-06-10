"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Star, 
  FileText, 
  Award, 
  Briefcase,
  Code,
  CheckCircle,
  Clock,
  X,
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { API } from "@/lib/api"

const mockCandidates = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    score: 92,
    rank: 1,
    status: 'shortlisted',
    experience: '5 years',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    education: 'MS Computer Science - Stanford',
    projects: 3,
    certifications: 2,
    resumeUrl: '/resumes/sarah-chen.pdf'
  },
  {
    id: '2',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@email.com',
    score: 88,
    rank: 2,
    status: 'pending',
    experience: '4 years',
    skills: ['Vue.js', 'Python', 'Docker', 'GCP'],
    education: 'BS Software Engineering - MIT',
    projects: 4,
    certifications: 1,
    resumeUrl: '/resumes/alex-rodriguez.pdf'
  },
  {
    id: '3',
    name: 'Emily Johnson',
    email: 'emily.johnson@email.com',
    score: 85,
    rank: 3,
    status: 'pending',
    experience: '3 years',
    skills: ['Angular', 'Java', 'Spring', 'MongoDB'],
    education: 'BS Computer Science - Berkeley',
    projects: 2,
    certifications: 3,
    resumeUrl: '/resumes/emily-johnson.pdf'
  },
  {
    id: '4',
    name: 'Michael Kim',
    email: 'michael.kim@email.com',
    score: 82,
    rank: 4,
    status: 'waitlisted',
    experience: '6 years',
    skills: ['React', 'GraphQL', 'PostgreSQL', 'Kubernetes'],
    education: 'MS Data Science - CMU',
    projects: 5,
    certifications: 1,
    resumeUrl: '/resumes/michael-kim.pdf'
  },
  {
    id: '5',
    name: 'Jessica Wang',
    email: 'jessica.wang@email.com',
    score: 78,
    rank: 5,
    status: 'declined',
    experience: '2 years',
    skills: ['JavaScript', 'HTML/CSS', 'React', 'Firebase'],
    education: 'BS Information Systems - UCLA',
    projects: 2,
    certifications: 0,
    resumeUrl: '/resumes/jessica-wang.pdf'
  }
]

export default async function ScreeningResultsPage({ params }: { params: { screeningId: string } }) {
  const [selectedCandidate, setSelectedCandidate] = useState(mockCandidates[0])
  const [candidates, setCandidates] = useState(mockCandidates)
  const router = useRouter()

  const response = await API(`/screening/${params.screeningId}`)

  const updateCandidateStatus = (candidateId: string, newStatus: string) => {
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, status: newStatus }
          : candidate
      )
    )
    
    if (selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({ ...prev, status: newStatus }))
    }
    
    toast.success(`Candidate ${newStatus}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-500/20 text-green-400 border-green-400/30'
      case 'waitlisted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
      case 'declined': return 'bg-red-500/20 text-red-400 border-red-400/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-400/30'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-yellow-400'
    if (score >= 70) return 'text-orange-400'
    return 'text-red-400'
  }

  const exportResults = () => {
    toast.success("Results exported successfully!")
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 space-y-6">
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
            <h1 className="text-2xl font-bold text-white">Senior Frontend Developer</h1>
            <p className="text-white/60">{candidates.length} candidates analyzed</p>
          </div>
        </div>
        
        <GlassButton
          onClick={exportResults}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Results</span>
        </GlassButton>
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Candidates List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">Ranked Candidates</h2>
          
          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedCandidate.id === candidate.id 
                      ? 'border-blue-400/50 bg-blue-500/10' 
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                        #{candidate.rank}
                      </div>
                      <div>
                        <p className="font-medium text-white">{candidate.name}</p>
                        <p className="text-xs text-white/60">{candidate.email}</p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(candidate.score)}`}>
                      {candidate.score}%
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </Badge>
                    <p className="text-xs text-white/60">{candidate.experience}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Candidate Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Candidate Header */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{selectedCandidate.name}</h3>
                <p className="text-white/60">{selectedCandidate.email}</p>
                <p className="text-white/80">{selectedCandidate.education}</p>
              </div>
              
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(selectedCandidate.score)}`}>
                  {selectedCandidate.score}%
                </div>
                <p className="text-white/60">Match Score</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={() => updateCandidateStatus(selectedCandidate.id, 'shortlisted')}
                className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 border-green-400/30"
                disabled={selectedCandidate.status === 'shortlisted'}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Shortlist</span>
              </GlassButton>
              
              <GlassButton
                onClick={() => updateCandidateStatus(selectedCandidate.id, 'waitlisted')}
                className="flex items-center space-x-2 bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-400/30"
                disabled={selectedCandidate.status === 'waitlisted'}
              >
                <Clock className="w-4 h-4" />
                <span>Waitlist</span>
              </GlassButton>
              
              <GlassButton
                onClick={() => updateCandidateStatus(selectedCandidate.id, 'declined')}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border-red-400/30"
                disabled={selectedCandidate.status === 'declined'}
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </GlassButton>

              <GlassButton
                onClick={() => window.open(selectedCandidate.resumeUrl, '_blank')}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Resume</span>
              </GlassButton>
            </div>
          </GlassCard>

          {/* Score Breakdown */}
          <GlassCard className="p-6 space-y-6">
            <h4 className="text-lg font-semibold text-white">Score Breakdown</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span className="text-white/80">Experience</span>
                  </div>
                  <span className="text-white font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Technical Skills</span>
                  </div>
                  <span className="text-white font-medium">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="text-white/80">Certifications</span>
                  </div>
                  <span className="text-white font-medium">{selectedCandidate.certifications > 0 ? '78%' : '0%'}</span>
                </div>
                <Progress value={selectedCandidate.certifications > 0 ? 78 : 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-white/80">Projects</span>
                  </div>
                  <span className="text-white font-medium">{Math.min(selectedCandidate.projects * 20, 100)}%</span>
                </div>
                <Progress value={Math.min(selectedCandidate.projects * 20, 100)} className="h-2" />
              </div>
            </div>
          </GlassCard>

          {/* Skills & Details */}
          <GlassCard className="p-6 space-y-6">
            <h4 className="text-lg font-semibold text-white">Skills & Experience</h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white/80 mb-2">Technical Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill, index) => (
                    <Badge key={index} className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedCandidate.experience}</p>
                  <p className="text-sm text-white/60">Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedCandidate.projects}</p>
                  <p className="text-sm text-white/60">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedCandidate.certifications}</p>
                  <p className="text-sm text-white/60">Certifications</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}