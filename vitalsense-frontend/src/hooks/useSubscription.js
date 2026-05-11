import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSub = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setSubscription(data || { plan: 'free', status: 'active' })
      setLoading(false)
    }
    fetchSub()
  }, [])

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'
  const isFree = !isPremium

  const canAccess = (feature) => {
    if (isPremium) return true
    const freeFeatures = ['basic_chat', 'basic_plan', 'basic_progress', 'lebanese_food']
    return freeFeatures.includes(feature)
  }

  return { subscription, loading, isPremium, isFree, canAccess }
}
