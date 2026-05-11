import { useSubscription } from '../hooks/useSubscription'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Crown, Lock } from 'lucide-react'

export const PremiumGate = ({ feature, children, fallback }) => {
  const { isPremium, loading } = useSubscription()
  if (loading) return null
  if (isPremium) return children
  return fallback || <PremiumBanner feature={feature} />
}

export const PremiumBanner = ({ feature }) => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  return (
    <div className="rounded-2xl p-6 text-center border border-primary-accent/30 bg-gradient-to-br from-primary-accent/10 to-primary-accent/5 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
        <Crown size={26} className="text-yellow-400" />
      </div>
      <h3 className="font-heading font-bold text-text-primary text-lg mb-2">
        {isAr ? 'ميزة بريميوم' : 'Premium Feature'}
      </h3>
      <p className="text-text-muted text-sm mb-5 max-w-xs mx-auto">
        {isAr
          ? 'قم بالترقية إلى بريميوم للوصول إلى هذه الميزة وأكثر'
          : 'Upgrade to Premium to unlock this feature and much more'}
      </p>
      <button
        onClick={() => navigate('/pricing')}
        className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-accent/20 hover:scale-105"
      >
        <Crown size={16} />
        {isAr ? 'ترقية الآن — 9.99$ / شهر' : 'Upgrade Now — $9.99 / month'}
      </button>
    </div>
  )
}

// Small inline lock badge for nav items / buttons
export const PremiumBadge = () => (
  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ml-1.5 leading-none">
    PRO
  </span>
)

// Lock icon overlay for locked features
export const LockedOverlay = ({ onClick }) => (
  <div
    onClick={onClick}
    className="absolute inset-0 flex flex-col items-center justify-center bg-bg-card/80 backdrop-blur-sm rounded-2xl cursor-pointer z-10 gap-2 border border-primary-accent/20"
  >
    <Lock size={28} className="text-primary-accent" />
    <span className="text-xs font-bold text-text-muted">Premium only</span>
  </div>
)
