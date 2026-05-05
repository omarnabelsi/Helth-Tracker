import { useState, useEffect } from 'react'
import { Check, ExternalLink, AlertTriangle, Flame, Clock, Dumbbell, ChevronRight, Trophy, Zap, Target } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { updateStreak } from '../utils/streaks'
import { useTranslation } from 'react-i18next'

const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Workout() {
  const { t } = useTranslation();
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [completedDates, setCompletedDates] = useState(new Set())
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [exerciseChecks, setExerciseChecks] = useState({})

  const todayIdx = new Date().getDay()
  const todayFull = fullDayNames[todayIdx]

  // Load plan & logs from Supabase
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (prof) setProfile(prof)

        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        if (plans?.length) setPlan(plans[0].plan_data)

        // Fetch workout logs
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('date')
          .eq('user_id', user.id)
        
        if (logs) {
          setCompletedDates(new Set(logs.map(l => l.date)))
        }
      } catch (err) {
        console.error('Error loading workout data:', err)
      } finally {
        setLoadingLogs(false)
      }
    })()
  }, [user])

  // Extract workout plan
  const weeklyWorkout = plan?.weeklyWorkoutPlan || []
  const todayWorkout = weeklyWorkout.find(w => w.day === todayFull)
  const exercises = todayWorkout?.exercises || []
  const healthWarnings = plan?.healthWarnings || []
  const hasCondition = !!profile?.medical_conditions
  const isMockUser = user?.email === 'omarnabelsi12@gmail.com'

  // Build week plan strip
  const weekPlan = fullDayNames.map((dayName, i) => {
    const workout = weeklyWorkout.find(w => w.day === dayName)
    
    // Get date for this day of the current week
    const now = new Date()
    const currentDay = now.getDay() // 0-6
    const diff = i - currentDay
    const dayDate = new Date(now)
    dayDate.setDate(now.getDate() + diff)
    const dateStr = dayDate.toISOString().split('T')[0]
    
    return {
      day: shortDays[i],
      type: workout?.workoutType || 'Rest',
      done: completedDates.has(dateStr),
      isToday: i === currentDay,
      date: dateStr
    }
  })

  const completedCount = Object.values(exerciseChecks).filter(Boolean).length
  const totalExercises = exercises.length
  const weekDone = weekPlan.filter(d => d.done && d.type !== 'Rest').length
  const weekTotal = weekPlan.filter(d => d.type !== 'Rest').length

  const toggleExercise = (idx) => {
    setExerciseChecks(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const markWorkoutComplete = async () => {
    if (!user || !todayWorkout) return
    const todayStr = new Date().toISOString().split('T')[0]
    
    try {
      const { error } = await supabase
        .from('workout_logs')
        .upsert({ 
          user_id: user.id, 
          date: todayStr, 
          workout_name: todayWorkout.workoutType || 'Workout' 
        }, { onConflict: 'user_id,date' })
      
      if (error) throw error
      
      // Refresh logs
      setCompletedDates(prev => new Set([...prev, todayStr]))
      
      // Trigger a success notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'workout',
        title: '💪 Workout logged for today!',
        message: `Excellent work on your ${todayWorkout.workoutType || 'session'}!`
      })

      // Update streak
      await updateStreak(user.id)
      
    } catch (err) {
      console.error('Error marking workout complete:', err)
    }
  }

  const displayExercises = exercises
  const workoutTitle = todayWorkout?.workoutType || (isMockUser ? 'Push Day A — Upper Body' : 'Rest Day')

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="font-heading text-2xl font-bold text-text-primary">My Workout Plan</h1>
        <p className="text-text-muted text-sm mt-1">
          {plan ? 'AI-generated training split adapted for you' : "This week's training split"}
        </p>
      </div>

      {/* Medical Warning */}
      {hasCondition && (
        <div className="space-y-2 mb-6 animate-fade-in">
          {healthWarnings.length > 0 ? (
            healthWarnings.map((warning, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">⚠️ Plan Adapted</p>
                  <p className="text-xs text-amber-600 mt-0.5">{warning}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">⚠️ Plan adapted for your conditions</p>
                <p className="text-xs text-amber-600 mt-0.5">Exercises modified based on: {profile?.medical_conditions}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Strip */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 animate-fade-in-up">
        {weekPlan.map((d, i) => (
          <div
            key={i}
            className={`flex-1 min-w-[80px] flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
              d.isToday
                ? 'bg-primary-pale border-primary-accent shadow-md shadow-primary-accent/10'
                : d.done
                ? 'bg-green-50 border-green-200'
                : 'bg-bg-card border-gray-100'
            }`}
          >
            <span className={`text-xs font-bold ${d.isToday ? 'text-primary-accent' : 'text-text-muted'}`}>{d.day}</span>
            <span className={`text-[10px] mt-1 font-medium ${
              d.type === 'Rest' ? 'text-text-light' :
              d.isToday ? 'text-primary-accent' : 'text-text-primary'
            }`}>{d.type.length > 12 ? d.type.substring(0, 12) + '...' : d.type}</span>
            {d.done && d.type !== 'Rest' && <Check size={12} className="text-green-500 mt-1" />}
            {d.isToday && <span className="text-[8px] text-primary-accent font-bold mt-1">TODAY</span>}
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-5">
          {/* Today's Workout Card */}
          <div className="bg-gradient-to-r from-primary-dark to-[#1a4a36] rounded-3xl p-6 text-white animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-white/15 backdrop-blur px-3 py-1 rounded-full">{t('workout.today_workout')}</span>
                  {hasCondition && (
                    <span className="text-xs font-bold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full">Adapted</span>
                  )}
                </div>
                <h2 className="font-heading text-2xl font-bold mt-2">{workoutTitle}</h2>
              </div>
              <ProgressRing
                value={completedCount}
                max={displayExercises.length}
                size={70}
                strokeWidth={7}
                color="#4CAF7D"
                bgColor="rgba(255,255,255,0.1)"
              />
            </div>
            <div className="flex items-center gap-5 text-white/60 text-sm">
              <span className="flex items-center gap-1.5"><Zap size={14} />{displayExercises.length} exercises</span>
              <span className="flex items-center gap-1.5"><Clock size={14} />~45 min</span>
              <span className="flex items-center gap-1.5"><Dumbbell size={14} />Equipment needed</span>
            </div>
          </div>

          {/* Exercise List */}
          {displayExercises.length > 0 ? (
            <>
              <div className="space-y-3 animate-fade-in-up delay-200">
                {displayExercises.map((ex, i) => {
                  const isDone = exerciseChecks[i]
                  return (
                    <div
                      key={i}
                      className={`bg-bg-card rounded-2xl p-4 border border-gray-100 flex items-center gap-4 transition-all duration-300 hover:shadow-md group ${
                        isDone ? 'opacity-70' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleExercise(i)}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone
                            ? 'bg-primary-accent border-primary-accent'
                            : 'border-gray-300 hover:border-primary-accent group-hover:border-primary-accent/50'
                        }`}
                      >
                        {isDone && <Check size={14} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                            {ex.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-text-muted">{ex.sets} × {ex.reps} reps</span>
                          {ex.notes && (
                            <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{ex.notes}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-lg mr-2">💪</span>
                    </div>
                  )
                })}
              </div>

              {/* Complete Button */}
              <button
                onClick={markWorkoutComplete}
                className={`w-full font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 animate-fade-in-up delay-300 ${
                  weekPlan[todayIdx]?.done
                    ? 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                    : 'bg-primary-accent hover:bg-primary-accent/90 text-white hover:shadow-lg hover:shadow-primary-accent/25'
                }`}
              >
                <Check size={20} />
                {weekPlan[todayIdx]?.done
                  ? '✅ Workout Complete!'
                  : `Mark Workout Complete (${completedCount}/${displayExercises.length})`
                }
              </button>
            </>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-gray-100 p-8 text-center animate-fade-in-up delay-200">
              <p className="text-lg font-semibold text-text-primary mb-1">{t('workout.rest_day')}</p>
              <p className="text-sm text-text-muted">No workout scheduled for today. Recover and come back stronger!</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-5 hidden lg:block">
          {/* Weekly Completion */}
          <div className="bg-bg-card rounded-2xl p-5 border border-gray-100 shadow-sm text-center animate-slide-right">
            <h3 className="font-heading font-bold text-text-primary text-sm mb-4">Weekly Progress</h3>
            <ProgressRing
              value={weekDone}
              max={weekTotal || 1}
              size={100}
              strokeWidth={10}
              color="#4CAF7D"
              bgColor="#E8F5EE"
              label="completed"
            />
            <p className="text-xs text-text-muted mt-3">{weekDone} of {weekTotal} workouts done</p>
          </div>

          {/* Streak */}
          <div className="bg-bg-card rounded-2xl p-5 border border-gray-100 shadow-sm animate-slide-right delay-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Flame size={18} className="text-orange-500" />
              </div>
              <div>
              <p className="text-2xl font-bold text-text-primary font-heading">{isMockUser ? 18 : 0}</p>
                <p className="text-xs text-text-muted">{isMockUser ? 'Day Streak 🔥' : 'Day Streak'}</p>
              </div>
            </div>
            <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full w-[72%]"></div>
            </div>
            <p className="text-[10px] text-text-light mt-1.5">7 more days to next badge</p>
          </div>

          {/* Next Workout */}
          <div className="bg-bg-card rounded-2xl p-5 border border-gray-100 shadow-sm animate-slide-right delay-300">
            <h3 className="font-heading font-bold text-text-primary text-sm mb-3">Next Workout</h3>
            <div className="bg-bg-main rounded-xl p-3">
              {(() => {
                const nextIdx = weeklyWorkout.findIndex(w => fullDayNames.indexOf(w.day) > todayIdx)
                const nextWorkout = nextIdx >= 0 ? weeklyWorkout[nextIdx] : null
                return nextWorkout ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={14} className="text-primary-accent" />
                      <span className="text-sm font-semibold text-text-primary">{nextWorkout.workoutType}</span>
                    </div>
                    <p className="text-xs text-text-muted">{nextWorkout.day}</p>
                    <p className="text-xs text-text-muted">{nextWorkout.exercises?.length || 0} exercises</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={14} className="text-primary-accent" />
                      <span className="text-sm font-semibold text-text-primary">Recovery</span>
                    </div>
                    <p className="text-xs text-text-muted">Rest and recover</p>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
