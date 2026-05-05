import { supabase } from '../lib/supabase'

export const authFetch = async (url, options = {}) => {
  // Get fresh session
  let { data: { session } } = await supabase.auth.getSession()
  
  // If no session try refresh
  if (!session) {
    const { data } = await supabase.auth.refreshSession()
    session = data?.session
  }
  
  // Still no session — throw so caller can redirect to login
  if (!session) {
    throw new Error('SESSION_EXPIRED')
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    }
  })
  
  // Auto retry once on 401
  if (response.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (!refreshed?.session) throw new Error('SESSION_EXPIRED')
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshed.session.access_token}`,
        ...options.headers
      }
    })
  }
  
  return response
}
