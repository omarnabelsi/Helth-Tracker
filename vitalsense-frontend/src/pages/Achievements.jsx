import { useState, useEffect } from 'react'
import { Trophy, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { BADGES } from '../utils/streaks'
import { useTranslation } from 'react-i18next'

export default function Achievements() {
  const { t } = useTranslation();
  const { user } = useAuth()
  const [unlocked, setUnlocked] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
      if (data) setUnlocked(data)
      setLoading(false)
    })()
  }, [user])

  const unlockedIds = new Set(unlocked.map((a) => a.badge_id))
  const unlockedCount = unlockedIds.size
  const totalCount = BADGES.length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-heading text-2xl font-bold text-text-primary">{t('nav.achievements')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('achievements.subtitle')}</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-bg-card rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-text-primary">
            {unlockedCount} / {totalCount} {t('achievements.unlocked_count')}
          </span>
          <span className="text-xs font-bold text-primary-accent">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-bg-main rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-accent to-primary-lighter rounded-full transition-all duration-700"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up delay-200">
        {BADGES.map((badge) => {
          const isUnlocked = unlockedIds.has(badge.id)
          const achievement = unlocked.find((a) => a.badge_id === badge.id)
          const unlockDate = achievement?.unlocked_at
            ? new Date(achievement.unlocked_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null

          return (
            <div
              key={badge.id}
              className={`relative bg-bg-card rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md text-center ${
                isUnlocked
                  ? 'border-primary-accent/30 hover:border-primary-accent/50'
                  : 'border-gray-100 opacity-60 grayscale'
              }`}
            >
              {/* Lock overlay for locked badges */}
              {!isUnlocked && (
                <div className="absolute top-3 right-3">
                  <Lock size={14} className="text-text-light" />
                </div>
              )}

              <div
                className={`text-4xl mb-3 ${isUnlocked ? '' : 'filter grayscale'}`}
              >
                {badge.icon}
              </div>
              <h3 className="font-heading font-bold text-text-primary text-sm mb-1">
                {t(`badges.${badge.id}.title`)}
              </h3>
              <p className="text-[11px] text-text-muted mb-2">{t(`badges.${badge.id}.desc`)}</p>
              {isUnlocked && unlockDate && (
                <span className="text-[10px] font-semibold text-primary-accent bg-primary-pale px-2.5 py-1 rounded-full">
                  {t('achievements.unlocked')} {unlockDate}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
