import { useState, useEffect, useMemo } from 'react'
import { Check, Camera, ChevronDown, ChevronUp, Flame, ArrowLeftRight, X, Search, Upload, FileText, Sparkles } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import MacroBar from '../components/MacroBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import lebaneseFoods from '../data/lebaneseFoods'
import { updateStreak, unlockFirstMealLog } from '../utils/streaks'
import { authFetch } from '../utils/authFetch'
import jsPDF from 'jspdf'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const mealEmojis = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snack: '🍎' }

// ── Generate a default daily plan from the food DB based on calorie target ──
function generateDefaultPlan(calorieTarget) {
  const target = calorieTarget || 2000
  const mains = lebaneseFoods.filter(f => f.category === 'main')
  const perMeal = Math.round(target / 4)

  // Pick foods that roughly fit per meal slot
  const pickFood = (seed) => {
    const idx = Math.abs(seed) % mains.length
    return mains[idx]
  }

  const plan = {}
  days.forEach((day, di) => {
    plan[day] = {
      Breakfast: [pickFood(di * 4)],
      Lunch: [pickFood(di * 4 + 1)],
      Dinner: [pickFood(di * 4 + 2)],
      Snack: [pickFood(di * 4 + 3)],
    }
  })
  return plan
}

// ── Filter pills ──
const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'vegetarian', label: '🥬 Vegetarian' },
  { key: 'high-protein', label: '💪 High-Protein' },
  { key: 'low-fat', label: '🫒 Low-Fat' },
  { key: 'dessert', label: '🍰 Desserts' },
]

