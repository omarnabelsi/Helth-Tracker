import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export const AdminRoute = ({ children }) => {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!profile?.is_admin) { navigate('/dashboard'); return }
      setAllowed(true)
      setLoading(false)
    }
    check()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg-main">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary-accent" size={32} />
        <p className="text-text-muted text-sm font-medium">Verifying admin access...</p>
      </div>
    </div>
  )
  return allowed ? children : null
}
