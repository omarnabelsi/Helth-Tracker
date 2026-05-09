import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export const LanguageToggle = ({ userId }) => {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const toggle = async () => {
    const newLang = isArabic ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
    // Save to Supabase
    if (userId) {
      await supabase.from('profiles')
        .update({ language: newLang })
        .eq('user_id', userId)
    }
  }

  return (
    <button 
      onClick={toggle} 
      className="bg-primary-pale/50 border border-primary-accent/30 rounded-2xl px-3.5 py-1.5 text-primary-accent text-xs font-bold cursor-pointer flex items-center gap-1.5 hover:bg-primary-pale transition-all"
    >
      {isArabic ? '🇬🇧 EN' : '🇱🇧 عربي'}
    </button>
  )
}