export default function Nutrition() {
  const { t } = useTranslation();
  const { user } = useAuth()
  const [activeDay, setActiveDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
  const [expandedMeals, setExpandedMeals] = useState({ Breakfast: true, Lunch: true, Dinner: true, Snack: true })
  const [calorieTarget, setCalorieTarget] = useState(2000)
  const [profile, setProfile] = useState(null)
  const [aiPlan, setAiPlan] = useState(null)

  // Daily meal selections (state)
  const [meals, setMeals] = useState(() => generateDefaultPlan(2000))

  // Swap/Add modal state
  const [swapModal, setSwapModal] = useState({ open: false, day: null, mealSlot: null, mode: 'swap', index: null })
  const [swapSearch, setSwapSearch] = useState('')
  const [swapFilter, setSwapFilter] = useState('all')

  // Photo recognition state
  const [photoModal, setPhotoModal] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false)
  const [photoResults, setPhotoResults] = useState(null)
  const [portionScale, setPortionScale] = useState(1)
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false)

  // ── Load profile & AI plan from Supabase ──
  useEffect(() => {
    if (!user) return
    ;(async () => {
      // Get profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (prof) {
        setProfile(prof)
        setCalorieTarget(prof.calorie_target || 2000)
      }

      // Get AI-generated plan
      const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (plans && plans.length > 0) {
        const planData = plans[0].plan_data
        if (planData?.weeklyMealPlan) {
          setAiPlan(planData)
          // Convert AI plan format to our state format
          const converted = {}
          const dayMap = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' }
          Object.entries(planData.weeklyMealPlan).forEach(([dayName, dayMeals]) => {
            const shortDay = dayMap[dayName] || dayName
            if (Array.isArray(dayMeals)) {
              const slotNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
              converted[shortDay] = {}
              dayMeals.forEach((meal, i) => {
                const slotName = slotNames[i] || `Meal${i}`
                const matched = lebaneseFoods.find(f =>
                  f.name.toLowerCase() === meal.name?.toLowerCase()
                ) || {
                  id: `ai_${shortDay}_${i}`,
                  name: meal.name,
                  arabicName: meal.arabicName || '',
                  category: 'main',
                  calories: meal.calories || 0,
                  protein: meal.protein || 0,
                  carbs: meal.carbs || 0,
                  fat: meal.fat || 0,
                  serving: '1 serving',
                  tags: [],
                }
                converted[shortDay][slotName] = [matched]
              })
            }
          })
          // Fill any missing days
          days.forEach(d => {
            if (!converted[d]) converted[d] = generateDefaultPlan(prof?.calorie_target || 2000)[d]
          })
          setMeals(converted)
        }
      } else if (prof) {
        setMeals(generateDefaultPlan(prof.calorie_target || 2000))
      }
    })()
  }, [user])

  // ── Computed nutrition summary ──
  const todayMeals = meals[activeDay] || {}
  const todayItems = Object.values(todayMeals).flat().filter(Boolean)
  const totalCal = todayItems.reduce((s, f) => s + (f?.calories || 0), 0)
  const totalP = todayItems.reduce((s, f) => s + (f?.protein || 0), 0)
  const totalC = todayItems.reduce((s, f) => s + (f?.carbs || 0), 0)
  const totalF = todayItems.reduce((s, f) => s + (f?.fat || 0), 0)
  const remainingCal = Math.max(0, calorieTarget - totalCal)

  const pieData = [
    { name: 'Protein', value: totalP * 4, color: '#3B82F6' },
    { name: 'Carbs', value: totalC * 4, color: '#F59E0B' },
    { name: 'Fat', value: totalF * 9, color: '#EF4444' },
  ]

  // ── Update meals ──
  const updateMeals = (newMeals) => {
    setMeals(newMeals)
    if (user) {
      const today = new Date().toISOString().split('T')[0]
      supabase.from('daily_logs').upsert({
        user_id: user.id,
        log_date: today,
        meal_data: newMeals,
      }, { onConflict: 'user_id,log_date' }).then(() => {})
    }
  }

  const handleFoodSelect = (food) => {
    const nextMeals = { ...meals }
    const dayMeals = { ...nextMeals[swapModal.day] }
    
    if (swapModal.mode === 'add') {
      dayMeals[swapModal.mealSlot] = [...(dayMeals[swapModal.mealSlot] || []), food]
    } else {
      const slot = [...(dayMeals[swapModal.mealSlot] || [])]
      slot[swapModal.index] = food
      dayMeals[swapModal.mealSlot] = slot
    }
    
    nextMeals[swapModal.day] = dayMeals
    updateMeals(nextMeals)
    
    setSwapModal({ open: false, day: null, mealSlot: null, mode: 'swap', index: null })
    setSwapSearch('')
    setSwapFilter('all')

    // Calorie trigger check
    if (totalCal + food.calories > calorieTarget) {
      supabase.from('notifications').insert({
        user_id: user.id,
        type: 'alert',
        title: '⚠️ Calorie Limit Exceeded',
        message: `You've exceeded your daily limit by ${totalCal + food.calories - calorieTarget} kcal.`
      }).then(() => {})
    }

    // Update streak & first meal badge
    updateStreak(user.id)
    unlockFirstMealLog(user.id)
  }

  const removeFood = (day, mealSlot, index) => {
    const nextMeals = { ...meals }
    const dayMeals = { ...nextMeals[day] }
    const slot = [...dayMeals[mealSlot]]
    slot.splice(index, 1)
    dayMeals[mealSlot] = slot
    nextMeals[day] = dayMeals
    updateMeals(nextMeals)
  }

  const addExtraMeal = () => {
    const nextMeals = { ...meals }
    const dayMeals = { ...nextMeals[activeDay] }
    const nextIdx = Object.keys(dayMeals).filter(k => k.startsWith('Extra')).length + 1
    dayMeals[`Extra Meal ${nextIdx}`] = []
    nextMeals[activeDay] = dayMeals
    updateMeals(nextMeals)
  }

  const handleGenerateDiet = async () => {
    if (!user || !profile) return
    setIsGeneratingDiet(true)
    try {
      const res = await authFetch(`${API_BASE}/api/generate-plan/`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          age: profile.age,
          gender: profile.gender || 'male',
          weight: profile.weight,
          height: profile.height,
          tdee: profile.tdee || 2000,
          calorie_target: profile.calorie_target || 2000,
          goal: profile.goal || 'improve_health',
          medical_conditions: profile.medical_conditions,
          activity_level: profile.activity_level || 'moderate',
          gym_type: profile.gym_type || 'home',
          equipment_list: profile.equipment_list || []
        })
      })

      if (res.ok) {
        const data = await res.json()
        const planData = data.plan_data
        if (planData?.weeklyMealPlan) {
          setAiPlan(planData)
          // Convert & update meals state
          const converted = {}
          const dayMap = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' }
          Object.entries(planData.weeklyMealPlan).forEach(([dayName, dayMeals]) => {
            const shortDay = dayMap[dayName] || dayName
            if (Array.isArray(dayMeals)) {
              const slotNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
              converted[shortDay] = {}
              dayMeals.forEach((meal, i) => {
                const slotName = slotNames[i] || `Meal${i}`
                const matched = lebaneseFoods.find(f =>
                  f.name.toLowerCase() === meal.name?.toLowerCase()
                ) || {
                  id: `ai_${shortDay}_${i}`,
                  name: meal.name,
                  arabicName: meal.arabicName || '',
                  category: 'main',
                  calories: meal.calories || 0,
                  protein: meal.protein || 0,
                  carbs: meal.carbs || 0,
                  fat: meal.fat || 0,
                  serving: '1 serving',
                  tags: [],
                }
                converted[shortDay][slotName] = [matched]
              })
            }
          })
          setMeals(converted)
          alert('✅ Personalized diet plan generated successfully!')
        }
      } else {
        throw new Error('Failed to generate diet plan')
      }
    } catch (err) {
      console.error('Diet generation error:', err)
      alert('❌ Failed to generate diet. Please check your internet connection and try again.')
    } finally {
      setIsGeneratingDiet(false)
    }
  }

  // ── Filter foods for swap modal ──
  const filteredFoods = useMemo(() => {
    let pool = [...lebaneseFoods]
    if (swapFilter === 'dessert') {
      pool = pool.filter(f => f.category === 'dessert')
    } else if (swapFilter !== 'all') {
      pool = pool.filter(f => f.tags.includes(swapFilter))
    }
    if (swapSearch.trim()) {
      const q = swapSearch.toLowerCase()
      pool = pool.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.arabicName.includes(q)
      )
    }
    return pool
  }, [swapFilter, swapSearch])

  // Macro target estimates
  const proteinTarget = Math.round(calorieTarget * 0.30 / 4)
  const carbsTarget = Math.round(calorieTarget * 0.40 / 4)
  const fatTarget = Math.round(calorieTarget * 0.30 / 9)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto">
      {/* Calorie Banners */}
      <div className="space-y-2 animate-fade-in">
        {totalCal > calorieTarget && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-800">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <p className="text-sm font-semibold">
                You've exceeded your daily calorie limit by {totalCal - calorieTarget} kcal. Consider lighter options for your next meal.
              </p>
            </div>
            <button onClick={() => setMeals({...meals})} className="text-red-400 hover:text-red-600"><X size={18} /></button>
          </div>
        )}
        {totalCal === calorieTarget && totalCal > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-green-800">
            <span className="text-xl">✅</span>
            <p className="text-sm font-semibold">You've reached your daily calorie goal!</p>
          </div>
        )}
        {totalCal >= calorieTarget * 0.9 && totalCal < calorieTarget && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-semibold">You're approaching your daily calorie limit — {Math.round((totalCal / calorieTarget) * 100)}% reached</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-heading text-2xl font-bold text-text-primary">My Nutrition Plan</h1>
        <p className="text-text-muted text-sm mt-1">Your personalized Lebanese meal plan · {calorieTarget} kcal target</p>
      </div>

      {/* Daily Summary Bar */}
      <div className="bg-gradient-to-r from-primary-dark to-[#1a4a36] rounded-3xl p-6 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-accent/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs font-medium mb-1">{totalCal} / {calorieTarget} kcal consumed</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold font-heading">{remainingCal}</span>
                <span className="text-white/50 text-sm mb-1">kcal remaining in your plan</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-semibold">{totalCal} consumed</span>
            </div>
          </div>
          {/* Calorie Progress Bar */}
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-5">
            <div
              className={`h-full bg-gradient-to-r ${totalCal > calorieTarget ? 'from-red-500 to-red-400' : 'from-primary-light to-primary-lighter'} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, (totalCal / calorieTarget) * 100)}%` }}
            />
          </div>
          {/* Macro Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Protein', current: totalP, target: proteinTarget, color: 'bg-blue-400', unit: 'g' },
              { label: 'Carbs', current: totalC, target: carbsTarget, color: 'bg-amber-400', unit: 'g' },
              { label: 'Fat', current: totalF, target: fatTarget, color: 'bg-red-400', unit: 'g' },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>{m.label}</span>
                  <span>{m.current}{m.unit} / {m.target}{m.unit}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${m.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up">
        {[
          { label: 'Calories', value: totalCal, target: calorieTarget, unit: 'kcal', color: 'bg-primary-pale text-primary-accent' },
          { label: 'Protein', value: totalP, target: proteinTarget, unit: 'g', color: 'bg-blue-50 text-blue-600' },
          { label: 'Carbs', value: totalC, target: carbsTarget, unit: 'g', color: 'bg-amber-50 text-amber-600' },
          { label: 'Fat', value: totalF, target: fatTarget, unit: 'g', color: 'bg-red-50 text-red-500' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-card rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-2xl font-bold text-text-primary font-heading">{s.value}</span>
              <span className="text-xs text-text-muted mb-1">/ {s.target} {s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Diet Button - Mobile Only */}
      <div className="lg:hidden animate-fade-in-up">
        <button
          onClick={handleGenerateDiet}
          disabled={isGeneratingDiet}
          className="w-full flex items-center justify-center gap-2 bg-primary-accent text-white font-bold py-4 rounded-2xl hover:bg-primary-accent/90 transition-all shadow-md shadow-primary-accent/15 disabled:opacity-50"
        >
          {isGeneratingDiet ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate a diet for me
            </>
          )}
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in-up delay-100">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
              activeDay === day
                ? 'bg-primary-accent text-white shadow-md shadow-primary-accent/20'
                : 'bg-bg-card text-text-muted border border-gray-200 hover:border-primary-accent/30'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Meals + Macro Ring */}
      <div className="flex gap-6 animate-fade-in-up delay-200">
        {/* Meal Sections */}
        <div className="flex-1 space-y-4">
          {Object.entries(todayMeals).map(([mealSlot, food]) => {
            if (!food) return null
            const isExpanded = expandedMeals[mealSlot]

            return (
              <div key={mealSlot} className="bg-bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedMeals(prev => ({ ...prev, [mealSlot]: !prev[mealSlot] }))}
                  className="w-full flex items-center justify-between p-5 hover:bg-bg-main/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mealEmojis[mealSlot] || '🍽️'}</span>
                    <div className="text-left">
                      <h3 className="font-heading font-bold text-text-primary">{mealSlot}</h3>
                      <p className="text-xs text-text-muted">{food.calories} kcal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3">
                    {food.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-bg-main group relative">
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-text-primary">{item.name}</span>
                          <p className="text-xs text-text-light mt-0.5">{item.arabicName}</p>
                          <div className="flex gap-1.5 mt-2">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">P {item.protein}g</span>
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">C {item.carbs}g</span>
                            <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">F {item.fat}g</span>
                            <span className="text-[10px] font-bold bg-primary-pale text-primary-accent px-2 py-0.5 rounded-full">{item.calories} kcal</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSwapModal({ open: true, day: activeDay, mealSlot, mode: 'swap', index: idx })}
                            className="p-2 text-text-muted hover:text-primary-accent transition-colors"
                            title={t('nutrition.swap_dish')}
                          >
                            <ArrowLeftRight size={14} />
                          </button>
                          <button
                            onClick={() => removeFood(activeDay, mealSlot, idx)}
                            className="p-2 text-text-muted hover:text-danger transition-colors"
                            title="Remove Dish"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setSwapModal({ open: true, day: activeDay, mealSlot, mode: 'add', index: null })}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-text-muted hover:text-primary-accent hover:border-primary-accent/30 transition-all text-xs font-bold"
                    >
                      <span className="text-lg">+</span> Add Dish
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={addExtraMeal}
            className="w-full flex items-center justify-center gap-2 py-4 bg-green-50 text-[#2E7D52] font-bold rounded-2xl border-2 border-dashed border-[#2E7D52]/20 hover:bg-green-100 transition-all animate-fade-in-up"
          >
            <span className="text-xl">+</span> Add Extra Meal
          </button>
        </div>

        {/* Macro Pie Chart */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-bg-card rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-6">
            <h3 className="font-heading font-bold text-text-primary text-sm mb-4">Macro Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${Math.round(val)} kcal`, name]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
              ))}
            </div>
            {/* Generate Diet Button */}
            <button
              onClick={handleGenerateDiet}
              disabled={isGeneratingDiet}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-primary-accent text-white font-bold py-3 rounded-xl hover:bg-primary-accent/90 transition-all shadow-md shadow-primary-accent/15 disabled:opacity-50"
            >
              {isGeneratingDiet ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate a diet for me
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-300">
        <button
          onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.onchange = (e) => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); const reader = new FileReader(); reader.onload = () => setPhotoPreview(reader.result); reader.readAsDataURL(f); setPhotoModal(true) } }; inp.click() }}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-accent hover:bg-primary-accent/90 text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-accent/25"
        >
          <Camera size={20} />
          📸 Log with Photo
        </button>
        <button
          onClick={() => {
            const doc = new jsPDF()
            doc.setFontSize(20); doc.text('VitalSense AI \u2014 Weekly Meal Plan', 20, 20)
            doc.setFontSize(12); doc.text(`Name: ${profile?.name || 'User'} | Goal: ${profile?.goal || '-'} | Target: ${calorieTarget} kcal/day`, 20, 35)
            let y = 50
            days.forEach(day => {
              const dayMeals = meals[day] || {}
              doc.setFontSize(14); doc.text(day, 20, y); y += 8
              Object.entries(dayMeals).forEach(([slot, foods]) => {
                if (Array.isArray(foods)) foods.forEach(f => { doc.setFontSize(10); doc.text(`  \u2022 ${f.name} \u2014 ${f.calories} kcal`, 20, y); y += 6 })
              })
              y += 4; if (y > 270) { doc.addPage(); y = 20 }
            })
            doc.save(`VitalSense_MealPlan_${profile?.name || 'User'}.pdf`)
          }}
          className="flex items-center justify-center gap-2 bg-bg-card border border-gray-200 text-text-primary font-semibold py-4 px-6 rounded-2xl transition-all hover:shadow-md"
        >
          <FileText size={20} />
          📄 Export PDF
        </button>
      </div>

      {/* ════════════════════════════════════════════
          SWAP DISH MODAL
      ════════════════════════════════════════════ */}
      {swapModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[49]"
            onClick={() => { setSwapModal({ open: false, day: null, mealSlot: null }); setSwapSearch(''); setSwapFilter('all') }}
          />

          {/* Modal */}
          <div className="relative z-50 bg-white rounded-2xl shadow-2xl w-[min(600px,90vw)] max-h-[85vh] p-6 flex flex-col overflow-hidden animate-scale-in">
            {/* Sticky Header Region */}
            <div className="flex-shrink-0 bg-white">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h2 className="font-heading text-xl font-bold text-text-primary">
                    {swapModal.mode === 'add' ? 'Add Dish' : 'Swap Dish'}
                  </h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    {swapModal.mode === 'add' ? `Add a dish to ${swapModal.mealSlot}` : `Replace ${swapModal.mealSlot} for ${swapModal.day}`}
                  </p>
                </div>
                <button
                  onClick={() => { setSwapModal({ open: false, day: null, mealSlot: null }); setSwapSearch(''); setSwapFilter('all') }}
                  className="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="pt-4 pb-2">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type="text"
                    placeholder="Search Lebanese dishes..."
                    value={swapSearch}
                    onChange={e => setSwapSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-bg-main rounded-xl text-sm text-text-primary border border-gray-200 focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 pb-3 overflow-x-auto">
                {filterOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSwapFilter(opt.key)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      swapFilter === opt.key
                        ? 'bg-primary-accent text-white shadow-md shadow-primary-accent/20'
                        : 'bg-bg-main text-text-muted border border-gray-200 hover:border-primary-accent/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 mt-2 -mr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFoods.map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleFoodSelect(food)}
                    className="bg-bg-main hover:bg-primary-pale border border-gray-100 hover:border-primary-accent/30 rounded-2xl p-4 text-left transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-primary-accent transition-colors">{food.name}</p>
                        <p className="text-xs text-text-light mt-0.5">{food.arabicName}</p>
                      </div>
                      <span className="text-xs font-bold bg-primary-pale text-primary-accent px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
                        {food.calories} kcal
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2.5">
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">P {food.protein}g</span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">C {food.carbs}g</span>
                      <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">F {food.fat}g</span>
                    </div>
                    {food.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {food.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-medium bg-gray-100 text-text-muted px-1.5 py-0.5 rounded-full capitalize">{tag}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {filteredFoods.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-text-muted text-sm">No dishes found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Recognition Modal */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => { setPhotoModal(false); setPhotoResults(null); setPhotoPreview(null) }}>
          <div className="bg-bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-primary-accent" />
                <h2 className="font-heading font-bold text-text-primary text-lg">AI Meal Analysis</h2>
              </div>
              <button onClick={() => { setPhotoModal(false); setPhotoResults(null); setPhotoPreview(null) }} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {photoPreview && (
                <img src={photoPreview} alt="Meal preview" className="w-full h-48 object-cover rounded-2xl" />
              )}
              {!photoResults && (
                <button
                  onClick={async () => {
                    setPhotoAnalyzing(true)
                    try {
                      const base64 = photoPreview.split(',')[1]
                      const res = await authFetch(`${API_BASE}/api/analyze-meal-photo/`, {
                        method: 'POST',
                        body: JSON.stringify({ image_base64: base64, user_id: user.id })
                      })
                      if (res.ok) { const data = await res.json(); setPhotoResults(data) }
                    } catch (err) { console.error('Photo analysis error:', err) }
                    finally { setPhotoAnalyzing(false) }
                  }}
                  disabled={photoAnalyzing}
                  className="w-full bg-primary-accent text-white font-semibold py-3 rounded-xl hover:bg-primary-accent/90 transition-colors disabled:opacity-60"
                >
                  {photoAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze This Meal'}
                </button>
              )}
              {photoResults && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-text-muted uppercase">Detected Dishes</p>
                  {photoResults.dishes?.map((dish, i) => (
                    <div key={i} className="bg-bg-main rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm font-bold text-text-primary">{dish.name}</p>
                          {dish.arabicName && <p className="text-xs text-text-muted">{dish.arabicName}</p>}
                        </div>
                        <span className="text-xs font-bold bg-primary-pale text-primary-accent px-3 py-1 rounded-full">{Math.round(dish.calories * portionScale)} kcal</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">P {Math.round(dish.protein * portionScale)}g</span>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">C {Math.round(dish.carbs * portionScale)}g</span>
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">F {Math.round(dish.fat * portionScale)}g</span>
                      </div>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Portion Size: {portionScale.toFixed(1)}x</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={portionScale} onChange={e => setPortionScale(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <button
                    onClick={() => {
                      photoResults.dishes?.forEach(dish => {
                        const food = { name: dish.name, calories: Math.round(dish.calories * portionScale), protein: Math.round(dish.protein * portionScale), carbs: Math.round(dish.carbs * portionScale), fat: Math.round(dish.fat * portionScale) }
                        supabase.from('daily_logs').insert({ user_id: user.id, log_date: new Date().toISOString().split('T')[0], meal_data: food }).then(() => {})
                      })
                      updateStreak(user.id)
                      setPhotoModal(false); setPhotoResults(null); setPhotoPreview(null)
                    }}
                    className="w-full bg-primary-accent text-white font-semibold py-3 rounded-xl hover:bg-primary-accent/90 transition-colors"
                  >
                    ✅ Add to Today's Log
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
