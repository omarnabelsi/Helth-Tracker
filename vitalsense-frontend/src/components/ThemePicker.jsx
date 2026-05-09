import { THEMES } from '../themes/themes'
import { useTheme } from '../themes/ThemeContext'
import { useTranslation } from 'react-i18next'

const ThemePicker = () => {
  const { themeId, changeTheme } = useTheme()
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
        {isAr ? 'اختر مظهر التطبيق' : 'Choose your app theme'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {Object.values(THEMES).map(theme => {
          const isActive = themeId === theme.id
          return (
            <div
              key={theme.id}
              onClick={() => changeTheme(theme.id)}
              style={{
                border: `2px solid ${isActive ? theme.preview : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
                background: isActive ? `${theme.preview}15` : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {/* Active checkmark */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: theme.preview,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: 'white', fontWeight: '700'
                }}>✓</div>
              )}

              {/* Color preview dots */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                {Object.values(theme.vars)
                  .filter(v => v.startsWith('#'))
                  .slice(0, 5)
                  .map((color, i) => (
                    <div key={i} style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: color, border: '1.5px solid rgba(255,255,255,0.15)'
                    }}/>
                  ))
                }
              </div>

              {/* Theme name */}
              <div style={{
                color: isActive ? theme.preview : 'var(--text-primary)',
                fontSize: '13px', fontWeight: '700', marginBottom: '2px'
              }}>
                {theme.emoji} {isAr ? theme.nameAr : theme.name}
              </div>
            </div>
          )
        })}
      </div>

      {/* Live preview label */}
      <p style={{
        color: 'var(--text-muted)', fontSize: '11px',
        textAlign: 'center', marginTop: '12px'
      }}>
        {isAr ? 'المعاينة فورية — يتم الحفظ تلقائياً' : 'Preview is instant — saves automatically'}
      </p>
    </div>
  )
}

export default ThemePicker