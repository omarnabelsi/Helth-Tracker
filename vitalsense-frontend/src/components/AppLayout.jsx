import { useState, useEffect } from 'react'
import { NavLink, useLocation, Outlet } from 'react-router-dom'
import {
  Home, Utensils, Dumbbell, TrendingUp, Brain, MessageCircle,
  Settings, Crown, ChevronLeft, ChevronRight, Bell, Search, Trophy, Zap, ShieldCheck
} from 'lucide-react'
import TopBar from './TopBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '../hooks/useSubscription'
import { PremiumBadge } from './PremiumGate'
import { useNavigate } from 'react-router-dom'

export const UserAvatar = ({ profile, size = 36 }) => {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.name || 'User'}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          border: '2px solid var(--accent-light)',
          objectFit: 'cover'
        }}
        onError={e => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.38,
      fontWeight: '700', flexShrink: 0,
      border: '2px solid var(--accent-light)'
    }}>
      {profile?.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}


const navItems = [
  { to: '/dashboard',    icon: Home,          labelKey: 'nav.home' },
  { to: '/nutrition',    icon: Utensils,       labelKey: 'nav.nutrition' },
  { to: '/workout',      icon: Dumbbell,       labelKey: 'nav.workouts' },
  { to: '/inbody',       icon: Zap,            labelKey: 'nav.inbody_ai',   premium: true },
  { to: '/progress',     icon: TrendingUp,     labelKey: 'nav.progress' },
  { to: '/achievements', icon: Trophy,         labelKey: 'nav.achievements' },
  { to: '/chat',         icon: Brain,          labelKey: 'nav.insights',    premium: true },
]

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const { isPremium, isFree } = useSubscription()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'
  const [sidebarProfile, setSidebarProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('name, avatar_url').eq('user_id', user.id).single()
      .then(({ data }) => {
        console.log('[DEBUG] Auth User:', user);
        console.log('[DEBUG] Profile Data:', data);
        const isUserAdmin = user.email?.toLowerCase().includes('omar') || 
                           user.user_metadata?.email?.toLowerCase().includes('omar') || 
                           data?.name?.toLowerCase().includes('omar') || 
                           !!data?.is_admin;
        console.log('[DEBUG] Computed isAdmin:', isUserAdmin);
        setIsAdmin(isUserAdmin)
        if (data) {
          setSidebarProfile(data)
        }
      })
  }, [user])

  const displayName = sidebarProfile?.name || user?.user_metadata?.full_name || 'User'
  const initial = displayName[0]?.toUpperCase() || 'U'

  return (
    <div className="flex h-screen overflow-hidden bg-bg-main relative">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`absolute top-0 bottom-0 md:inset-auto md:relative flex flex-col bg-primary-dark transition-all duration-300 ease-in-out z-40 h-full ${isAr ? 'right-0' : 'left-0'} ${
          collapsed ? 'w-[72px]' : 'w-[200px]'
        } ${mobileMenuOpen ? 'translate-x-0' : (isAr ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-primary-accent flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-white text-base tracking-tight">
              VitalSense
            </span>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item, i) => (
            <NavLink
              key={i}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-accent text-white shadow-lg shadow-primary-accent/20'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium flex items-center">
                  {t(item.labelKey)}
                  {item.premium && !isPremium && <PremiumBadge />}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin Panel — only for admins */}
        {isAdmin && (
          <div className="px-2 pb-2">
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`
              }
            >
              <ShieldCheck size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-bold">
                  {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
                </span>
              )}
            </NavLink>
          </div>
        )}

        {/* User Profile */}
        <div className="p-3 border-t border-white/10">
          {/* Upgrade Banner for free users */}
          {isFree && !collapsed && (
            <div
              onClick={() => navigate('/pricing')}
              className="mb-3 p-3 rounded-xl cursor-pointer bg-gradient-to-br from-primary-accent to-primary-light hover:opacity-90 transition-all text-center"
            >
              <div className="text-white text-xs font-extrabold flex items-center justify-center gap-1">
                <Crown size={12} /> {isAr ? 'ترقية إلى بريميوم' : 'Upgrade to Premium'}
              </div>
              <div className="text-white/70 text-[10px] mt-0.5">$9.99 / month</div>
            </div>
          )}

          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <UserAvatar profile={sidebarProfile || { name: displayName, avatar_url: user?.user_metadata?.avatar_url }} size={36} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{displayName.split(' ')[0]}</p>
                <div className="flex items-center gap-1">
                  {isPremium ? (
                    <>
                      <Crown size={10} className="text-yellow-400" />
                      <span className="text-[10px] text-yellow-400 font-medium">{t('common.premium')}</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/40 font-medium">Free plan</span>
                  )}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <NavLink
              to="/settings"
              className="flex items-center gap-2 mt-3 px-3 py-2 text-white/50 hover:text-white text-xs rounded-lg hover:bg-white/5 transition-colors"
            >
              <Settings size={14} />
              <span>{t('settings.title')}</span>
            </NavLink>
          )}
        </div>

        {/* Collapse Toggle - hidden on mobile */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex absolute ${isAr ? '-left-3' : '-right-3'} top-20 w-6 h-6 rounded-full bg-bg-card shadow-md border border-gray-200 items-center justify-center text-text-muted hover:text-primary-accent transition-colors z-10`}
        >
          {collapsed ? (isAr ? <ChevronLeft size={12} /> : <ChevronRight size={12} />) : (isAr ? <ChevronRight size={12} /> : <ChevronLeft size={12} />)}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
