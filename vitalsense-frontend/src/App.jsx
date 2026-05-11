import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import i18n from './i18n'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Workout from './pages/Workout'
import Chat from './pages/Chat'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Achievements from './pages/Achievements'
import FoodDetails from './pages/FoodDetails'
import InBodyAnalysis from './pages/InBodyAnalysis'
import AppLayout from './components/AppLayout'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import { AdminRoute } from './components/AdminRoute'

function useInitializeTheme() {
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user) {
      const fetchTheme = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', session.user.id)
          .single()
        if (data?.theme) {
          const saved = localStorage.getItem('vs_theme')
          if (data.theme !== saved) {
            localStorage.setItem('vs_theme', data.theme)
            window.dispatchEvent(new CustomEvent('theme-change', { detail: data.theme }))
          }
        }
      }
      fetchTheme();
    }
  }, [session])
}

export default function App() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  useInitializeTheme();

  useEffect(() => {
    if (loading) return;
    
    const initLanguage = async () => {
      if (!session) {
        const localLang = localStorage.getItem('language') || 'en'
        i18n.changeLanguage(localLang)
        document.documentElement.dir = localLang === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.lang = localLang
        return
      }

      // Check Supabase first
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('user_id', session.user.id)
        .single()

      const lang = profile?.language || localStorage.getItem('language') || 'en'
      i18n.changeLanguage(lang)
      localStorage.setItem('language', lang)
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }
    initLanguage()
  }, [session, loading])

  useEffect(() => {
    if (!loading && !session) {
      // Just track when session becomes null locally via context instead of setting another global auth listener
      if (window.location.pathname !== '/' && window.location.pathname !== '/signup' && window.location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
    }
  }, [session, loading, navigate])

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* NO protection for onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected: dashboard pages */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/food-details/:foodName" element={<FoodDetails />} />
          <Route path="/inbody" element={<InBodyAnalysis />} />
        </Route>

        {/* Pricing — accessible to all logged-in users */}
        <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />

        {/* Admin — protected by AdminRoute */}
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

      </Routes>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: '12px',
        },
      }} />
    </>
  )
}
