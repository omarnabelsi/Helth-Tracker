import { useState, useEffect, useMemo } from 'react'
import { Check, Camera, ChevronDown, ChevronUp, Flame, ArrowLeftRight, X, Search, Upload, FileText, Sparkles, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import MacroBar from '../components/MacroBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import lebaneseFoods from '../data/lebaneseFoods'
import { updateStreak, unlockFirstMealLog } from '../utils/streaks'
import { authFetch } from '../utils/authFetch'
import jsPDF from 'jspdf'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import FoodSearch from '../components/FoodSearch'
import { isFoodValidForMeal } from '../data/mealTimeRules'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const mealEmojis = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snack: '🍎' }

// ── Generate a default daily plan from the food DB based on calorie target ──
function generateDefaultPlan(calorieTarget) {
  const target = calorieTarget || 2000
  const mains = lebaneseFoods.filter(f => f.category === 'main')
  const perMeal = Math.round(target / 4)

  const pickFood = (seed) => {
    const idx = Math.abs(seed) % mains.length
    const food = mains[idx]
    const g = 250
    const ratio = g / 100
    return {
      ...food,
      id: food.id + '-' + seed,
      calories: Math.round(food.caloriesPer100g * ratio),
      protein: Math.round(food.proteinPer100g * ratio),
      carbs: Math.round(food.carbsPer100g * ratio),
      fat: Math.round(food.fatPer100g * ratio),
      loggedGrams: g
    }
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

// ── Convert AI plan format ──
function convertAiPlan(planData, currentCalorieTarget) {
  if (!planData?.weeklyMealPlan) return null
  const converted = {}
  const dayMap = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' }

  Object.entries(planData.weeklyMealPlan).forEach(([dayName, dayMealsArray]) => {
    const shortDay = dayMap[dayName] || dayName
    if (Array.isArray(dayMealsArray)) {
      converted[shortDay] = {}
      dayMealsArray.forEach((mealSlot) => {
        const slotName = mealSlot.meal
        const dishes = (mealSlot.dishes || []).map((dish, di) => {
          const matched = lebaneseFoods.find(f => f.name.toLowerCase() === dish.name?.toLowerCase())
          const g = dish.grams || 100
          const ratio = g / 100

          if (matched) {
            return {
              ...matched,
              id: `${matched.id}-${shortDay}-${di}`,
              calories: Math.round(matched.caloriesPer100g * ratio),
              protein: Math.round(matched.proteinPer100g * ratio),
              carbs: Math.round(matched.carbsPer100g * ratio),
              fat: Math.round(matched.fatPer100g * ratio),
              loggedGrams: g
            }
          }
          return {
            ...dish,
            id: `custom-${shortDay}-${di}`,
            loggedGrams: g,
            calories: dish.calories || 0,
            protein: dish.protein || 0,
            carbs: dish.carbs || 0,
            fat: dish.fat || 0,
            serving: '1 serving',
            tags: [],
          }
        })
        converted[shortDay][slotName] = dishes
      })
    }
  })
  days.forEach(d => { if (!converted[d]) converted[d] = generateDefaultPlan(currentCalorieTarget)[d] })
  return converted
}

export default function Nutrition() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth()
  const [activeDay, setActiveDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
  const [expandedMeals, setExpandedMeals] = useState({ Breakfast: true, Lunch: true, Dinner: true, Snack: true })
  const [calorieTarget, setCalorieTarget] = useState(2000)
  const [profile, setProfile] = useState(null)
  const [aiPlan, setAiPlan] = useState(null)
  const [meals, setMeals] = useState(() => generateDefaultPlan(2000))
  const [activePlanId, setActivePlanId] = useState(null)
  const [swapModal, setSwapModal] = useState({ open: false, day: null, mealSlot: null, mode: 'swap', index: null })
  const [gramsInput, setGramsInput] = useState(100)
  const [selectedFoodForGrams, setSelectedFoodForGrams] = useState(null)
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false)
  
  const [photoModal, setPhotoModal] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false)
  const [photoResults, setPhotoResults] = useState(null)
  const [portionScale, setPortionScale] = useState(1)

  const handleGenerateDiet = async () => {
    setIsGeneratingDiet(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_BASE}/api/generate-plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          user_id: user.id,
          age: profile?.age || 25,
          gender: profile?.gender || 'male',
          weight: profile?.weight || 70,
          height: profile?.height || 170,
          tdee: profile?.tdee || 2000,
          calorie_target: calorieTarget,
          goal: profile?.goal || 'improve_health',
          medical_conditions: profile?.medical_conditions,
          activity_level: profile?.activity_level || 'moderate',
          gym_type: profile?.gym_type || 'home',
          equipment_list: profile?.equipment_list || []
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      const converted = convertAiPlan(data, calorieTarget)
      if (converted) {
        updateMeals(converted)
        setAiPlan(data)
        // Save to DB
        await supabase.from('plans').insert({ 
          user_id: user.id, 
          plan_data: data,
          type: 'nutrition'
        }).then(({ data: inserted }) => {
          if (inserted?.[0]) setActivePlanId(inserted[0].id)
        })
        toast.success(t('nutrition.plan_generated'))
      }
    } catch (err) {
      console.error('Plan gen error:', err)
      toast.error(t('nutrition.error_generating'))
    } finally {
      setIsGeneratingDiet(false)
    }
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (prof) {
        setProfile(prof)
        setCalorieTarget(prof.calorie_target || 2000)
      }

      const today = new Date().toISOString().split('T')[0]
      const { data: log } = await supabase.from('daily_logs').select('meal_data').eq('user_id', user.id).eq('log_date', today).maybeSingle()

      if (log?.meal_data) {
        setMeals(log.meal_data)
        const { data: plans } = await supabase.from('plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
        if (plans?.length) {
          setAiPlan(plans[0].plan_data)
          setActivePlanId(plans[0].id)
        }
      } else {
        const { data: plans } = await supabase.from('plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
        if (plans?.length) {
          setActivePlanId(plans[0].id)
          setAiPlan(plans[0].plan_data)
          const converted = convertAiPlan(plans[0].plan_data, prof?.calorie_target || 2000)
          if (converted) setMeals(converted)
        } else if (prof) {
          setMeals(generateDefaultPlan(prof.calorie_target || 2000))
        }
      }
    })()
  }, [user])

  const todayMeals = meals[activeDay] || {}
  const todayItems = Object.values(todayMeals).flat().filter(Boolean)
  const totalCal = Math.round(todayItems.reduce((s, f) => s + (f?.calories || 0), 0))
  const totalP = Math.round(todayItems.reduce((s, f) => s + (f?.protein || 0), 0))
  const totalC = Math.round(todayItems.reduce((s, f) => s + (f?.carbs || 0), 0))
  const totalF = Math.round(todayItems.reduce((s, f) => s + (f?.fat || 0), 0))
  const remainingCal = Math.round(Math.max(0, calorieTarget - totalCal))

  const updateMeals = (newMeals) => {
    setMeals(newMeals)
    if (user) {
      const today = new Date().toISOString().split('T')[0]
      supabase.from('daily_logs').upsert({ user_id: user.id, log_date: today, meal_data: newMeals }, { onConflict: 'user_id,log_date' }).then(() => { })
      if (activePlanId) {
        const dayMapRev = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' }
        const weeklyMealPlan = {}
        Object.entries(newMeals).forEach(([shortDay, slotData]) => {
          const fullDay = dayMapRev[shortDay] || shortDay
          weeklyMealPlan[fullDay] = Object.entries(slotData).map(([meal, dishes]) => ({ meal, dishes: dishes || [] }))
        })
        supabase.from('plans').update({ plan_data: { ...aiPlan, weeklyMealPlan } }).eq('id', activePlanId).then(() => {
          setAiPlan(prev => ({ ...prev, weeklyMealPlan }))
        })
      }
    }
  }

  const handleFoodSelect = async (food) => {
    if (!food) return

    const { day, mealSlot, mode, index } = swapModal
    const isAr = i18n.language === 'ar'
    const validation = isFoodValidForMeal(food.name, mealSlot.toLowerCase())

    if (!validation.valid) {
      const getArabicReason = (reason) => {
        if (reason.includes('heavy for breakfast')) return 'ثقيل جداً على الفطور'
        if (reason.includes('heavy for a snack')) return 'ثقيل جداً كوجبة خفيفة'
        if (reason.includes('not ideal for dinner')) return 'غير مناسب للعشاء'
        if (reason.includes('Desserts are not appropriate for breakfast')) return 'الحلويات غير مناسبة للفطور'
        return reason
      }

      toast.error(
        isAr
          ? `❌ ${food.name} غير مناسب لوجبة ${t(`nutrition.${mealSlot.toLowerCase()}`)} — ${getArabicReason(validation.reason)}`
          : `❌ ${food.name} is not suitable for ${mealSlot} — ${validation.reason}`,
        { duration: 4000 }
      )
      return 
    }

    if (validation.warning) {
      toast.error(
        isAr ? 'هذه الوجبة عالية السعرات كوجبة خفيفة' : validation.warning,
        { duration: 3000, icon: '⚠️', style: { background: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' } }
      )
    }

    const g = parseFloat(gramsInput) || 100
    const ratio = g / 100
    const finalFood = {
      ...food,
      id: food.id + '-' + Date.now(),
      calories: Math.round((food.caloriesPer100g || food.calories) * ratio),
      protein: Math.round((food.proteinPer100g || food.protein) * ratio),
      carbs: Math.round((food.carbsPer100g || food.carbs) * ratio),
      fat: Math.round((food.fatPer100g || food.fat) * ratio),
      loggedGrams: g
    }

    const nextMeals = { ...meals }
    const dayMeals = { ...nextMeals[day] }

    if (mode === 'swap') {
      const slot = [...dayMeals[mealSlot]]
      slot[index] = finalFood
      dayMeals[mealSlot] = slot
    } else {
      dayMeals[mealSlot] = [...(dayMeals[mealSlot] || []), finalFood]
    }

    nextMeals[day] = dayMeals
    updateMeals(nextMeals)
    supabase.from('meal_logs').insert({ user_id: user.id, food_name: finalFood.name, calories: finalFood.calories, protein_g: finalFood.protein, carbs_g: finalFood.carbs, fat_g: finalFood.fat }).then(() => { })
    setSwapModal({ open: false, day: null, mealSlot: null })
    setGramsInput(100)
    setSelectedFoodForGrams(null)
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const isAr = i18n.language === 'ar'
    
    // Header
    doc.setFillColor(15, 26, 20) // Deep dark background
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(76, 175, 125) // Emerald text
    doc.setFontSize(24)
    doc.text('VitalSense AI', 20, 25)
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('Personalized Nutrition Plan', 20, 32)
    
    doc.setFontSize(10)
    doc.text(`User: ${profile?.name || user?.email}`, 150, 25)
    doc.text(`Target: ${calorieTarget} kcal/day`, 150, 32)
    
    let y = 50
    
    // Weekly Plan
    Object.entries(meals).forEach(([day, mealSlots]) => {
      // Check for page break
      if (y > 240) {
        doc.addPage()
        y = 20
      }
      
      // Day Header
      doc.setFillColor(46, 125, 82)
      doc.roundedRect(20, y, 170, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.text(t(`nutrition.${day.toLowerCase()}`).toUpperCase(), 105, y + 7, { align: 'center' })
      y += 18
      
      Object.entries(mealSlots).forEach(([slot, dishes]) => {
        if (!dishes || dishes.length === 0) return
        
        doc.setTextColor(46, 125, 82)
        doc.setFontSize(10)
        doc.text(`${t(`nutrition.${slot.toLowerCase()}`)}:`, 25, y)
        y += 6
        
        dishes.forEach((dish) => {
          doc.setTextColor(60, 60, 60)
          doc.setFontSize(9)
          const dishText = `${dish.name} (${dish.loggedGrams}g) - ${dish.calories} kcal`
          doc.text(`• ${dishText}`, 30, y)
          y += 5
          
          // Small macro line
          doc.setTextColor(150, 150, 150)
          doc.setFontSize(8)
          doc.text(`  P: ${dish.protein}g | C: ${dish.carbs}g | F: ${dish.fat}g`, 35, y)
          y += 7
          
          if (y > 270) {
            doc.addPage()
            y = 20
          }
        })
        y += 2
      })
      y += 5
    })
    
    // Footer on last page
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text('Generated by VitalSense AI - Your Personal Health Companion', 105, 285, { align: 'center' })
    
    doc.save(`VitalSense_Diet_Plan_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF Diet Plan downloaded!')
  }

  const proteinTarget = Math.round(calorieTarget * 0.30 / 4)
  const carbsTarget = Math.round(calorieTarget * 0.40 / 4)
  const fatTarget = Math.round(calorieTarget * 0.30 / 9)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto">
      {/* Alerts */}
      <div className="space-y-2 animate-fade-in">
        {totalCal > calorieTarget && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <span className="text-xl">🚨</span>
              </div>
              <p className="text-sm font-bold text-red-500">{t('nutrition.warning_over')} {totalCal - calorieTarget} {t('common.kcal')}.</p>
            </div>
          </div>
        )}
      </div>

      <div className="animate-fade-in flex justify-between items-end">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">{t('nutrition.title')}</h1>
          <p className="text-text-muted text-sm mt-1">{t('nutrition.subtitle')} · {calorieTarget} {t('nutrition.kcal_target')}</p>
        </div>
      </div>

      {/* Hero Summary */}
      <div className="bg-gradient-to-r from-primary-dark to-[#1a4a36] rounded-3xl p-6 text-white relative overflow-hidden animate-fade-in-up">
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs mb-1">{totalCal} / {calorieTarget} {t('common.kcal')}</p>
              <h2 className="text-4xl font-bold font-heading">{remainingCal} <span className="text-lg font-normal opacity-50">{t('nutrition.calories_remaining')}</span></h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Flame size={24} className="text-orange-400" />
            </div>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-6">
            <div className={`h-full ${totalCal > calorieTarget ? 'bg-red-500' : 'bg-primary-light'} transition-all duration-500`} style={{ width: `${Math.min(100, (totalCal / calorieTarget) * 100)}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: t('nutrition.protein'), c: totalP, t: proteinTarget, color: 'bg-blue-400' },
              { l: t('nutrition.carbs'), c: totalC, t: carbsTarget, color: 'bg-amber-400' },
              { l: t('nutrition.fat'), c: totalF, t: fatTarget, color: 'bg-red-400' }
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-white/50 mb-1"><span>{m.l}</span><span>{Math.round(m.c)}{t('common.kg')} / {Math.round(m.t)}{t('common.kg')}</span></div>
                <div className="h-1 bg-white/10 rounded-full"><div className={`h-full ${m.color} rounded-full`} style={{ width: `${Math.min(100, (m.c / m.t) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
        {/* Left Side: Meals (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {days.map(day => (
              <button 
                key={day} 
                onClick={() => setActiveDay(day)} 
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeDay === day 
                    ? 'bg-primary-accent text-white shadow-lg shadow-primary-accent/20' 
                    : 'bg-bg-card text-text-muted border border-gray-100 hover:border-primary-accent/30'
                }`}
              >
                {t(`nutrition.${day.toLowerCase()}`)}
              </button>
            ))}
          </div>

          {/* Meals Grid */}
          <div className="space-y-4">
            {Object.entries(todayMeals).map(([slot, dishes]) => (
              <div key={slot} className="bg-bg-card rounded-2xl border border-border-color shadow-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-border-color flex items-center justify-between bg-bg-card">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mealEmojis[slot] || '🍽️'}</span>
                    <div>
                      <h3 className="font-bold text-text-primary capitalize">{t(`nutrition.${slot.toLowerCase()}`)}</h3>
                      <p className="text-[10px] font-bold text-primary-accent uppercase tracking-wider">{Math.round((dishes || []).reduce((s, d) => s + (d.calories || 0), 0))} {t('common.kcal')}</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-text-muted" />
                </div>
                <div className="p-4 space-y-3">
                  {(dishes || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-bg-main border border-border-color group hover:border-primary-accent/40 transition-all">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-bold text-text-primary">{item.name}</p>
                          {item.arabicName && <p className="text-[10px] text-text-muted mt-0.5">{item.arabicName}</p>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[9px] font-bold">P {Math.round(item.protein)}g</span>
                          <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded text-[9px] font-bold">C {Math.round(item.carbs)}g</span>
                          <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[9px] font-bold">F {Math.round(item.fat)}g</span>
                          <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[9px] font-bold">{Math.round(item.calories)} kcal</span>
                          <span className="bg-primary-accent/10 text-primary-accent px-2 py-0.5 rounded text-[9px] font-bold">{Math.round(item.loggedGrams)} {t('common.g')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSwapModal({ open: true, day: activeDay, mealSlot: slot, mode: 'swap', index: idx })} 
                          className="p-2 text-text-muted hover:text-primary-accent transition-colors bg-bg-card rounded-lg shadow-sm border border-border-color"
                        >
                          <ArrowLeftRight size={14} />
                        </button>
                        <button 
                          onClick={() => removeFood(activeDay, slot, idx)} 
                          className="p-2 text-text-muted hover:text-red-500 transition-colors bg-bg-card rounded-lg shadow-sm border border-border-color"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setSwapModal({ open: true, day: activeDay, mealSlot: slot, mode: 'add' })} 
                    className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-xs font-bold text-text-light hover:text-primary-accent hover:border-primary-accent/20 hover:bg-primary-pale transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} className="text-primary-accent" />
                    {t('nutrition.add_meal')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Macro Stats (1 column) */}
        <div className="space-y-6">
          {/* Macro Distribution Card */}
          <div className="bg-bg-card rounded-3xl border border-gray-100 p-6 shadow-sm animate-fade-in-up delay-200">
            <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
              <PieChartIcon size={18} className="text-primary-accent" />
              {t('nutrition.macro_distribution')}
            </h3>
            
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: t('nutrition.protein'), value: totalP, color: '#3B82F6' },
                      { name: t('nutrition.carbs'), value: totalC, color: '#F59E0B' },
                      { name: t('nutrition.fat'), value: totalF, color: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#3B82F6" />
                    <Cell fill="#F59E0B" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{t('common.kcal')}</p>
                <p className="text-2xl font-black text-text-primary">{totalCal}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {[
                { label: t('nutrition.protein'), val: totalP, pct: Math.round((totalP * 4 / (totalCal || 1)) * 100), color: 'bg-blue-500' },
                { label: t('nutrition.carbs'), val: totalC, pct: Math.round((totalC * 4 / (totalCal || 1)) * 100), color: 'bg-orange-500' },
                { label: t('nutrition.fat'), val: totalF, pct: Math.round((totalF * 9 / (totalCal || 1)) * 100), color: 'bg-red-500' }
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${m.color}`} />
                    <span className="text-sm font-bold text-text-primary">{m.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-text-primary">{m.pct}%</span>
                    <p className="text-[10px] text-text-muted font-bold">{m.val}g</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Generator Button */}
          <button 
            onClick={handleGenerateDiet}
            disabled={isGeneratingDiet}
            className="w-full bg-gradient-to-r from-primary-accent to-[#2E7D52] hover:shadow-xl hover:shadow-primary-accent/30 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group disabled:opacity-50"
          >
            {isGeneratingDiet ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            )}
            <div className="text-left">
              <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest leading-none mb-1">AI Recommendation</p>
              <p className="text-base">{t('nutrition.generate_diet')}</p>
            </div>
          </button>

          {/* Share Diet PDF Button */}
          <button 
            onClick={handleDownloadPDF}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group"
          >
            <FileText size={20} className="text-primary-accent group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest leading-none mb-1">Save & Share</p>
              <p className="text-base">Download Diet PDF</p>
            </div>
          </button>
        </div>
      </div>

      {/* SWAP MODAL */}
      {swapModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSwapModal({ open: false })} />
          <div className="relative bg-bg-card rounded-[28px] shadow-2xl w-full max-w-[550px] max-h-[85vh] flex flex-col overflow-hidden animate-scale-in border border-white/5">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-bg-card z-10">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{swapModal.mode === 'add' ? t('nutrition.add_meal') : t('nutrition.swap_dish')}</h2>
                <p className="text-xs text-text-muted">
                  {t(`nutrition.${swapModal.mealSlot?.toLowerCase()}`)} {t('common.for')} {t(`nutrition.${swapModal.day?.toLowerCase()}`)}
                </p>
              </div>
              <button onClick={() => setSwapModal({ open: false })} className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-2">
              {selectedFoodForGrams ? (
                <div className="bg-primary-pale/10 rounded-2xl p-6 border border-primary-accent/20 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-primary-accent text-lg">{selectedFoodForGrams.name}</h3>
                    <button onClick={() => setSelectedFoodForGrams(null)} className="text-[10px] font-bold uppercase text-text-muted hover:text-primary-accent px-2 py-1 bg-white/5 rounded-lg transition-colors">{t('common.back')}</button>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 relative">
                      <input 
                        type="number" 
                        value={gramsInput} 
                        onChange={e => setGramsInput(e.target.value)} 
                        className="w-full pl-4 pr-12 py-4 bg-white/5 rounded-xl text-xl font-extrabold text-text-primary border-2 border-primary-accent/20 focus:border-primary-accent outline-none transition-all" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold ml-1">{t('common.g')}</span>
                    </div>
                    <button onClick={() => handleFoodSelect(selectedFoodForGrams)} className="bg-primary-accent text-white px-10 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-accent/20 active:scale-95 transition-all">{t('common.save')}</button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: t('common.kcal'), v: Math.round((selectedFoodForGrams.caloriesPer100g || selectedFoodForGrams.calories || 0) * (gramsInput / 100)), c: 'text-text-primary' },
                      { l: 'P', v: Math.round((selectedFoodForGrams.proteinPer100g || selectedFoodForGrams.protein || 0) * (gramsInput / 100)), c: 'text-protein' },
                      { l: 'C', v: Math.round((selectedFoodForGrams.carbsPer100g || selectedFoodForGrams.carbs || 0) * (gramsInput / 100)), c: 'text-carbs' },
                      { l: 'F', v: Math.round((selectedFoodForGrams.fatPer100g || selectedFoodForGrams.fat || 0) * (gramsInput / 100)), c: 'text-fat' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-xl py-3 border border-white/5 flex flex-col items-center">
                        <p className={`text-base font-black ${s.c}`}>{s.v} {s.l === t('common.kcal') ? '' : t('common.g')}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <FoodSearch 
                  onSelect={f => setSelectedFoodForGrams(f)} 
                  mealType={swapModal.mealSlot?.toLowerCase()}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
