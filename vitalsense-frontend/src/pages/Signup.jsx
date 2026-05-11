import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2, UserPlus, Mail, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { signInWithGoogle } from '../auth/googleAuth'

// ── Email Verification Modal ──────────────────────────────────
function VerifyEmailModal({ email, onContinue }) {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setResent(true)
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-card border border-border-color rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up text-center space-y-5">

        {/* Animated mail icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 bg-primary-accent/20 rounded-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-accent/30 to-primary-accent/10 border border-primary-accent/40 flex items-center justify-center">
            <Mail size={36} className="text-primary-accent" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-extrabold text-text-primary">
            Check your inbox ✉️
          </h2>
          <p className="text-text-muted text-sm leading-relaxed">
            We sent a verification link to:
          </p>
          <div className="bg-bg-main rounded-xl px-4 py-2.5 border border-border-color inline-block w-full">
            <span className="text-primary-accent font-bold text-sm">{email}</span>
          </div>
          <p className="text-text-muted text-xs leading-relaxed pt-1">
            Click the link in the email to activate your account, then click the button below to continue.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-bg-main rounded-2xl p-4 border border-border-color text-left space-y-3">
          {[
            { step: '1', text: 'Open your Gmail inbox' },
            { step: '2', text: 'Find the email from VitalSense AI' },
            { step: '3', text: 'Click "Confirm your email"' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                {s.step}
              </span>
              <span className="text-text-muted text-sm">{s.text}</span>
            </div>
          ))}
        </div>

        {/* Open Gmail */}
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border-color bg-white/5 text-text-primary text-sm font-semibold hover:bg-white/10 transition-all"
        >
          <ExternalLink size={15} />
          Open Gmail
        </a>

        {/* Continue */}
        <button
          onClick={onContinue}
          className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary-accent/20"
        >
          <CheckCircle size={16} />
          I've Verified — Continue
        </button>

        {/* Resend */}
        <div>
          {resent && (
            <p className="text-xs text-emerald-400 font-medium mb-2 animate-fade-in flex items-center justify-center gap-1">
              <CheckCircle size={12} /> Email resent successfully!
            </p>
          )}
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary-accent transition-colors mx-auto disabled:opacity-40"
          >
            <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resending
              ? 'Sending...'
              : "Didn't receive it? Resend email"}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Signup Page ───────────────────────────────────────────────
export default function Signup() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setGoogleLoading(false)
      setError('Google sign-up failed. Please try again.')
    }
  }

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
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      })
      if (error) throw error

      // Supabase returns identities: [] (empty) when email is already registered
      if (data?.user && data.user.identities?.length === 0) {
        setError('__email_exists__')
        return
      }

      setShowVerifyModal(true)
    } catch (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('email already')) {
        setError('__email_exists__')
      } else {
        setError(err.message || t('auth.error_signup'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-[#0f2b1f] flex items-center justify-center p-6">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary-light/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-accent/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-1">{t('auth.signup_title', 'Create Account')}</h1>
          <p className="text-white/50 text-sm">{t('auth.signup_subtitle', 'Join VitalSense AI and transform your health')}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-md rounded-3xl border border-white/10 p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {error === '__email_exists__' ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 animate-fade-in">
                <p className="text-yellow-200 text-sm font-semibold">📧 This email is already registered.</p>
                <p className="text-yellow-200/70 text-xs mt-1">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-light font-bold underline underline-offset-2 hover:text-primary-lighter">
                    Sign in instead →
                  </Link>
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-200 text-sm animate-fade-in">
                {error}
              </div>
            ) : null}

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.name', 'Full Name')}</label>
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
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.email', 'Email Address')}</label>
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
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.password', 'Password')}</label>
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
              <label className="text-white/70 text-sm font-medium block mb-1.5">{t('auth.confirm_password', 'Confirm Password')}</label>
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
                  {t('auth.sign_up', 'Create Account')}
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
                : (i18n.language === 'ar' ? 'إنشاء حساب بـ Google' : 'Sign up with Google')
              }
            </span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {t('auth.have_account', "Already have an account?")}{' '}
              <Link to="/login" className="text-primary-light hover:text-primary-lighter font-semibold transition-colors">
                {t('auth.sign_in', 'Sign In')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2026 VitalSense AI</p>
      </div>

      {/* Email Verification Popup */}
      {showVerifyModal && (
        <VerifyEmailModal
          email={form.email}
          onContinue={() => navigate('/onboarding')}
        />
      )}
    </div>
  )
}
