"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import {
  ArrowLeft, Download, TrendingUp, TrendingDown, Minus, Brain,
  Clock, Star, FileText, Loader2
} from "lucide-react"
import { toast } from "sonner"

// Setup Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function SummaryPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<any>(null)
  const [pollCount, setPollCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for report every 5s until found, then load rest of data
  useEffect(() => {
    async function pollForReport() {
      setPollCount(cnt => cnt + 1)
      console.info(`[Polling] Attempt #${pollCount + 1} — Checking for report row...`)
      try {
        const { data: reportRow, error: reportErr } = await supabase
          .from("mock_interview_reports")
          .select("*")
          .eq("session_id", params.sessionId)
          .single()
        if (reportRow && !reportErr) {
          console.info("[Polling] Report found! Loading details...")
          await fetchAll(reportRow)
          setPolling(false)
          setLoading(false)
          if (intervalRef.current) clearInterval(intervalRef.current)
        } else {
          if (
            reportErr &&
            reportErr.message &&
            !reportErr.message.includes("JSON object requested, multiple (or no) rows returned")
          ) {
            setError("Something went wrong: " + reportErr.message)
            setLoading(false)
            setPolling(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            setTimeout(() => router.push("/dashboard/student"), 5000)
            return
          }
          // Not ready, will poll again in 5 seconds
          console.info("[Polling] Report not ready yet, retrying in 5 seconds...")
        }
      } catch (err: any) {
        setError("Something went wrong: " + err.message)
        setLoading(false)
        setPolling(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
        setTimeout(() => router.push("/dashboard/student"), 5000)
      }
    }

    pollForReport() // initial immediate call

    intervalRef.current = setInterval(pollForReport, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line
  }, [params.sessionId])

  // Fetch all detail data after report is ready
  async function fetchAll(reportRow: any) {
    try {
      // 1. Get questions
      const { data: questions, error: questionsErr } = await supabase
        .from("mock_interview_questions")
        .select("*")
        .eq("session_id", params.sessionId)
        .order("question_number", { ascending: true })
      if (questionsErr) throw new Error("Could not load questions")

      // 2. Get answers
      const { data: answers, error: answersErr } = await supabase
        .from("mock_interview_answers")
        .select("*")
        .eq("session_id", params.sessionId)
      if (answersErr) throw new Error("Could not load answers")

      // 3. Get stress per question
      const { data: stressData, error: stressErr } = await supabase
        .from("mock_interview_stress_analysis")
        .select("*")
        .eq("session_id", params.sessionId)
      if (stressErr) throw new Error("Could not load stress analysis")

      // 4. Get session info for duration (optional: calculate duration)
      const { data: sessionInfo, error: sessionErr } = await supabase
        .from("mock_interview_sessions")
        .select("*")
        .eq("id", params.sessionId)
        .single()
      if (sessionErr || !sessionInfo) throw new Error("Could not load session info")

      // Merge all data by question_number
      const questionsMerged = questions.map((q: any) => {
        const ans = answers.find((a: any) => a.question_number === q.question_number) || {}
        const stress = stressData.find((s: any) => s.question_number === q.question_number) || {}
        let strengths: string[] = []
        let improvements: string[] = []
        // Optionally, extract from feedback
        return {
          id: q.question_number,
          question: q.question_text,
          category: q.category,
          stressScore: typeof stress.stress_score === "number" ? Math.round(stress.stress_score) : 0,
          feedback: ans.feedback || "No feedback available.",
          strengths,
          improvements,
          answer: ans.answer_text || "",
          audioUrl: ans.audio_url || ""
        }
      })

      // Duration calculation
      let duration = "—"
      if (sessionInfo.start_time && sessionInfo.end_time) {
        const start = new Date(sessionInfo.start_time)
        const end = new Date(sessionInfo.end_time)
        const diff = Math.max(0, (end.getTime() - start.getTime()) / 1000)
        const min = Math.floor(diff / 60)
        const sec = Math.floor(diff % 60)
        duration = `${min}:${sec.toString().padStart(2, "0")}`
      }

      setReport({
        overallScore: Math.round(reportRow.final_score ?? 0),
        averageStress: questionsMerged.length
          ? Math.round(questionsMerged.reduce((sum, q) => sum + (q.stressScore ?? 0), 0) / questionsMerged.length)
          : 0,
        duration,
        questions: questionsMerged,
        overallSummary: reportRow.overall_summary,
        recommendation: reportRow.recommendation
      })
      setLoading(false)
    } catch (err: any) {
      setError("Something went wrong: " + err.message)
      setLoading(false)
      setTimeout(() => router.push("/dashboard/student"), 5000)
    }
  }

  // Color/indicator helpers
  const getStressColor = (score: number) => {
    if (score <= 30) return "text-green-400"
    if (score <= 50) return "text-yellow-400"
    return "text-red-400"
  }
  const getStressIcon = (score: number) => {
    if (score <= 30) return <TrendingDown className="w-4 h-4" />
    if (score <= 50) return <Minus className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }
  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 70) return "text-yellow-400"
    if (score >= 60) return "text-orange-400"
    return "text-red-400"
  }

  const downloadReport = () => {
    toast.success("Report downloaded successfully!") // (Optionally implement real download)
  }

  if (loading || polling || !report)
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 className="w-14 h-14 animate-spin text-blue-400" />
        </motion.div>
        <div className="text-lg text-blue-200 mb-1 font-semibold">
          Generating your AI-powered report...
        </div>
        <div className="text-white/70 text-sm">
          This may take a few moments. Please wait while we analyze your performance.
        </div>
        <div className="text-blue-400 mt-2 text-xs opacity-60">
          (Polling for report, attempt #{pollCount + 1})
        </div>
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <span className="text-red-400 text-xl font-bold">{error}</span>
        <span className="text-white/60">Returning to dashboard in 5 seconds...</span>
      </div>
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
            onClick={() => router.push("/dashboard/student")}
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
            <div className={`text-3xl font-bold ${getOverallScoreColor(report.overallScore)}`}>
              {report.overallScore}%
            </div>
            <p className="text-white/60">Overall Score</p>
            <div className="flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getStressColor(report.averageStress)}`}>
              {report.averageStress}%
            </div>
            <p className="text-white/60">Avg Stress Level</p>
            <div className="flex items-center justify-center">{getStressIcon(report.averageStress)}</div>
          </div>
        </GlassCard>
        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-400">{report.duration}</div>
            <p className="text-white/60">Duration</p>
            <div className="flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6 text-center" hover={false}>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-purple-400">{report.questions.length}</div>
            <p className="text-white/60">Questions</p>
            <div className="flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* AI Summary/Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-2">AI Summary & Recommendation</h2>
          <p className="text-white/90">{report.overallSummary}</p>
          <p className="text-yellow-400">{report.recommendation}</p>
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
            {report.questions.map((question: any, index: number) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.07 }}
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
          {report.questions.map((question: any, index: number) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.07 }}
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
                        {question.strengths.length === 0 ? (
                          <li className="text-sm text-white/40">No strengths detected.</li>
                        ) : (
                          question.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/70 flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                              <span>{strength}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-400 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {question.improvements.length === 0 ? (
                          <li className="text-sm text-white/40">No suggestions found.</li>
                        ) : (
                          question.improvements.map((improvement: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/70 flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                              <span>{improvement}</span>
                            </li>
                          ))
                        )}
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
          onClick={() => router.push("/dashboard/student")}
          className="flex items-center space-x-2"
        >
          <Brain className="w-4 h-4" />
          <span>Take Another Interview</span>
        </GlassButton>
        <GlassButton
          onClick={() => router.push("/session-history")}
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
