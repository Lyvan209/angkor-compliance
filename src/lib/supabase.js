import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://skqxzsrajcdmkbxembrs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXh6c3JhamNkbWtieGVtYnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDMzODAsImV4cCI6MjA2NzIxOTM4MH0.Jdbgnse0y4c1KzRhf4ehtNYZq4tSLqD-nw_D7CmTfq8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const signIn = async (email, password) => {
  console.log('Attempting to sign in with:', email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.error('Sign in error:', error)
  } else {
    console.log('Sign in successful:', data)
  }
  
  return { data, error }
}

export const signUp = async (email, password, fullName) => {
  console.log('Attempting to sign up with:', email, fullName)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })
  
  if (error) {
    console.error('Sign up error:', error)
  } else {
    console.log('Sign up successful:', data)
  }
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
} 