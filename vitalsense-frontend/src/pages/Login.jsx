import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('auth.error_invalid'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-[#0f2b1f] flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-light/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-accent/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-1">{t('auth.login_title')}</h1>
          <p className="text-white/50 text-sm">{t('auth.login_subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-md rounded-3xl border border-white/10 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-200 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-accent hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {t('auth.sign_in')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {t('auth.no_account')}{' '}
              <Link to="/signup" className="text-primary-light hover:text-primary-lighter font-semibold transition-colors">
                {t('auth.sign_up')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2026 VitalSense AI</p>
      </div>
    </div>
  )
}
