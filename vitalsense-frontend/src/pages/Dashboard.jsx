import { useState, useEffect } from 'react'
import {
  Flame, Utensils, Dumbbell, Camera as CameraIcon,
  TrendingUp, TrendingDown, Moon, Scale, ChevronLeft, ChevronRight,
  MessageCircle, ArrowRight, Clock, Zap, AlertTriangle, Sparkles, X,
  ChevronDown, ChevronUp, RefreshCw, Trophy
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProgressRing from '../components/ProgressRing'
import MacroBar from '../components/MacroBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { unlockFirstLogin } from '../utils/streaks'
import { authFetch } from '../utils/authFetch'
import { useTranslation } from 'react-i18next'
import { PPL_SCHEDULE, getPPLDay } from '../data/pplSplit'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const today = new Date()

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth()
  const navigate = useNavigate()
  const [calendarMonth] = useState(today.getMonth())
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissedAdvisories, setDismissedAdvisories] = useState([])
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [mealLogs, setMealLogs] = useState([])
  const [streak, setStreak] = useState(null)
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [reportExpanded, setReportExpanded] = useState(false)
  const [recentBadges, setRecentBadges] = useState([])
  const [dismissedReminders, setDismissedReminders] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_reminders') || '[]') } catch { return [] }
  })
  const [showRecalibrate, setShowRecalibrate] = useState(false)

  // Load profile & plan from Supabase
  useEffect(() => {
    if (!user) return
    
    // Load dismissed from local storage
    const saved = localStorage.getItem(`dismissed_advisories_${user.id}`)
    if (saved) setDismissedAdvisories(JSON.parse(saved))

    ;(async () => {
      try {
        // Get profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (prof) setProfile(prof)

        // Get AI-generated plan
        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        if (plans && plans.length > 0) {
          setPlan(plans[0].plan_data)
        }

        // Fetch logs for calendar dots
        const { data: wLogs } = await supabase.from('workout_logs').select('date').eq('user_id', user.id)
        if (wLogs) setWorkoutLogs(wLogs.map(l => l.date))
        
        const { data: mLogs } = await supabase.from('meal_logs').select('logged_at').eq('user_id', user.id)
        if (mLogs) setMealLogs(mLogs.map(l => l.logged_at.split('T')[0]))

        // Fetch streak
        const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', user.id).single()
        if (streakData) setStreak(streakData)

        // Fetch recent badges
        const { data: badges } = await supabase.from('achievements').select('*').eq('user_id', user.id).order('unlocked_at', { ascending: false }).limit(3)
        if (badges) setRecentBadges(badges)

        // Unlock first login badge
        unlockFirstLogin(user.id)

        // Check weekly report (Monday)
        if (new Date().getDay() === 1) {
          try {
            const wr = await authFetch(`${API_BASE}/api/weekly-report/${user.id}`)
            if (wr.ok) { const d = await wr.json(); if (d) setWeeklyReport(d) }
          } catch {}
        }

        // Check recalibration (14 days since plan)
        if (plans?.length) {
          const planDate = new Date(plans[0].created_at)
          const daysSince = Math.floor((Date.now() - planDate.getTime()) / 86400000)
          const lastRecal = prof?.last_recalibration_date
          if (daysSince >= 14 && (!lastRecal || Math.floor((Date.now() - new Date(lastRecal).getTime()) / 86400000) >= 14)) {
            setShowRecalibrate(true)
          }
        }

      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const dismissAdvisory = (text) => {
    const next = [...dismissedAdvisories, text]
    setDismissedAdvisories(next)
    localStorage.setItem(`dismissed_advisories_${user.id}`, JSON.stringify(next))
  }

  // Extract today's data from plan
  const todayDayName = fullDayNames[today.getDay()]
  const todayMeals = plan?.weeklyMealPlan?.[todayDayName] || []
  const todayWorkout = plan?.weeklyWorkoutPlan?.find(w => w.day === todayDayName || w.dayName === todayDayName)
  const healthWarnings = (plan?.healthWarnings || []).filter(w => !dismissedAdvisories.includes(w))
  const coachTip = plan?.coachTip || null

  // Calculate today's nutrition from AI plan
  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  todayMeals.forEach(meal => {
    if (Array.isArray(meal.dishes)) {
      meal.dishes.forEach(d => {
        totalCal += (d.calories || 0);
        totalP += (d.protein || 0);
        totalC += (d.carbs || 0);
        totalF += (d.fat || 0);
      });
    } else {
      // Fallback for flat structure
      totalCal += (meal.calories || 0);
      totalP += (meal.protein || 0);
      totalC += (meal.carbs || 0);
      totalF += (meal.fat || 0);
    }
  });
  totalCal = Math.round(totalCal);
  totalP = Math.round(totalP);
  totalC = Math.round(totalC);
  totalF = Math.round(totalF);
  const calorieTarget = Math.round(profile?.calorie_target || 2000)

  const userName = profile?.name || user?.user_metadata?.full_name || 'User'

  // Determine greeting based on time
  const hour = today.getHours()
  const greeting = hour < 12 ? t('dashboard.greeting_morning') : hour < 18 ? t('dashboard.greeting_afternoon') : t('dashboard.greeting_evening')

  return (
    <div className="flex gap-0 h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            {greeting}, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {loading ? t('common.loading') : t('dashboard.subtitle')}
          </p>
        </div>

        {/* ── Smart Meal Reminders ── */}
        <MealReminders dismissed={dismissedReminders} setDismissed={setDismissedReminders} navigate={navigate} />

        {/* ── Health Warnings (from AI plan) ── */}
        {healthWarnings.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            {healthWarnings.map((warning, i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 relative group hover:bg-amber-500/10 transition-all duration-300 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 pr-8">
                  <p className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <span>⚠️</span> {t('dashboard.health_advisory')}
                  </p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{warning}</p>
                </div>
                <button 
                  onClick={() => dismissAdvisory(warning)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:bg-red-500/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-primary-dark to-[#1a4a36] rounded-3xl p-8 text-white relative overflow-hidden animate-fade-in-up">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-accent/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"></div>
          <div className="absolute bottom-0 right-20 w-48 h-48 bg-primary-light/8 rounded-full blur-2xl"></div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 md:gap-8">
              <ProgressRing
                value={Math.min(100, Math.round((totalCal / calorieTarget) * 100))}
                max={100}
                size={140}
                strokeWidth={12}
                color="#4CAF7D"
                bgColor="rgba(255,255,255,0.1)"
                className="flex-shrink-0"
              />
              <div>
                <h2 className="font-heading text-xl font-bold mb-1">{t('dashboard.daily_goal')}</h2>
                <p className="text-white/60 text-sm mb-4 max-w-sm">
                  {plan 
                    ? `${t('dashboard.todays_plan')} ${calorieTarget} ${t('common.kcal')} ${t('dashboard.today')}` 
                    : `${t('onboarding.daily_calories')}: ${calorieTarget} ${t('common.kcal')}`
                  }
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-sm font-semibold">🔥 {streak?.current_streak || 0} {t('dashboard.streak_days')}</span>
                </div>
              </div>
            </div>
            {/* Mountain Illustration */}
            <div className="hidden xl:block">
              <svg width="180" height="120" viewBox="0 0 180 120" fill="none" className="opacity-30">
                <path d="M0 120L40 60L70 85L110 25L140 65L180 20V120H0Z" fill="url(#mountainGrad)" />
                <path d="M0 120L50 75L80 95L130 40L160 70L180 50V120H0Z" fill="url(#mountainGrad2)" />
                <circle cx="150" cy="20" r="12" fill="#4CAF7D" opacity="0.5" />
                <defs>
                  <linearGradient id="mountainGrad" x1="90" y1="20" x2="90" y2="120">
                    <stop stopColor="#4CAF7D" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#4CAF7D" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="mountainGrad2" x1="90" y1="40" x2="90" y2="120">
                    <stop stopColor="#2E7D52" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#2E7D52" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* 3 Cards Row */}
        <div className="grid lg:grid-cols-3 gap-5 animate-fade-in-up delay-200">
          {/* Nutrition Card — from AI plan */}
          <div
            className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/nutrition')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-pale flex items-center justify-center">
                  <Utensils size={16} className="text-primary-accent" />
                </div>
                <h3 className="font-heading font-bold text-text-primary">{t('nav.nutrition')}</h3>
              </div>
              <span className="text-xs text-primary-accent font-semibold bg-primary-pale px-2.5 py-1 rounded-full">{t('common.today')}</span>
            </div>
            {todayMeals.length > 0 ? (
              <>
                <div className="mb-3 space-y-1.5">
                  {todayMeals.slice(0, 3).map((meal, i) => {
                    const mealNameStr = meal.meal ? (i18n.language === 'ar' ? t(`nutrition.${meal.meal.toLowerCase()}`) || meal.meal : meal.meal) : meal.name;
                    return (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-text-primary font-medium truncate mr-2">{mealNameStr}</span>
                        <span className="text-text-muted flex-shrink-0">{Math.round(meal.dishes ? meal.dishes.reduce((a, b) => a + (b.calories || 0), 0) : meal.calories)} {t('common.kcal')}</span>
                      </div>
                    )
                  })}
                  {todayMeals.length > 3 && (
                    <p className="text-[10px] text-text-light">+{todayMeals.length - 3} {t('dashboard.more_meals') || 'more'}</p>
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold text-text-primary font-heading">{totalCal}</span>
                    <span className="text-sm text-text-muted mb-1">/ {calorieTarget} {t('common.kcal')}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <MacroBar label={t('nutrition.protein')} current={totalP} target={Math.round(calorieTarget * 0.3 / 4)} color="#3B82F6" />
                  <MacroBar label={t('nutrition.carbs')} current={totalC} target={Math.round(calorieTarget * 0.4 / 4)} color="#F59E0B" />
                  <MacroBar label={t('nutrition.fat')} current={totalF} target={Math.round(calorieTarget * 0.3 / 9)} color="#EF4444" />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="mb-2">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold text-text-primary font-heading">0</span>
                    <span className="text-sm text-text-muted mb-1">/ {calorieTarget} {t('common.kcal')}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">{t('dashboard.no_plan')}</p>
                </div>
                <div className="space-y-3">
                  <MacroBar label={t('nutrition.protein')} current={0} target={Math.round(calorieTarget * 0.3 / 4)} color="#3B82F6" />
                  <MacroBar label={t('nutrition.carbs')} current={0} target={Math.round(calorieTarget * 0.4 / 4)} color="#F59E0B" />
                  <MacroBar label={t('nutrition.fat')} current={0} target={Math.round(calorieTarget * 0.3 / 9)} color="#EF4444" />
                </div>
                <button onClick={() => navigate('/settings')} className="w-full bg-primary-accent text-white text-xs font-semibold py-2 rounded-xl mt-1">{t('dashboard.generate_plan')}</button>
              </div>
            )}
          </div>

          {/* Workout Card — from AI plan */}
          <div
            className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
            onClick={() => navigate('/workout')}
          >
            {(() => {
              const pplDayNum = getPPLDay()
              const pplInfo = PPL_SCHEDULE[pplDayNum]
              const pplColors = { push: '#E53935', pull: '#1E88E5', legs: '#43A047', rest: '#757575' }
              const isAr = i18n.language === 'ar'
              
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${pplColors[pplInfo.type]}15` }}>
                        <Dumbbell size={16} style={{ color: pplColors[pplInfo.type] }} />
                      </div>
                      <h3 className="font-heading font-bold text-text-primary">{t('dashboard.workout_card')}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: `${pplColors[pplInfo.type]}15`, color: pplColors[pplInfo.type] }}>
                      {isAr ? pplInfo.nameAr : pplInfo.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-5 mb-4">
                    <div className="text-4xl">{pplInfo.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-text-primary text-sm uppercase tracking-tight truncate" style={{ color: pplColors[pplInfo.type] }}>
                        {isAr ? pplInfo.nameAr : pplInfo.name}
                      </h4>
                      <p className="text-[11px] text-text-muted truncate">{isAr ? pplInfo.descAr : pplInfo.desc}</p>
                    </div>
                  </div>

                  {todayWorkout ? (
                    <div className="space-y-1.5 mb-4">
                      {todayWorkout.exercises?.slice(0, 2).map((ex, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-text-primary font-medium truncate mr-2">{isAr ? ex.nameAr : ex.name}</span>
                          <span className="text-text-muted flex-shrink-0">{ex.sets}×{ex.reps}</span>
                        </div>
                      ))}
                      {(todayWorkout.exercises?.length || 0) > 2 && (
                        <p className="text-[10px] text-text-light">+{todayWorkout.exercises.length - 2} {t('workout.exercises')}</p>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-text-muted mb-2">{t('dashboard.no_plan')}</p>
                    </div>
                  )}

                  <button 
                    className="w-full text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    style={{ background: `${pplColors[pplInfo.type]}15`, color: pplColors[pplInfo.type] }}
                  >
                    {todayWorkout ? `${t('common.today')} →` : `${t('dashboard.generate_plan')} →`}
                  </button>
                </>
              )
            })()}
          </div>

          {/* Body Progress Card */}
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <CameraIcon size={16} className="text-purple-600" />
                </div>
                <h3 className="font-heading font-bold text-text-primary">{t('dashboard.body_progress')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="col-span-3 text-center py-4">
                  <p className="text-xs text-text-muted">{t('progress.no_photos')}</p>
                </div>
            </div>
            <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">
              {t('dashboard.see_all_progress')} →
            </button>
          </div>
        </div>

        {/* Coach Says — with AI tip */}
        <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in-up delay-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center flex-shrink-0 ring-3 ring-primary-accent/20">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-bold text-text-primary">{t('dashboard.coach_says')}</h3>
                <span className="text-[10px] bg-primary-pale text-primary-accent font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={8} /> AI Insight
                </span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {coachTip || t('dashboard.mock_tip')}
              </p>
              <button
                onClick={() => navigate('/chat')}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-accent hover:text-primary-light transition-colors group"
              >{t('dashboard.ask_coach')}<ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Recent Badges Strip ── */}
        {recentBadges.length > 0 && (
          <div className="bg-bg-card rounded-2xl p-5 border border-gray-100 shadow-sm animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-yellow-500" />
                <h3 className="font-heading font-bold text-text-primary text-sm">{t('achievements.recent')}</h3>
              </div>
              <button onClick={() => navigate('/achievements')} className="text-xs font-bold text-primary-accent hover:text-primary-light">{t('dashboard.view_all')} →</button>
            </div>
            <div className="flex gap-3">
              {recentBadges.map((b, i) => {
                const badgeDef = { first_login: '👋', first_workout: '💪', first_meal_log: '🍽️', streak_3: '🔥', streak_7: '⚡', streak_14: '🏆', streak_30: '👑', lost_1kg: '⚖️', lost_5kg: '🎯', workouts_10: '🏅', plan_complete: '✅', calorie_goal_7: '🥗' }
                return (
                  <div key={i} className="flex items-center gap-2 bg-bg-main rounded-xl px-3 py-2">
                    <span className="text-xl">{badgeDef[b.badge_id] || '🏅'}</span>
                    <span className="text-xs font-semibold text-text-primary">{b.badge_id.replace(/_/g, ' ')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Weekly Report Card ── */}
        {weeklyReport && (
          <div className="bg-bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up delay-400">
            <button onClick={() => setReportExpanded(!reportExpanded)} className="w-full flex items-center justify-between p-5 hover:bg-bg-main/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-accent flex items-center justify-center"><Sparkles size={18} className="text-white" /></div>
                <div className="text-left">
                  <h3 className="font-heading font-bold text-text-primary text-sm">📊 {t('dashboard.weekly_report')} — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <p className="text-xs text-text-muted">{t('dashboard.keep_going')}</p>
                </div>
              </div>
              {reportExpanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
            </button>
            {reportExpanded && (
              <div className="px-5 pb-5">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{weeklyReport.report_text}</p>
                <button onClick={async () => { const r = await authFetch(`${API_BASE}/api/weekly-report/`, { method: 'POST', body: JSON.stringify({ user_id: user.id }) }); if (r.ok) { const d = await r.json(); setWeeklyReport(d) } }} className="mt-3 flex items-center gap-2 text-xs font-bold text-primary-accent hover:text-primary-light"><RefreshCw size={12} /> {t('dashboard.regenerate')}</button>
              </div>
            )}
          </div>
        )}

        {/* ── Recalibration Banner ── */}
        {showRecalibrate && (
          <div className="bg-primary-pale border border-primary-light/30 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <p className="text-sm font-semibold text-primary-accent">It's been 2 weeks! Time to recalibrate your plan based on your progress.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/settings')} className="bg-primary-accent text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-accent/90">{t('progress.recalibrate_now')}</button>
              <button onClick={() => setShowRecalibrate(false)} className="text-xs font-bold text-text-muted hover:text-text-primary">{t('progress.remind_later')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-[280px] bg-bg-card border-l border-gray-100 overflow-y-auto p-5 space-y-5 flex-shrink-0 hidden xl:block">
        {/* Rebuilt Calendar */}
        <div className="animate-slide-right">
          <Calendar 
            workoutLogs={workoutLogs} 
            mealLogs={mealLogs} 
          />
        </div>

        {/* Weight Widget */}
        <div className="bg-bg-main rounded-2xl p-4 animate-slide-right delay-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale size={14} className="text-primary-accent" />
              <h3 className="text-sm font-bold text-text-primary">{t('settings.weight')}</h3>
            </div>
             <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <><TrendingDown size={10} /> --</>
            </span>
          </div>
          <div className="mb-2">
            <span className="text-2xl font-bold text-text-primary font-heading">{profile?.weight || '--'}</span>
            <span className="text-sm text-text-muted ml-1">{t('common.kg')}</span>
          </div>
          {/* Mini trend line */}
          <svg width="100%" height="50" viewBox="0 0 200 50" className="text-primary-light">
            <path
              d="M0 40 Q25 35, 50 30 T100 25 T150 20 T200 15"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 40 Q25 35, 50 30 T100 25 T150 20 T200 15 V50 H0Z"
              fill="url(#weightGrad)"
            />
            <defs>
              <linearGradient id="weightGrad" x1="100" y1="0" x2="100" y2="50">
                <stop stopColor="#4CAF7D" stopOpacity="0.15" />
                <stop offset="1" stopColor="#4CAF7D" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <p className="text-[10px] text-text-muted mt-1">{t('progress.log_first_weight')}</p>
        </div>

      </div>
    </div>
  )
}
// ── Custom Calendar Component (Fix 5) ──
function Calendar({ workoutLogs, mealLogs }) {
  const { i18n } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date())
  const today = new Date()
  
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  
  const monthName = viewDate.toLocaleString(i18n.language === 'ar' ? 'ar' : 'en-US', { month: 'long' })
  const firstDay = new Date(year, month, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Shift firstDay to start on Monday (Mon=0, ..., Sun=6)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  
  const days = []
  // Fill blanks
  for (let i = 0; i < startOffset; i++) days.push(null)
  // Fill days
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-text-primary text-sm">
          {monthName} {year}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft size={14} /></button>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {(i18n.language === 'ar' ? ['ن','ث','ر','خ','ج','س','ح'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((d, i) => (
          <span key={`day-${i}-${d}`} className="text-[10px] text-text-muted font-bold py-1">{d}</span>
        ))}
        
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="w-8 h-8" />
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          
          const hasWorkout = workoutLogs.includes(dateStr)
          const hasMeal = mealLogs.includes(dateStr)
          
          return (
            <div key={day} className="flex flex-col items-center">
              <button
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all relative ${
                  isToday
                    ? 'bg-[#1B3A2D] text-white shadow-md'
                    : 'text-text-primary hover:bg-bg-main'
                }`}
              >
                {day}
                {/* Dots */}
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasWorkout && <div className="w-1 h-1 rounded-full bg-green-500" />}
                  {hasMeal && <div className="w-1 h-1 rounded-full bg-orange-400" />}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Smart Meal Reminders ──
function MealReminders({ dismissed, setDismissed, navigate }) {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  const reminders = []
  if (hour >= 8 && hour < 10 && !dismissed.includes('breakfast'))
    reminders.push({ id: 'breakfast', text: t('dashboard.reminder_breakfast'), color: 'bg-amber-500/10 border-amber-500/20 text-amber-500' })
  if (hour >= 12 && hour < 14 && !dismissed.includes('lunch'))
    reminders.push({ id: 'lunch', text: t('dashboard.reminder_lunch'), color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' })
  if (hour >= 18 && hour < 20 && !dismissed.includes('dinner'))
    reminders.push({ id: 'dinner', text: t('dashboard.reminder_dinner'), color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' })

  if (!reminders.length) return null

  const dismiss = (id) => {
    const next = [...dismissed, id]
    setDismissed(next)
    sessionStorage.setItem('dismissed_reminders', JSON.stringify(next))
  }

  return (
    <div className="space-y-2 animate-slide-down">
      {reminders.map(r => (
        <div key={r.id} className={`${r.color} border rounded-2xl p-4 flex items-center justify-between`}>
          <p className="text-sm font-semibold">{r.text}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('/nutrition')} className="text-xs font-bold bg-white/80 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">{t('dashboard.log_now')} →</button>
            <button onClick={() => dismiss(r.id)} className="text-current opacity-50 hover:opacity-100"><span className="text-lg">×</span></button>
          </div>
        </div>
      ))}
    </div>
  )
}
