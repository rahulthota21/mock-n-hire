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

// Helper function to validate sessionId
const validateSessionId = (sessionId: any): string => {
  if (typeof sessionId !== "string" || !sessionId.match(/^[\w-]{36}$/)) {
    console.error("[InterviewPage] ERROR: sessionId is not a valid string UUID:", sessionId, typeof sessionId);
    throw new Error("Session ID is invalid or missing.");
  }
  console.info("[InterviewPage] Using sessionId:", sessionId, typeof sessionId);
  return sessionId;
}

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
  const [loading, setLoading] = useState(false)
  const { user } = useAppStore()
  const mockUserId = user?.id
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const audioChunksRef = useRef<Blob[]>([])

  // 1. Ensure session exists
  useEffect(() => {
    async function checkSessionExists() {
      const sessionId = validateSessionId(params.sessionId);
      console.info("[Step 1] Checking if session exists for sessionId:", sessionId)
      const res = await APIStudent(`/interview/next-question/${sessionId}/1`, { method: "GET" })
      if (!res.ok) {
        console.warn("[Step 1] Session not found. Redirecting...")
        toast.error("Session not found. Please start a new interview.")
        setTimeout(() => router.push("/dashboard/student"), 3000)
      }
    }
    checkSessionExists()
  }, [params.sessionId, router])

  // Debug logging on mount
  useEffect(() => {
    console.info("[Step 2] Current user object:", user)
    console.info("[Step 2] Using mockUserId:", mockUserId)
  }, [user, mockUserId])

  // 2. Initial question fetch
  useEffect(() => {
    async function fetchQuestions() {
      try {
        console.info("[Step 3] Fetching first question...")
        if (!mockUserId) {
          toast.error("Please ensure you are logged in")
          router.push("/auth/login")
          return
        }
        const sessionId = validateSessionId(params.sessionId);
        const res = await APIStudent(`/interview/next-question/${sessionId}/1`, { method: "GET" })
        if (!res.ok) throw new Error("Failed to fetch questions")
        const data = await res.json()
        setQuestions([{
          question_text: data.question,
          category: data.category,
          question_number: data.question_number,
          time_limit: data.time_limit ?? 120
        }])
        setTimeLeft(data.time_limit ?? 120)
        console.info("[Step 3] First question fetched:", data)
      } catch (err: any) {
        console.error("[Step 3] Failed to load questions:", err.message)
        toast.error("Failed to load questions: " + err.message)
      }
    }
    fetchQuestions()
  }, [params.sessionId, mockUserId, router, user])

  // 3. Utility to fetch specific question number (used for next question)
  const fetchQuestionByNumber = async (qNum: number): Promise<Question | null> => {
    console.info(`[Step 4] Fetching question #${qNum}`)
    try {
      const sessionId = validateSessionId(params.sessionId);
      const res = await APIStudent(`/interview/next-question/${sessionId}/${qNum}`, { method: "GET" })
      if (!res.ok) throw new Error("Failed to fetch question")
      const data = await res.json()
      console.info(`[Step 4] Question #${qNum} fetched:`, data)
      return {
        question_text: data.question,
        category: data.category,
        question_number: data.question_number,
        time_limit: data.time_limit ?? 120
      }
    } catch (err: any) {
      console.warn(`[Step 4] No more questions at #${qNum} or failed:`, err.message)
      return null
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0

  // 4. Camera & mic initialization
  useEffect(() => {
    async function initCamera() {
      try {
        console.info("[Step 5] Initializing camera and microphone...")
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        console.info("[Step 5] Camera/microphone ready.")
      } catch (e) {
        console.error("[Step 5] Camera access denied.", e)
        toast.error("Camera access denied. Please enable camera permissions.")
      }
    }
    initCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      console.info("[Step 5] Camera/microphone streams stopped.")
    }
  }, [])

  // 5. Countdown timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAnswering && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            console.info("[Step 6] Timer expired, auto-finishing question.")
            handleNextQuestion()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isAnswering, timeLeft])

  // 6. Start answering logic
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

    console.info(`[Step 7] Started recording for Q${currentQuestion?.question_number}`)
    setIsAnswering(true)
    setIsRecording(true)
    toast.success("Recording started. You may begin your answer.")
  }

  // 7. Upload helper with logging
  async function uploadWithRetry(
    bucket: string,
    path: string,
    blob: Blob,
    contentType: string,
    retries = 3
  ) {
    console.info(`[Step 8] Uploading to ${bucket}/${path} (size: ${blob.size} bytes)`)
    for (let attempt = 1; attempt <= retries; attempt++) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          cacheControl: "3600",
          upsert: true,
          contentType
        })
      if (!error) {
        console.info(`[Step 8] Upload success for ${bucket}/${path} on attempt ${attempt}`)
        return
      }
      console.warn(`[Step 8] Upload attempt ${attempt} failed for ${bucket}/${path}:`, error.message)
      await new Promise(r => setTimeout(r, 1000))
    }
    throw new Error(`Upload failed for ${bucket}/${path}`)
  }

  // 8. Notify backend after upload (fire-and-forget)
  function notifyBackend(sessionId: string, qNum: number) {
    const validatedSessionId = validateSessionId(sessionId);
    console.info(`[Step 9] Notifying backend for submit-answer/stress, Q${qNum}`)
    // submit-answer
    APIStudent(
      `/interview/submit-answer/${validatedSessionId}/${qNum}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    )
      .then(r => {
        if (!r.ok) return r.text().then(t => Promise.reject(new Error(t)))
        console.info(`[Step 9] [Backend] submit-answer queued Q${qNum}`)
      })
      .catch(e => console.warn(`[Step 9] [submit-answer] ignored: ${e.message}`))

    // stress analysis
    APIStudent(
      `/stress/analyze-stress/${validatedSessionId}/${qNum}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    )
      .then(r => {
        if (!r.ok) return r.json().then(d => Promise.reject(new Error(d.detail)))
        console.info(`[Step 9] [Backend] stress queued Q${qNum}`)
      })
      .catch(e => console.warn(`[Step 9] [stress] ignored: ${e.message}`))
  }

  // 9. Handle Next / Finish, with parallel fetch of next question
  const handleNextQuestion = async () => {
    if (loading) {
      console.info("[Step 10] Already processing next question, ignoring duplicate call.")
      return
    }
    setLoading(true)
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
    console.info(`[Step 11] Created video/audio blobs for Q${qNum}: video size=${videoBlob.size}, audio size=${audioBlob.size}`)

    // 3) fetch next question immediately (start in parallel)
    const nextIdx = currentQuestionIndex + 1
    const nextNum = qNum + 1
    const nextQuestionPromise = fetchQuestionByNumber(nextNum)

    try {
      const sessionId = validateSessionId(params.sessionId);
      // 4) upload blobs (await)
      await Promise.all([
        uploadWithRetry("mock.interview.videos",
          `videos/${sessionId}/${qNum}/video.webm`, videoBlob, "video/webm"),
        uploadWithRetry("mock.interview.answers",
          `answers/${sessionId}/${qNum}/audio.webm`, audioBlob, "audio/webm")
      ])
      console.info(`[Step 12] All uploads completed for Q${qNum}`)
    } catch (e: any) {
      console.error(`[Step 12] Upload failed for Q${qNum}:`, e.message)
      toast.error(`Upload failed for Q${qNum}: ${e.message}`)
      setLoading(false)
      return
    }

    // 5) queue backend processing (non-blocking)
    notifyBackend(params.sessionId, qNum)

    // 6) wait for next question result (started earlier)
    const nextQ = await nextQuestionPromise

    if (nextQ) {
      setQuestions(prev => (prev.length > nextIdx ? prev : [...prev, nextQ]))
      setCurrentQuestionIndex(nextIdx)
      setTimeLeft(nextQ.time_limit ?? 120)
      console.info(`[Step 13] Updated UI to next question Q${nextQ.question_number}`)
    } else {
      toast.success("Interview completed! Generating your report…")
      console.info("[Step 13] No more questions. Redirecting to summary.")
      const sessionId = validateSessionId(params.sessionId);
      await APIStudent(`/interview/final-report/${sessionId}`, { method: "GET" });
      setTimeout(() => router.push(`/interview/${sessionId}/summary`), 1500)
    }
    setLoading(false)
  }

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !videoEnabled
      setVideoEnabled(!videoEnabled)
      console.info(`[Step 14] Video toggled: ${!videoEnabled ? "ON" : "OFF"}`)
    }
  }
  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !audioEnabled
      setAudioEnabled(!audioEnabled)
      console.info(`[Step 14] Audio toggled: ${!audioEnabled ? "ON" : "OFF"}`)
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
                    disabled={loading}
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
                      disabled={loading}
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
