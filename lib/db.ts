import { supabase } from './supabase'

export async function fetchCurrentUser(user_id: string, maxAttempts = 10) {
  console.log('Fetching user with ID:', user_id)
  
  for (let i = 0; i < maxAttempts; i++) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle()  // never 406

    if (error) {
      console.warn(`Attempt ${i + 1}/${maxAttempts} failed:`, error)
    }
    
    if (data) {
      console.log('Successfully fetched user:', data)
      return data
    }
    
    if (i < maxAttempts - 1) {
      console.log(`Retrying in 300ms... (${i + 1}/${maxAttempts})`)
      await new Promise(r => setTimeout(r, 300))  // 300ms back-off
    }
  }
  
  throw new Error('User row not found after retry loop')
}

// Test helper for development
if (typeof window !== 'undefined') {
  (window as any).testFetch = (id: string) => supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .single()
} 