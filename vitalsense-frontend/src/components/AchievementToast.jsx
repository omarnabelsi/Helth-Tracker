import { useState, useEffect } from 'react'

export default function AchievementToast({ badge, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDone?.(), 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!badge) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-primary-accent text-white rounded-2xl px-5 py-4 shadow-2xl shadow-primary-accent/30 flex items-center gap-3 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <span className="text-3xl">{badge.icon}</span>
      <div>
        <p className="text-xs font-bold text-white/70">🏅 Achievement Unlocked</p>
        <p className="font-bold text-sm">{badge.title}</p>
        <p className="text-xs text-white/80">{badge.desc}</p>
      </div>
    </div>
  )
}
