import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
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
import AppLayout from './components/AppLayout'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!session) {
          // Session truly dead — redirect to login
          navigate('/login')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
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
      </Route>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: '12px',
        },
      }} />
    </Routes>
  )
}
