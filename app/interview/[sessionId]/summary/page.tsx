"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain,
  Clock,
  Star,
  FileText
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockResults = {
  overallScore: 78,
  stressLevel: 'Moderate',
  duration: '12:45',
  questions: [
    {
      id: 1,
      question: "Tell me about yourself and your background in software development.",
      category: "Introduction",
      stressScore: 25,
      feedback: "Good introduction with clear structure. Could benefit from more specific examples of technical achievements.",
      strengths: ["Clear communication", "Professional demeanor"],
      improvements: ["Add specific examples", "Show more enthusiasm"]
    },
    {
      id: 2,
      question: "Describe a challenging project you worked on and how you overcame the obstacles.",
      category: "Problem Solving",
      stressScore: 45,
      feedback: "Excellent problem-solving approach demonstrated. Good use of STAR method in response structure.",
      strengths: ["Structured thinking", "Clear problem identification", "Solution-oriented"],
      improvements: ["Provide more technical details", "Quantify the impact"]
    },
    {
      id: 3,
      question: "How do you stay updated with the latest technologies and industry trends?",
      category: "Learning & Growth",
      stressScore: 30,
      feedback: "Shows commitment to continuous learning. Mentioned relevant resources and practices.",
      strengths: ["Growth mindset", "Diverse learning sources"],
      improvements: ["Be more specific about recent learnings", "Show practical application"]
    },
    {
      id: 4,
      question: "Explain a time when you had to work with a difficult team member.",
      category: "Teamwork",
      stressScore: 55,
      feedback: "Handled interpersonal conflict well. Demonstrated emotional intelligence and conflict resolution skills.",
      strengths: ["Empathy", "Conflict resolution", "Team collaboration"],
      improvements: ["Provide more context", "Explain long-term relationship building"]
    },
    {
      id: 5,
      question: "Where do you see yourself in 5 years?",
      category: "Career Goals",
      stressScore: 35,
      feedback: "Clear career vision with realistic goals. Good alignment with company growth opportunities.",
      strengths: ["Clear vision", "Realistic goals", "Company alignment"],
      improvements: ["More specific milestones", "Show leadership aspirations"]
    }
  ]
}

export default function SummaryPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()

  const getStressColor = (score: number) => {
    if (score <= 30) return 'text-green-400'
    if (score <= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStressIcon = (score: number) => {
    if (score <= 30) return <TrendingDown className="w-4 h-4" />
    if (score <= 50) return <Minus className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const downloadReport = () => {
    toast.success("Report downloaded successfully!")
  }

  const averageStress = Math.round(
    mockResults.questions.reduce((acc, q) => acc + q.stressScore, 0) / mockResults.questions.length
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
            onClick={() => router.push('/dashboard/student')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </GlassButton>
          <div>
            <h1 className="text-3xl font-bold text-white">Interview Summary</h1>
            <p className="text-white/60">AI-powered analysis of your performance</p>
          </div>
        </div>
        
        <GlassButton
          onClick={downloadReport}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </GlassButton>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getOverallScoreColor(mockResults.overallScore)}`}>
              {mockResults.overallScore}%
            </div>
            <p className="text-white/60">Overall Score</p>
            <div className="flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getStressColor(averageStress)}`}>
              {averageStress}%
            </div>
            <p className="text-white/60">Avg Stress Level</p>
            <div className="flex items-center justify-center">
              {getStressIcon(averageStress)}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-400">
              {mockResults.duration}
            </div>
            <p className="text-white/60">Duration</p>
            <div className="flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-purple-400">
              {mockResults.questions.length}
            </div>
            <p className="text-white/60">Questions</p>
            <div className="flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stress Analysis Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Stress Analysis</h2>
          </div>
          
          <div className="space-y-4">
            {mockResults.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-medium text-sm">
                      Q{question.id}
                    </span>
                    <div>
                      <p className="font-medium text-white">{question.category}</p>
                      <p className="text-sm text-white/60 max-w-md truncate">{question.question}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStressIcon(question.stressScore)}
                    <span className={`font-medium ${getStressColor(question.stressScore)}`}>
                      {question.stressScore}%
                    </span>
                  </div>
                </div>
                <Progress value={question.stressScore} className="h-2" />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Detailed Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-semibold text-white">Detailed Feedback</h2>
        
        <div className="grid gap-6">
          {mockResults.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-medium">
                        {question.category}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStressColor(question.stressScore)} bg-current/10`}>
                        Stress: {question.stressScore}%
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">{question.question}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">AI Feedback</h4>
                    <p className="text-white/80 text-sm leading-relaxed">{question.feedback}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-400 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {question.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-white/70 flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-yellow-400 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {question.improvements.map((improvement, idx) => (
                          <li key={idx} className="text-sm text-white/70 flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center space-x-4"
      >
        <GlassButton
          onClick={() => router.push('/dashboard/student')}
          className="flex items-center space-x-2"
        >
          <Brain className="w-4 h-4" />
          <span>Take Another Interview</span>
        </GlassButton>
        
        <GlassButton
          onClick={() => router.push('/session-history')}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>View All Sessions</span>
        </GlassButton>
      </motion.div>
    </div>
  )
}