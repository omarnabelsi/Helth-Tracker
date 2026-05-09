import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ArrowRight, Loader2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError(t('auth.error_passwords'))
      return
    }
    if (form.password.length < 6) {
      setError(t('auth.error_password_length'))
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
        },
      })
      if (error) throw error
      // After signup, redirect to onboarding
      navigate('/onboarding')
    } catch (err) {
      setError(err.message || t('auth.error_signup'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-[#0f2b1f] flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary-light/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-accent/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-1">{t('auth.signup_title')}</h1>
          <p className="text-white/50 text-sm">{t('auth.signup_subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-md rounded-3xl border border-white/10 p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-200 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Omar Nasser"
                required
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20 outline-none transition-all ltr:pr-12 rtl:pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.confirm_password')}</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-accent hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-accent/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  {t('auth.sign_up')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="text-primary-light hover:text-primary-lighter font-semibold transition-colors">
                {t('auth.sign_in')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2026 VitalSense AI</p>
      </div>
    </div>
  )
}
