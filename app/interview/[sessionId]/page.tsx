"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Video, VideoOff, SkipForward, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { APIStudent } from "@/lib/apiStudent"
import { useAppStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"

type Question = {
  question_text: string
  category: string
  question_number: number
  time_limit?: number
}

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120)
  const [isRecording, setIsRecording] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isAnswering, setIsAnswering] = useState(false)
  const { user } = useAppStore()
  const mockUserId = user?.id
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const audioChunksRef = useRef<Blob[]>([])

  // Ensure session exists
  useEffect(() => {
    async function checkSessionExists() {
      const res = await APIStudent(`/interview/next-question/${params.sessionId}/1`, { method: "GET" })
      if (!res.ok) {
        toast.error("Session not found. Please start a new interview.")
        router.push("/dashboard/student")
      }
    }
    checkSessionExists()
  }, [params.sessionId, router])

  // Debug logging
  useEffect(() => {
    console.log("Current user object:", user)
    console.log("Using mockUserId:", mockUserId)
  }, [user, mockUserId])

  // Initial question fetch
  useEffect(() => {
    async function fetchQuestions() {
      try {
        if (!mockUserId) {
          toast.error("Please ensure you are logged in")
          router.push("/auth/login")
          return
        }
        const res = await APIStudent(`/interview/next-question/${params.sessionId}/1`, { method: "GET" })
        if (!res.ok) throw new Error("Failed to fetch questions")
        const data = await res.json()
        setQuestions([{
          question_text: data.question,
          category: data.category,
          question_number: data.question_number,
          time_limit: data.time_limit ?? 120
        }])
        setTimeLeft(data.time_limit ?? 120)
      } catch (err: any) {
        toast.error("Failed to load questions: " + err.message)
      }
    }
    fetchQuestions()
  }, [params.sessionId, mockUserId, router, user])

  const fetchQuestionByNumber = async (qNum: number): Promise<Question | null> => {
    try {
      const res = await APIStudent(`/interview/next-question/${params.sessionId}/${qNum}`, { method: "GET" })
      if (!res.ok) throw new Error("Failed to fetch question")
      const data = await res.json()
      return {
        question_text: data.question,
        category: data.category,
        question_number: data.question_number,
        time_limit: data.time_limit ?? 120
      }
    } catch (err: any) {
      toast.error("Failed to load question: " + err.message)
      return null
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0

  // Camera & mic init
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        toast.error("Camera access denied. Please enable camera permissions.")
      }
    }
    initCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAnswering && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isAnswering, timeLeft])

  const startAnswering = () => {
    if (!streamRef.current) return
    videoChunksRef.current = []
    audioChunksRef.current = []

    // Video recorder
    const videoRecorder = new window.MediaRecorder(streamRef.current, {
      mimeType: "video/webm; codecs=vp8,opus"
    })
    videoRecorder.ondataavailable = e => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data)
    }
    videoRecorderRef.current = videoRecorder

    // Audio-only recorder
    const audioStream = new MediaStream(streamRef.current.getAudioTracks())
    const audioRecorder = new window.MediaRecorder(audioStream, { mimeType: "audio/webm" })
    audioRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data)
    }
    audioRecorderRef.current = audioRecorder

    videoRecorder.start()
    audioRecorder.start()

    console.log("Video and audio recording started for question:", currentQuestion?.question_number)
    setIsAnswering(true)
    setIsRecording(true)
    toast.success("Recording started. You may begin your answer.")
  }

  // Upload with retry helper
  async function uploadWithRetry(
    bucket: string,
    path: string,
    blob: Blob,
    contentType: string,
    retries = 3
  ) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          cacheControl: "3600",
          upsert: true,
          contentType
        })
      if (!error) return
      console.warn(`[Upload] ${bucket}/${path} attempt ${attempt} failed:`, error.message)
      await new Promise(r => setTimeout(r, 1000))
    }
    throw new Error(`Upload failed for ${bucket}/${path}`)
  }

  // ░░░ fire-and-forget backend calls (never awaited) ░░░
  function notifyBackend(sessionId: string, qNum: number) {
    // submit-answer
    APIStudent(
      `/interview/submit-answer/${sessionId}/${qNum}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    )
      .then(r => {
        if (!r.ok) return r.text().then(t => Promise.reject(new Error(t)))
        console.log(`[Backend] submit-answer queued Q${qNum}`)
      })
      .catch(e => console.warn(`[submit-answer] ignored: ${e.message}`))

    // stress analysis
    APIStudent(
      `/stress/analyze-stress/${sessionId}/${qNum}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    )
      .then(r => {
        if (!r.ok) return r.json().then(d => Promise.reject(new Error(d.detail)))
        console.log(`[Backend] stress queued Q${qNum}`)
      })
      .catch(e => console.warn(`[stress] ignored: ${e.message}`))
  }

  // Handle Next / Finish
  const handleNextQuestion = async () => {
    setIsAnswering(false)
    setIsRecording(false)

    // 1) stop recorders, wait until both fire "onstop"
    await new Promise<void>(res => {
      let done = 0
      const check = () => (++done === 2 ? res() : null)
      videoRecorderRef.current?.stop()
      audioRecorderRef.current?.stop()
      videoRecorderRef.current!.onstop = check
      audioRecorderRef.current!.onstop = check
    })
    await new Promise(r => setTimeout(r, 300)) // ensure chunks flushed

    // 2) create blobs
    const qNum = currentQuestion!.question_number
    const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" })
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

    try {
      // 3) upload blobs (await)
      await Promise.all([
        uploadWithRetry("mock.interview.videos",
          `videos/${params.sessionId}/${qNum}/video.webm`, videoBlob, "video/webm"),
        uploadWithRetry("mock.interview.answers",
          `answers/${params.sessionId}/${qNum}/audio.webm`, audioBlob, "audio/webm")
      ])
    } catch (e: any) {
      toast.error(`Upload failed for Q${qNum}: ${e.message}`)
    }

    // 4) queue backend processing (non-blocking)
    notifyBackend(params.sessionId, qNum)

    // 5) immediately fetch next question & update UI
    const nextIdx = currentQuestionIndex + 1
    const nextNum = qNum + 1
    const nextQ   = await fetchQuestionByNumber(nextNum)

    if (nextQ) {
      setQuestions(p => (p.length > nextIdx ? p : [...p, nextQ]))
      setCurrentQuestionIndex(nextIdx)
      setTimeLeft(nextQ.time_limit ?? 120)
    } else {
      toast.success("Interview completed! Generating your report…")
      router.push(`/interview/${params.sessionId}/summary`)
    }
  }

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !videoEnabled
      setVideoEnabled(!videoEnabled)
    }
  }
  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !audioEnabled
      setAudioEnabled(!audioEnabled)
    }
  }
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full space-y-6"
      >
        {/* Progress Header */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">Mock Interview</h1>
              <p className="text-white/60">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{formatTime(timeLeft)}</p>
              <p className="text-white/60">Time Remaining</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </GlassCard>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6 space-y-4">
              <h3 className="font-semibold text-white">Video Preview</h3>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!videoEnabled ? "opacity-0" : ""}`}
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <VideoOff className="w-12 h-12 text-white/40" />
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 text-sm font-medium">REC</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-3">
                <GlassButton
                  onClick={toggleVideo}
                  className={`p-3 ${!videoEnabled ? "bg-red-500/20 border-red-400/30" : ""}`}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </GlassButton>
                <GlassButton
                  onClick={toggleAudio}
                  className={`p-3 ${!audioEnabled ? "bg-red-500/20 border-red-400/30" : ""}`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Question & Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                    {currentQuestion?.category || ""}
                  </span>
                  <span className="text-white/60 text-sm">
                    {currentQuestion?.time_limit
                      ? `${currentQuestion.time_limit / 60} minute${currentQuestion.time_limit! > 60 ? "s" : ""} to answer`
                      : ""}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentQuestion?.question_number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-2xl font-bold text-white leading-relaxed"
                  >
                    {currentQuestion?.question_text || ""}
                  </motion.h2>
                </AnimatePresence>
              </div>

              {!isAnswering ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/20">
                    <p className="text-blue-300 text-sm">
                      <strong>Instructions:</strong> Click "Start Recording" when you're
                      ready to answer. You'll have {formatTime(currentQuestion?.time_limit ?? 120)} to
                      provide your response. Speak clearly and take your time.
                    </p>
                  </div>
                  <GlassButton
                    onClick={startAnswering}
                    variant="primary"
                    className="w-full flex items-center justify-center space-x-2 py-4"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </GlassButton>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-400/20">
                    <p className="text-green-300 text-sm">
                      <strong>Recording in progress...</strong> Answer naturally. Click
                      "Next Question" to finish early or wait for the timer to run out.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <GlassButton
                      onClick={handleNextQuestion}
                      variant="primary"
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      {currentQuestionIndex + 1 < questions.length ? (
                        <>
                          <SkipForward className="w-5 h-5" />
                          <span>Next Question</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Finish Interview</span>
                        </>
                      )}
                    </GlassButton>
                  </div>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
