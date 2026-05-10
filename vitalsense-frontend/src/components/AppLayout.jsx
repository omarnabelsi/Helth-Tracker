import { useState, useEffect } from 'react'
import { NavLink, useLocation, Outlet } from 'react-router-dom'
import {
  Home, Utensils, Dumbbell, TrendingUp, Brain, MessageCircle,
  Settings, Crown, ChevronLeft, ChevronRight, Bell, Search, Trophy, Zap
} from 'lucide-react'
import TopBar from './TopBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/dashboard', icon: Home, labelKey: 'nav.home' },
  { to: '/nutrition', icon: Utensils, labelKey: 'nav.nutrition' },
  { to: '/workout', icon: Dumbbell, labelKey: 'nav.workouts' },
  { to: '/inbody', icon: Zap, labelKey: 'nav.inbody_ai' },
  { to: '/progress', icon: TrendingUp, labelKey: 'nav.progress' },
  { to: '/achievements', icon: Trophy, labelKey: 'nav.achievements' },
  { to: '/chat', icon: Brain, labelKey: 'nav.insights' },
]

export default function AppLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const [sidebarProfile, setSidebarProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('name').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setSidebarProfile(data) })
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
        className={`absolute md:relative flex flex-col bg-primary-dark transition-all duration-300 ease-in-out z-40 h-full ${
          collapsed ? 'w-[72px]' : 'w-[200px]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
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
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center flex-shrink-0 ring-2 ring-primary-light/30">
              <span className="text-white text-sm font-bold">{initial}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{displayName.split(' ')[0]}</p>
                <div className="flex items-center gap-1">
                  <Crown size={10} className="text-yellow-400" />
                  <span className="text-[10px] text-yellow-400 font-medium">{t('common.premium')}</span>
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
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-card shadow-md border border-gray-200 items-center justify-center text-text-muted hover:text-primary-accent transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
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
