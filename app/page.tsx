"use client"

import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { motion } from "framer-motion"
import { 
  Brain, 
  Users, 
  GraduationCap, 
  Zap, 
  Shield, 
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Play
} from "lucide-react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms analyze resumes and interview performance with 95% accuracy"
  },
  {
    icon: Users,
    title: "Smart Candidate Ranking",
    description: "Automatically rank candidates based on job requirements, experience, and skill matching"
  },
  {
    icon: GraduationCap,
    title: "Mock Interview Training",
    description: "Practice with realistic AI interviews, get stress analysis, and improve your performance"
  },
  {
    icon: Zap,
    title: "Lightning Fast Processing",
    description: "Process hundreds of resumes in minutes, not hours. Get results instantly"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with end-to-end encryption and GDPR compliance"
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Track hiring success rates and candidate performance with detailed analytics"
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "HR Director at TechCorp",
    content: "Mock'n-Hire reduced our screening time by 80% while improving candidate quality significantly.",
    rating: 5
  },
  {
    name: "Alex Rodriguez",
    role: "Computer Science Student",
    content: "The mock interviews helped me land my dream job. The AI feedback was incredibly detailed and helpful.",
    rating: 5
  },
  {
    name: "Michael Kim",
    role: "Startup Founder",
    content: "As a small team, Mock'n-Hire gives us enterprise-level hiring capabilities without the overhead.",
    rating: 5
  }
]

const stats = [
  { number: "50K+", label: "Candidates Screened" },
  { number: "95%", label: "Accuracy Rate" },
  { number: "80%", label: "Time Saved" },
  { number: "500+", label: "Companies Trust Us" }
]

export default function LandingPage() {
  const { user } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.role}`)
    }
  }, [user, router])

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <p className="text-white/60">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 mb-8">
              <Brain className="w-10 h-10 text-blue-400" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Next-Gen AI
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Hiring Suite
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Transform your hiring process with AI-powered resume screening and mock interviews. 
              Find the perfect candidates faster than ever before.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth/login">
              <GlassButton
                variant="primary"
                className="text-lg px-8 py-4 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </GlassButton>
            </Link>
            
            <GlassButton
              className="text-lg px-8 py-4 flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </GlassButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for Modern Hiring
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Everything you need to streamline your hiring process and find the best talent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-8 h-full">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 mb-6">
                    <feature.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How Mock'n-Hire Works
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Simple, powerful, and designed for both recruiters and candidates
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* For Recruiters */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">For Recruiters</h3>
                </div>
                
                <div className="space-y-6">
                  {[
                    "Upload job description and requirements",
                    "Bulk upload candidate resumes",
                    "AI analyzes and ranks candidates",
                    "Review detailed match scores",
                    "Shortlist top candidates instantly"
                  ].map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-sm mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-white/80">{step}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* For Students */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <GraduationCap className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">For Students</h3>
                </div>
                
                <div className="space-y-6">
                  {[
                    "Upload your resume and target role",
                    "Start AI-powered mock interview",
                    "Answer questions via video recording",
                    "Get real-time stress analysis",
                    "Receive detailed feedback and tips"
                  ].map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-semibold text-sm mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-white/80">{step}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              See what our users say about their experience with Mock'n-Hire
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-8 h-full">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Join thousands of companies and candidates who trust Mock'n-Hire for their hiring needs
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/login">
                <GlassButton
                  variant="primary"
                  className="text-lg px-8 py-4 flex items-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </GlassButton>
              </Link>
              
              <GlassButton
                className="text-lg px-8 py-4"
              >
                Contact Sales
              </GlassButton>
            </div>

            <div className="flex items-center justify-center space-x-6 text-white/60 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Mock'n-Hire</h3>
                <p className="text-xs text-white/60">AI Hiring Suite</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-8 text-white/60">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/60">
            <p>&copy; 2024 Mock'n-Hire. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}