import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          console.error('Auth callback error:', error)
          navigate('/login')
          return
        }

        const userId = session.user.id
        const userName = session.user.user_metadata?.full_name ||
                         session.user.user_metadata?.name || ''
        const avatarUrl = session.user.user_metadata?.avatar_url || ''

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('onboarding_complete, user_id')
          .eq('user_id', userId)
          .single()

        if (!existingProfile) {
          // New Google user — create profile with their Google name
          await supabase.from('profiles').insert({
            user_id: userId,
            name: userName,
            avatar_url: avatarUrl,
            onboarding_complete: false,
            language: 'en',
            theme: 'deep_forest'
          })

          // Create free subscription
          await supabase.from('subscriptions').insert({
            user_id: userId,
            plan: 'free',
            status: 'active'
          })

          // New user → go to onboarding
          navigate('/onboarding', { replace: true })
        } else if (!existingProfile.onboarding_complete) {
          // Existing but incomplete onboarding
          navigate('/onboarding', { replace: true })
        } else {
          // Returning user → go to dashboard
          navigate('/dashboard', { replace: true })
        }

      } catch (err) {
        console.error('Callback error:', err)
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="bg-bg-primary min-h-screen flex flex-col items-center justify-center gap-4">
      {/* VitaBot loading animation */}
      <div className="text-5xl animate-spin-slow">🤖</div>
      <div className="text-text-primary text-lg font-bold font-heading">
        Signing you in...
      </div>
      <div className="text-text-muted text-sm">
        Setting up your VitalSense account
      </div>
    </div>
  )
}

export default AuthCallback
