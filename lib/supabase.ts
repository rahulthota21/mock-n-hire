import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton Supabase client - never reinitialize
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'recruiter' | 'student'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'recruiter' | 'student'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'recruiter' | 'student'
          created_at?: string
          updated_at?: string
        }
      }
      screenings: {
        Row: {
          id: string
          title: string
          description: string
          recruiter_id: string
          status: 'pending' | 'processing' | 'completed'
          candidates_count: number
          shortlisted_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          recruiter_id: string
          status?: 'pending' | 'processing' | 'completed'
          candidates_count?: number
          shortlisted_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          recruiter_id?: string
          status?: 'pending' | 'processing' | 'completed'
          candidates_count?: number
          shortlisted_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      interview_sessions: {
        Row: {
          id: string
          student_id: string
          job_role: string
          status: 'pending' | 'in_progress' | 'completed'
          overall_score: number
          stress_level: number
          duration: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          job_role: string
          status?: 'pending' | 'in_progress' | 'completed'
          overall_score?: number
          stress_level?: number
          duration?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          job_role?: string
          status?: 'pending' | 'in_progress' | 'completed'
          overall_score?: number
          stress_level?: number
          duration?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}