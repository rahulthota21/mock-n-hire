import { supabase } from './supabase'
import { fetchCurrentUser } from './db'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const fetchUserWithRetry = async (userId: string, maxRetries = 3) => {
  console.log('Fetching user with ID:', userId)
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error(`Attempt ${i + 1} failed:`, error)
        if (i < maxRetries - 1) {
          console.log('Retrying in 500ms...')
          await delay(500)
          continue
        }
        throw error
      }

      console.log('Successfully fetched user:', profile)
      return { profile, error: null }
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await delay(500)
    }
  }
  return { profile: null, error: new Error('Max retries exceeded') }
}

export const signUp = async (email: string, password: string, name: string, role: 'recruiter' | 'student') => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    })

    if (error) throw error

    if (data.user) {
      const user_id = data.user.id
      console.log('Auth user created with ID:', user_id)
      
      // Create profile
      const userData = {
        user_id,
        email,
        name,
        role
      }
      console.log('Inserting user with data:', userData)

      await supabase
        .from('users')
        .insert(userData)
        .throwOnError()

      console.log('User inserted successfully')
      
      // Return the freshly-inserted profile directly
      return { 
        data: { 
          user: data.user,
          profile: userData
        }, 
        error: null 
      }
    }

    return { data: null, error: null }
  } catch (error) {
    console.error('Signup error:', error)
    return { data: null, error }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      console.log('User signed in with ID:', data.user.id)
      const profile = await fetchCurrentUser(data.user.id)
      return { data: { ...data, profile }, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { data: null, error }
  }
}

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    if (user) {
      console.log('Getting current user with ID:', user.id)
      const profile = await fetchCurrentUser(user.id)
      return { user: profile, error: null }
    }

    return { user: null, error: null }
  } catch (error) {
    console.error('Get current user error:', error)
    return { user: null, error }
  }
}