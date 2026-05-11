import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { signInWithGoogle } from '../auth/googleAuth'

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Redirects automatically via OAuth
    } catch (err) {
      setGoogleLoading(false)
      setError('Google sign-in failed. Please try again.')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('auth.error_invalid', 'Invalid email or password'))
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
          <h1 className="font-heading text-3xl font-bold text-white mb-1">{t('auth.login_title', 'Welcome Back')}</h1>
          <p className="text-white/50 text-sm">{t('auth.login_subtitle', 'Sign in to continue your journey')}</p>
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
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.email', 'Email Address')}</label>
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
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.password', 'Password')}</label>
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
                  {t('auth.sign_in', 'Sign In')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}/>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '500' }}>
              {i18n.language === 'ar' ? 'أو' : 'OR'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}/>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              border: '1.5px solid #E5E7EB',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span style={{ color: '#1F2937', fontSize: '15px', fontWeight: '600' }}>
              {googleLoading
                ? (i18n.language === 'ar' ? 'جارٍ التسجيل...' : 'Signing in...')
                : (i18n.language === 'ar' ? 'تسجيل الدخول بـ Google' : 'Continue with Google')
              }
            </span>
          </button>


          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {t('auth.no_account', "Don't have an account?")}{' '}
              <Link to="/signup" className="text-primary-light hover:text-primary-lighter font-semibold transition-colors">
                {t('auth.sign_up', 'Sign Up')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2026 VitalSense AI</p>
      </div>
    </div>
  )
}
