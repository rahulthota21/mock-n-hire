"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Video, VideoOff, SkipForward, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

const mockQuestions = [
  {
    id: 1,
    question: "Tell me about yourself and your background in software development.",
    category: "Introduction",
    timeLimit: 120
  },
  {
    id: 2,
    question: "Describe a challenging project you worked on and how you overcame the obstacles.",
    category: "Problem Solving",
    timeLimit: 180
  },
  {
    id: 3,
    question: "How do you stay updated with the latest technologies and industry trends?",
    category: "Learning & Growth",
    timeLimit: 120
  },
  {
    id: 4,
    question: "Explain a time when you had to work with a difficult team member. How did you handle it?",
    category: "Teamwork",
    timeLimit: 150
  },
  {
    id: 5,
    question: "Where do you see yourself in 5 years, and how does this role fit into your career goals?",
    category: "Career Goals",
    timeLimit: 120
  }
]

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(mockQuestions[0].timeLimit)
  const [isRecording, setIsRecording] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isAnswering, setIsAnswering] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const currentQuestion = mockQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100

  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        toast.error("Camera access denied. Please enable camera permissions.")
      }
    }

    initCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

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
    setIsAnswering(true)
    setIsRecording(true)
    toast.success("Recording started. You may begin your answer.")
  }

  const handleNextQuestion = () => {
    setIsAnswering(false)
    setIsRecording(false)
    
    // Save mock answer
    setAnswers(prev => [...prev, `Answer for question ${currentQuestionIndex + 1}`])
    
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setTimeLeft(mockQuestions[currentQuestionIndex + 1].timeLimit)
      toast.success("Moving to next question...")
    } else {
      // Interview complete
      toast.success("Interview completed! Generating your report...")
      setTimeout(() => {
        router.push(`/interview/${params.sessionId}/summary`)
      }, 2000)
    }
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled
        setVideoEnabled(!videoEnabled)
      }
    }
  }

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled
        setAudioEnabled(!audioEnabled)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
              <p className="text-white/60">Question {currentQuestionIndex + 1} of {mockQuestions.length}</p>
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
                  className={`w-full h-full object-cover ${!videoEnabled ? 'opacity-0' : ''}`}
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

              {/* Controls */}
              <div className="flex justify-center space-x-3">
                <GlassButton
                  onClick={toggleVideo}
                  className={`p-3 ${!videoEnabled ? 'bg-red-500/20 border-red-400/30' : ''}`}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </GlassButton>
                
                <GlassButton
                  onClick={toggleAudio}
                  className={`p-3 ${!audioEnabled ? 'bg-red-500/20 border-red-400/30' : ''}`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Question Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                    {currentQuestion.category}
                  </span>
                  <span className="text-white/60 text-sm">
                    {currentQuestion.timeLimit / 60} minute{currentQuestion.timeLimit > 60 ? 's' : ''} to answer
                  </span>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-2xl font-bold text-white leading-relaxed"
                  >
                    {currentQuestion.question}
                  </motion.h2>
                </AnimatePresence>
              </div>

              {!isAnswering ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/20">
                    <p className="text-blue-300 text-sm">
                      <strong>Instructions:</strong> Click "Start Recording" when you're ready to answer. 
                      You'll have {formatTime(currentQuestion.timeLimit)} to provide your response. 
                      Speak clearly and take your time to think through your answer.
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-400/20">
                    <p className="text-green-300 text-sm">
                      <strong>Recording in progress...</strong> Answer the question naturally. 
                      You can finish early by clicking "Next Question" or wait for the timer to complete.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <GlassButton
                      onClick={handleNextQuestion}
                      variant="primary"
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      {currentQuestionIndex < mockQuestions.length - 1 ? (
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