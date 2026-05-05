import { useState, useEffect } from 'react'
import { Bell, Search, Sun, Moon, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

export default function TopBar({ onMenuClick }) {
  const { t } = useTranslation();
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('vs_theme') || 'light')

  useEffect(() => {
    if (!user) return
    
    // Fetch profile
    supabase.from('profiles').select('name, language, theme').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data)
          // Apply saved language preference
          if (data.language && data.language !== i18n.language) {
            i18n.changeLanguage(data.language)
            document.documentElement.dir = data.language === 'ar' ? 'rtl' : 'ltr'
            document.documentElement.lang = data.language
          }
          // Apply saved theme preference
          if (data.theme) {
            setTheme(data.theme)
            document.documentElement.setAttribute('data-theme', data.theme)
            localStorage.setItem('vs_theme', data.theme)
          }
        }
      })
      
    // Fetch notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setNotifications(data)
    }
    
    fetchNotifications()
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        payload => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10))
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('vs_theme', newTheme)
    if (user) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('user_id', user.id)
    }
  }

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('vs_language', newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
    if (user) {
      await supabase.from('profiles').update({ language: newLang }).eq('user_id', user.id)
    }
  }

  const displayName = profile?.name || user?.user_metadata?.full_name || 'User'
  const initial = displayName[0]?.toUpperCase() || 'U'

  return (
    <header className="h-16 bg-bg-card border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted hover:text-primary-accent"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        {/* Search - hidden on small mobile to prevent overlap */}
        <div className="relative flex-1 md:w-80 hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-bg-main rounded-xl text-sm text-text-primary placeholder:text-text-light border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3 relative">
        {/* Language Toggle - only icon on mobile */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-xl bg-bg-main text-text-muted hover:text-primary-accent hover:bg-primary-pale transition-all text-xs font-bold"
          title="Toggle language"
        >
          <Globe size={14} />
          <span className="hidden xs:inline">{i18n.language === 'en' ? 'عربي' : 'EN'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted hover:text-primary-accent hover:bg-primary-pale transition-all"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted hover:text-primary-accent hover:bg-primary-pale transition-all"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setShowNotifications(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-80 bg-bg-card rounded-2xl shadow-2xl border border-gray-100 py-2 z-30 animate-scale-in">
              <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-text-primary">{t('settings.notifications')}</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-primary-accent hover:text-primary-light"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 hover:bg-bg-main transition-colors border-b border-gray-50 last:border-0 ${!n.read ? 'bg-primary-pale/30' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          n.type === 'alert' || n.type === 'emergency' ? 'bg-red-50 text-red-500' : 
                          n.type === 'workout' ? 'bg-green-50 text-green-600' :
                          n.type === 'achievement' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Bell size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{n.title}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[8px] text-text-light mt-1 uppercase tracking-wider font-semibold">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-text-muted">No notifications yet</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-50 text-center">
                <button className="text-[10px] font-bold text-text-light hover:text-text-primary transition-colors">
                  View all activity
                </button>
              </div>
            </div>
          </>
        )}
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initial}</span>
          </div>
          <span className="text-sm font-medium text-text-primary hidden sm:inline truncate max-w-[80px]">{displayName.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  )
}
