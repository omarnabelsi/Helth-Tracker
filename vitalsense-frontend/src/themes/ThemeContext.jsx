import { createContext, useContext, useEffect, useState } from 'react'
import { THEMES, DEFAULT_THEME } from './themes'
import { supabase } from '../lib/supabase'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(
    localStorage.getItem('vs_theme') || DEFAULT_THEME
  )

  // Apply CSS variables to :root whenever theme changes
  const applyTheme = (id) => {
    const theme = THEMES[id] || THEMES[DEFAULT_THEME]
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    // Set data attribute for any CSS selectors that need it
    root.setAttribute('data-theme', id)
  }

  // Change theme + save everywhere
  const changeTheme = async (id) => {
    if (!THEMES[id]) return
    setThemeId(id)
    localStorage.setItem('vs_theme', id)
    applyTheme(id)

    // Save to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('profiles')
          .update({ theme: id })
          .eq('user_id', session.user.id)
      }
    } catch (e) {
      console.error('Theme save error:', e)
    }
  }

  // On mount: load from Supabase or localStorage
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme')
            .eq('user_id', session.user.id)
            .single()
          const savedTheme = profile?.theme || localStorage.getItem('vs_theme') || DEFAULT_THEME
          setThemeId(savedTheme)
          applyTheme(savedTheme)
        } else {
          applyTheme(themeId)
        }
      } catch {
        applyTheme(themeId)
      }
    }
    init()
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ 
      themeId, 
      changeTheme, 
      setTheme: changeTheme, // Alias for compatibility
      theme: themeId,        // TopBar expects 'theme' to be the ID
      currentTheme: THEMES[themeId],
      themes: THEMES         // TopBar expects 'themes'
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)