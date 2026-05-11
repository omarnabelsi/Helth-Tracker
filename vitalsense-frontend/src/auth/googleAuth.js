import { supabase } from '../lib/supabase'

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  if (error) {
    console.error('Google sign in error:', error)
    throw error
  }
  return data
}
