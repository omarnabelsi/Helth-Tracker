import { useState, useEffect } from 'react'
import { Check, AlertTriangle, Clock, Dumbbell, Zap, Trophy, Flame, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { updateStreak } from '../utils/streaks'
import { useTranslation } from 'react-i18next'
import { PPL_SCHEDULE, getPPLDay, PPL_EXERCISES, CONDITION_FILTERS } from '../data/pplSplit'
import { toast } from 'react-hot-toast'
import { X, RefreshCw, Info } from 'lucide-react'

const weekDays = [
  { id: 0, short: 'Mon', shortAr: 'اثن' },
  { id: 1, short: 'Tue', shortAr: 'ثلا' },
  { id: 2, short: 'Wed', shortAr: 'أرب' },
  { id: 3, short: 'Thu', shortAr: 'خمي' },
  { id: 4, short: 'Fri', shortAr: 'جمع' },
  { id: 5, short: 'Sat', shortAr: 'سبت' },
  { id: 6, short: 'Sun', shortAr: 'أحد' }
]

export default function Workout() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [completedDates, setCompletedDates] = useState(new Set())
  const [selectedDay, setSelectedDay] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])
  const [workoutDone, setWorkoutDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [swapModal, setSwapModal] = useState(null) // { index, currentEx }

  // Calculate PPL day for today
  const todayPPLNum = getPPLDay()
  const [selectedPPLDay, setSelectedPPLDay] = useState(null)
  
  // Logic to show a 7-day strip centered around today
  const stripDays = weekDays.map((wd, i) => {
    const d = new Date()
    const day = d.getDay() // 0-6
    const diff = (i + 1) - (day === 0 ? 7 : day) // Offset relative to Mon-Sun
    const date = new Date()
    date.setDate(d.getDate() + diff)
    const pplNum = getPPLDay(date)
    return { ...wd, date, pplNum, isToday: diff === 0 }
  })

  const currentPPLDay = selectedPPLDay || todayPPLNum
  const dayInfo = PPL_SCHEDULE[currentPPLDay]

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
        if (prof) setProfile(prof)

        const { data: plans } = await supabase.from('plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
        if (plans?.length) setPlan(plans[0].plan_data)

        const { data: logs } = await supabase.from('workout_logs').select('date').eq('user_id', user.id)
        if (logs) setCompletedDates(new Set(logs.map(l => l.date)))
        
        // Check if today is already logged
        const todayStr = new Date().toISOString().split('T')[0]
        if (logs?.some(l => l.date === todayStr)) setWorkoutDone(true)

      } catch (err) {
        console.error('Error loading workout data:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const todayWorkout = plan?.weeklyWorkoutPlan?.find(d => {
    return d.day === ((currentPPLDay - 1) % 7 + 1)
  })

  // Fallback to PPL DB if the plan doesn't have exercises for this day
  const gymType = profile?.gym_type || 'big_gym'
  const fallbackExercises = PPL_EXERCISES[dayInfo.type]?.[gymType] || []
  
  const exercises = (todayWorkout?.exercises && todayWorkout.exercises.length > 0)
    ? todayWorkout.exercises
    : fallbackExercises
  const hasCondition = profile?.medical_conditions && profile.medical_conditions !== 'None'

  const markWorkoutComplete = async () => {
    if (!user || workoutDone) return
    const todayStr = new Date().toISOString().split('T')[0]

    try {
      const { error } = await supabase.from('workout_logs').insert({
        user_id: user.id,
        date: todayStr,
        workout_name: dayInfo.name,
        workout_type: dayInfo.type,
        exercises_completed: completedExercises.length,
        total_exercises: exercises.length,
        completed_at: new Date().toISOString()
      })

      if (error) throw error

      setWorkoutDone(true)
      setCompletedDates(prev => new Set([...prev, todayStr]))
      await updateStreak(user.id)
      toast.success(isAr ? '🎉 تم تسجيل التمرين!' : '🎉 Workout logged!')

      // Notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'workout',
        title: isAr ? '💪 تم تسجيل تمرين اليوم!' : '💪 Workout logged for today!',
        message: isAr ? `عمل رائع في ${dayInfo.nameAr}!` : `Excellent work on your ${dayInfo.name}!`
      })

    } catch (err) {
      console.error('Error logging workout:', err)
      toast.error(isAr ? 'خطأ في حفظ التمرين' : 'Error saving workout')
    }
  }

  const toggleExercise = (idx) => {
    setCompletedExercises(prev =>
      prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
    )
  }

  const handleSwap = (newEx) => {
    if (!swapModal) return
    const { index } = swapModal
    const nextPlan = { ...plan }
    const dayPlan = nextPlan.weeklyWorkoutPlan.find(d => d.day === currentDay)
    if (dayPlan) {
      dayPlan.exercises[index] = {
        ...newEx,
        muscleGroup: newEx.muscle || dayPlan.exercises[index].muscleGroup
      }
      setPlan(nextPlan)
      // Persist to Supabase
      supabase.from('plans').update({ plan_data: nextPlan }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).then(() => {
        toast.success(isAr ? 'تم تغيير التمرين!' : 'Exercise swapped!')
      })
    }
    setSwapModal(null)
  }

  if (loading) return <div className="p-10 text-center text-text-muted">{t('common.loading')}</div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-heading text-3xl font-extrabold text-text-primary">{t('workout.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('workout.subtitle')}</p>
      </div>

      {/* PPL Legend */}
      <div className="flex flex-wrap gap-3 animate-fade-in">
        {[
          { type: 'push', label: isAr ? 'دفع' : 'Push', color: '#E53935', muscles: isAr ? 'صدر · كتف · ترايسبس' : 'Chest · Shoulders · Triceps' },
          { type: 'pull', label: isAr ? 'سحب' : 'Pull', color: '#1E88E5', muscles: isAr ? 'ظهر · بيسبس · دالتيود خلفي' : 'Back · Biceps · Rear Delts' },
          { type: 'legs', label: isAr ? 'أرجل' : 'Legs', color: '#43A047', muscles: isAr ? 'أفخاذ · مؤخرة · عجول' : 'Quads · Glutes · Calves' },
          { type: 'rest', label: isAr ? 'راحة' : 'Rest', color: '#757575', muscles: isAr ? 'تعافي' : 'Recovery' }
        ].map(l => (
          <div key={l.type} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">{l.label}</span>
            <span className="text-[10px] text-text-muted">{l.muscles}</span>
          </div>
        ))}
      </div>

      {/* Weekly Strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 animate-fade-in-up no-scrollbar">
        {stripDays.map((d, i) => {
          const dInfo = PPL_SCHEDULE[d.pplNum]
          const isSelected = d.pplNum === currentPPLDay
          const colors = { push: '#E53935', pull: '#1E88E5', legs: '#43A047', rest: '#757575' }
          const dateStr = d.date.toISOString().split('T')[0]
          const isDone = completedDates.has(dateStr)

          return (
            <button
              key={i}
              onClick={() => setSelectedPPLDay(d.pplNum)}
              className={`flex-1 min-w-[85px] flex flex-col items-center p-3.5 rounded-2xl border-2 transition-all group ${
                isSelected
                  ? 'bg-bg-card border-2 shadow-lg'
                  : 'bg-bg-main border-transparent hover:border-white/10'
              }`}
              style={{ borderColor: isSelected ? colors[dInfo.type] : 'transparent' }}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'text-text-muted'}`}>
                {isAr ? d.shortAr : d.short}
              </span>
              <span className="text-2xl my-2 group-hover:scale-110 transition-transform">{dInfo.emoji}</span>
              <span className="text-[9px] font-black uppercase" style={{ color: colors[dInfo.type] }}>
                {isAr ? (dInfo.nameAr.includes('راحة') ? 'راحة' : dInfo.nameAr.split(' ')[1] || dInfo.nameAr) : dInfo.type}
              </span>
              {d.isToday && (
                <div className="mt-2 px-2 py-0.5 rounded-md text-[8px] font-bold text-white uppercase tracking-tighter" style={{ background: colors[dInfo.type] }}>
                  {t('common.today')}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Today's Plan Header */}
      <div
        className="relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl animate-fade-in-up"
        style={{
          background: `linear-gradient(135deg, ${
            dayInfo.type === 'push' ? '#B71C1C, #E53935' :
            dayInfo.type === 'pull' ? '#0D47A1, #1E88E5' :
            dayInfo.type === 'legs' ? '#1B5E20, #43A047' :
            '#212121, #424242'
          })`
        }}
      >
        <div className="relative z-10">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">
            {isAr ? 'تمرين اليوم' : "Today's Target"}
          </div>
          <h2 className="font-heading text-4xl font-black mb-1">
            {dayInfo.emoji} {isAr ? dayInfo.nameAr : dayInfo.name}
          </h2>
          <p className="text-white/70 font-medium mb-6">{dayInfo.desc}</p>

          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm font-bold">{exercises.length} {isAr ? 'تمارين' : 'Exercises'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
              <Clock size={16} className="text-white/80" />
              <span className="text-sm font-bold">~{todayWorkout?.duration || 60} {t('dashboard.min')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
              <Dumbbell size={16} className="text-white/80" />
              <span className="text-sm font-bold capitalize">
                {profile?.gym_type?.replace('_', ' ') || 'Gym'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="absolute top-1/2 -right-10 -translate-y-1/2 opacity-20 scale-[2.5] hidden md:block">
           <Trophy size={100} />
        </div>
        <div className="absolute top-8 right-8">
           <ProgressRing
             value={completedExercises.length}
             max={exercises.length || 1}
             size={80}
             strokeWidth={8}
             color="#ffffff"
             bgColor="rgba(255,255,255,0.2)"
           />
        </div>
      </div>

      {/* Health Alert */}
      {hasCondition && (
        <div className="bg-amber-50/10 dark:bg-amber-900/20 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-4 animate-fade-in hover:border-amber-500/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              {t('workout.condition_warning')}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-1 leading-relaxed">{profile.medical_conditions}</p>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-3 animate-fade-in-up">
        {exercises.length > 0 ? (
          exercises.map((ex, i) => {
            const isDone = completedExercises.includes(i)
            return (
              <div
                key={i}
                onClick={() => toggleExercise(i)}
                className={`group flex items-center gap-5 p-5 rounded-[24px] border-2 transition-all cursor-pointer ${
                  isDone
                    ? 'bg-primary-accent/5 border-primary-accent/20'
                    : 'bg-bg-card border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isDone ? 'bg-primary-accent border-primary-accent' : 'border-white/10 group-hover:border-white/20'
                }`}>
                  {isDone && <Check size={20} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg leading-tight truncate ${isDone ? 'text-text-muted line-through' : 'text-white'}`}>
                    {isAr ? ex.nameAr : ex.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-primary-accent">{ex.sets} × {ex.reps}</span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-xs text-text-muted uppercase tracking-widest font-bold">{ex.muscleGroup}</span>
                  </div>
                  {ex.notes && <p className="text-[11px] text-primary-accent/70 mt-1.5 font-medium italic">“{ex.notes}”</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSwapModal({ index: i, currentEx: ex }) }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-primary-accent transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <div className="text-2xl grayscale group-hover:grayscale-0 transition-all text-center">💪</div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-bg-card rounded-3xl p-12 text-center border border-white/5">
            <div className="text-5xl mb-4">😴</div>
            <h3 className="text-xl font-bold text-white">{t('workout.rest_day')}</h3>
            <p className="text-text-muted text-sm mt-1">{t('workout.active_recovery')}</p>
          </div>
        )}
      </div>

      {/* Completion Button */}
      {dayInfo.type !== 'rest' && exercises.length > 0 && (
        <button
          onClick={markWorkoutComplete}
          disabled={completedExercises.length === 0 || workoutDone}
          className={`w-full py-6 rounded-[24px] font-black text-lg transition-all shadow-xl ${
            workoutDone
              ? 'bg-white/5 text-primary-accent border-2 border-primary-accent/20 cursor-default'
              : 'bg-primary-accent text-white hover:scale-[1.01] active:scale-[0.99] shadow-primary-accent/20'
          } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
        >
          {workoutDone
            ? (isAr ? '✅ تم تسجيل التمرين!' : '✅ Workout Logged!')
            : (isAr ? `تسجيل اكتمال التمرين (${completedExercises.length}/${exercises.length})` : `Complete Workout (${completedExercises.length}/${exercises.length})`)
          }
        </button>
      )}

      {/* Swap Modal */}
      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-card border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{isAr ? 'تغيير التمرين' : 'Swap Exercise'}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {isAr ? `تمارين يوم ${dayInfo.nameAr} فقط` : `Only ${dayInfo.name} exercises`}
                </p>
              </div>
              <button onClick={() => setSwapModal(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 no-scrollbar">
              {PPL_EXERCISES[dayInfo.type]?.[profile?.gym_type || 'big_gym']?.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleSwap(ex)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-bg-main border border-white/5 hover:border-primary-accent/30 hover:bg-primary-accent/5 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-accent/10 flex items-center justify-center text-primary-accent">
                    <Dumbbell size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{isAr ? ex.nameAr : ex.name}</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-0.5">
                      {ex.muscle} · {ex.sets}×{ex.reps}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-muted" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
