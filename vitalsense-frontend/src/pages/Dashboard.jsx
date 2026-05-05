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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const today = new Date()

export default function Dashboard() {
  const { t } = useTranslation();
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
    
    // Load dismissed from session storage
    const saved = sessionStorage.getItem(`dismissed_advisories_${user.id}`)
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
        
        const { data: mLogs } = await supabase.from('daily_logs').select('log_date').eq('user_id', user.id)
        if (mLogs) setMealLogs(mLogs.map(l => l.log_date))

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
    sessionStorage.setItem(`dismissed_advisories_${user.id}`, JSON.stringify(next))
  }

  const isMockUser = user?.email === 'omarnabelsi12@gmail.com'

  // Extract today's data from plan
  const todayDayName = fullDayNames[today.getDay()]
  const todayMeals = plan?.weeklyMealPlan?.[todayDayName] || []
  const todayWorkout = plan?.weeklyWorkoutPlan?.find(w => w.day === todayDayName)
  const healthWarnings = (plan?.healthWarnings || []).filter(w => !dismissedAdvisories.includes(w))
  const coachTip = plan?.coachTip || (isMockUser ? "Great progress! Keep following your personalized plan and stay consistent with your meals and workouts." : null)

  // Calculate today's nutrition from AI plan
  const totalCal = todayMeals.reduce((s, m) => s + (m?.calories || 0), 0)
  const totalP = todayMeals.reduce((s, m) => s + (m?.protein || 0), 0)
  const totalC = todayMeals.reduce((s, m) => s + (m?.carbs || 0), 0)
  const totalF = todayMeals.reduce((s, m) => s + (m?.fat || 0), 0)
  const calorieTarget = profile?.calorie_target || 2000

  const userName = profile?.name || user?.user_metadata?.full_name || 'User'

  // Determine greeting based on time
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

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
            {loading ? 'Loading your personalized plan...' : "Your AI-powered health plan is ready. Let's make today count!"}
          </p>
        </div>

        {/* ── Smart Meal Reminders ── */}
        <MealReminders dismissed={dismissedReminders} setDismissed={setDismissedReminders} navigate={navigate} />

        {/* ── Health Warnings (from AI plan) ── */}
        {healthWarnings.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            {healthWarnings.map((warning, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 relative group">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 pr-8">
                  <p className="text-sm font-semibold text-amber-800">⚠️ Health Advisory</p>
                  <p className="text-xs text-amber-600 mt-0.5">{warning}</p>
                </div>
                <button 
                  onClick={() => dismissAdvisory(warning)}
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-200/50 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
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
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-8">
              <ProgressRing
                value={72}
                max={100}
                size={140}
                strokeWidth={12}
                color="#4CAF7D"
                bgColor="rgba(255,255,255,0.1)"
                className="flex-shrink-0"
              />
              <div>
                <h2 className="font-heading text-xl font-bold mb-1">Daily Goal Progress</h2>
                <p className="text-white/60 text-sm mb-4 max-w-sm">
                  {plan ? `Your AI plan targets ${calorieTarget} kcal today with ${todayMeals.length} Lebanese meals.` : "You've completed 72% of your daily goals. Stay consistent!"}
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-sm font-semibold">🔥 {streak?.current_streak || 0} day streak</span>
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
                  {todayMeals.slice(0, 3).map((meal, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-text-primary font-medium truncate mr-2">{meal.name}</span>
                      <span className="text-text-muted flex-shrink-0">{meal.calories} kcal</span>
                    </div>
                  ))}
                  {todayMeals.length > 3 && (
                    <p className="text-[10px] text-text-light">+{todayMeals.length - 3} more meals</p>
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold text-text-primary font-heading">{totalCal}</span>
                    <span className="text-sm text-text-muted mb-1">/ {calorieTarget} kcal</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <MacroBar label="Protein" current={totalP} target={Math.round(calorieTarget * 0.3 / 4)} color="#3B82F6" />
                  <MacroBar label="Carbs" current={totalC} target={Math.round(calorieTarget * 0.4 / 4)} color="#F59E0B" />
                  <MacroBar label="Fat" current={totalF} target={Math.round(calorieTarget * 0.3 / 9)} color="#EF4444" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <p className="text-sm text-text-muted mb-4">No meal plan found. Generate your AI plan to get started.</p>
                <button onClick={() => navigate('/settings')} className="bg-[#2E7D52] text-white text-sm font-semibold px-4 py-2 rounded-xl">Generate My Plan</button>
              </div>
            )}
          </div>

          {/* Workout Card — from AI plan */}
          <div
            className="bg-bg-card rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/workout')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Dumbbell size={16} className="text-blue-600" />
                </div>
                <h3 className="font-heading font-bold text-text-primary">Workout</h3>
              </div>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                {todayWorkout?.workoutType || 'Upper Body'}
              </span>
            </div>
            {todayWorkout ? (
              <>
                <div className="flex items-center gap-5 mb-4">
                  <ProgressRing value={0} max={todayWorkout.exercises?.length || 6} size={80} strokeWidth={8} color="#3B82F6" bgColor="#EFF6FF" />
                  <div>
                    <h4 className="font-semibold text-text-primary">{todayWorkout.workoutType}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><Zap size={12} />{todayWorkout.exercises?.length || 0} exercises</span>
                      <span className="flex items-center gap-1"><Clock size={12} />~45 min</span>
                    </div>
                  </div>
                </div>
                {/* Show first 3 exercises */}
                <div className="space-y-1.5 mb-3">
                  {todayWorkout.exercises?.slice(0, 3).map((ex, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-text-primary font-medium">{ex.name}</span>
                      <span className="text-text-muted">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                  {(todayWorkout.exercises?.length || 0) > 3 && (
                    <p className="text-[10px] text-text-light">+{todayWorkout.exercises.length - 3} more exercises</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4 mb-4">
                <p className="text-sm text-text-muted">No workout plan found.</p>
              </div>
            )}
            <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">
              {todayWorkout ? 'Start Workout →' : 'View Plan →'}
            </button>
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
              {isMockUser ? ['Apr 10', 'Apr 17', 'Apr 24'].map((date, i) => (
                <div key={i} className="relative group">
                  <div className="aspect-[3/4] bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                    <div className="w-8 h-12 bg-gray-300 rounded-lg"></div>
                  </div>
                  <p className="text-[10px] text-text-muted text-center mt-1 font-medium">{date}</p>
                </div>
              )) : (
                <div className="col-span-3 text-center py-4">
                  <p className="text-xs text-text-muted">No progress snapshots yet.</p>
                </div>
              )}
            </div>
            <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm font-semibold py-2.5 rounded-xl transition-colors">
              View Timeline →
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
                {coachTip || (isMockUser ? "Great progress! Keep following your personalized plan and stay consistent with your meals and workouts." : "Generate a plan to get personalized AI coaching tips.")}
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
                <h3 className="font-heading font-bold text-text-primary text-sm">Recent Badges</h3>
              </div>
              <button onClick={() => navigate('/achievements')} className="text-xs font-bold text-primary-accent hover:text-primary-light">View All →</button>
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
                  <h3 className="font-heading font-bold text-text-primary text-sm">📊 Your Weekly Report — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <p className="text-xs text-text-muted">AI-generated insights from your past week</p>
                </div>
              </div>
              {reportExpanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
            </button>
            {reportExpanded && (
              <div className="px-5 pb-5">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{weeklyReport.report_text}</p>
                <button onClick={async () => { const r = await authFetch(`${API_BASE}/api/weekly-report/`, { method: 'POST', body: JSON.stringify({ user_id: user.id }) }); if (r.ok) { const d = await r.json(); setWeeklyReport(d) } }} className="mt-3 flex items-center gap-2 text-xs font-bold text-primary-accent hover:text-primary-light"><RefreshCw size={12} /> Regenerate</button>
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
              <button onClick={() => navigate('/settings')} className="bg-primary-accent text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-accent/90">Recalibrate Now</button>
              <button onClick={() => setShowRecalibrate(false)} className="text-xs font-bold text-text-muted hover:text-text-primary">Later</button>
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
            isMockUser={isMockUser}
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
              {isMockUser ? <><TrendingDown size={10} /> -0.5 kg</> : <><TrendingDown size={10} /> --</>}
            </span>
          </div>
          <div className="mb-2">
            <span className="text-2xl font-bold text-text-primary font-heading">{isMockUser ? '74.5' : (profile?.weight || '--')}</span>
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
          <p className="text-[10px] text-text-muted mt-1">{isMockUser ? 'vs last week: -0.5 kg' : 'Log weight to track progress'}</p>
        </div>

        {/* Sleep Widget */}
        <div className="bg-bg-main rounded-2xl p-4 animate-slide-right delay-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-text-primary">{t('dashboard.sleep')}</h3>
            </div>
            <span className="text-xs text-text-muted">Last night</span>
          </div>
          <div className="mb-3">
            <span className="text-2xl font-bold text-text-primary font-heading">{isMockUser ? '7.5' : '--'}</span>
            <span className="text-sm text-text-muted ml-1">hours</span>
          </div>
          {/* Sleep bar chart */}
          <div className="flex items-end gap-1.5 h-12">
            {(isMockUser ? [65, 80, 70, 90, 75, 85, 78] : [0, 0, 0, 0, 0, 0, 0]).map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    i === 6 ? 'bg-indigo-500' : 'bg-indigo-200'
                  }`}
                  style={{ height: `${h * 0.5}px` }}
                />
                <span className="text-[8px] text-text-light">{weekDays[i][0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
// ── Custom Calendar Component (Fix 5) ──
function Calendar({ workoutLogs, mealLogs, isMockUser }) {
  const [viewDate, setViewDate] = useState(new Date())
  const today = new Date()
  
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  
  const monthName = viewDate.toLocaleString('default', { month: 'long' })
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
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`day-${i}-${d}`} className="text-[10px] text-text-muted font-bold py-1">{d}</span>
        ))}
        
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="w-8 h-8" />
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          
          const hasWorkout = workoutLogs.includes(dateStr) || (isMockUser && day % 2 === 0 && day < today.getDate())
          const hasMeal = mealLogs.includes(dateStr) || (isMockUser && day < today.getDate())
          
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
  const hour = new Date().getHours()
  const reminders = []
  if (hour >= 8 && hour < 10 && !dismissed.includes('breakfast'))
    reminders.push({ id: 'breakfast', text: '🌅 Good morning! Don\'t forget to log your breakfast.', color: 'bg-amber-50 border-amber-200 text-amber-800' })
  if (hour >= 12 && hour < 14 && !dismissed.includes('lunch'))
    reminders.push({ id: 'lunch', text: '☀️ It\'s lunchtime! Have you logged your midday meal?', color: 'bg-blue-50 border-blue-200 text-blue-800' })
  if (hour >= 18 && hour < 20 && !dismissed.includes('dinner'))
    reminders.push({ id: 'dinner', text: '🌙 Evening check-in — log your dinner to stay on track.', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' })

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
            <button onClick={() => navigate('/nutrition')} className="text-xs font-bold bg-white/80 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">Log Now →</button>
            <button onClick={() => dismiss(r.id)} className="text-current opacity-50 hover:opacity-100"><span className="text-lg">×</span></button>
          </div>
        </div>
      ))}
    </div>
  )
}
