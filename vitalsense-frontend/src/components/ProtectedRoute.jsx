import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login', { replace: true }); return }
      
      const { data: profile } = await supabase
        .from('profiles').select('onboarding_complete')
        .eq('user_id', session.user.id).single()
        
      if (!profile || profile.onboarding_complete !== true) {
        navigate('/onboarding', { replace: true }); return
      }
      
      setReady(true)
    }
    check()
  }, [navigate])

  if (!ready) return (
    <div style={{background:'#0F1A14',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#4CAF7D',fontSize:'16px'}}>🤖 Loading VitaBot...</div>
    </div>
  )
  
  return children
}

export default ProtectedRoute
