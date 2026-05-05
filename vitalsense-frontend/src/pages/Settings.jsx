import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Target, Lock, Bell, Activity, Save, LogOut, Loader2, Sparkles, AlertCircle, Flame, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../utils/authFetch'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [streak, setStreak] = useState(null)
  const [toast, setToast] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activity_level: 'moderate',
    medical_conditions: '',
    goal: 'Improve Health',
    loss_target: '0.5'
  })
  const [password, setPassword] = useState('')
  const [notifications, setNotifications] = useState({
    dailyMeal: true,
    workoutReminder: true,
    weeklyProgress: false
  })

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setProfile(data)
        setFormData({
          name: data.name || '',
          age: data.age || '',
          gender: data.gender || 'male',
          weight: data.weight || '',
          height: data.height || '',
          activity_level: data.activity_level || 'moderate',
          medical_conditions: data.medical_conditions || '',
          goal: data.goal || 'Improve Health',
          loss_target: data.loss_target || '0.5'
        })
      }
      setIsLoading(false)
    })()

    // Fetch streak
    supabase.from('streaks').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setStreak(data) })
  }, [user])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Calculate calories based on Mifflin-St Jeor
  const calculateTarget = (data) => {
    const w = parseFloat(data.weight) || 70
    const h = parseFloat(data.height) || 170
    const a = parseInt(data.age) || 30
    
    let bmr = (10 * w) + (6.25 * h) - (5 * a)
    bmr += data.gender === 'male' ? 5 : -161

    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
    let tdee = bmr * (multipliers[data.activity_level] || 1.55)
    
    if (data.goal === 'Lose Fat') {
      const loss = parseFloat(data.loss_target) || 0.5
      tdee -= (loss * 1100) // approx 1100 kcal deficit per 0.1kg loss? Wait, 1kg = 7700 kcal. 0.5kg/week = 3850 kcal/week = 550 kcal/day. 
      // Loss is in kg/week. 
      // 0.25kg = 275 deficit. 0.5kg = 550 deficit. 1.0kg = 1100 deficit.
      tdee -= (loss * 1100) 
    } else if (data.goal === 'Build Muscle') {
      tdee += 300
    }
    
    return Math.round(tdee)
  }

  const handleProfileSave = async () => {
    setIsSavingProfile(true)
    const target = calculateTarget(formData)
    
    const { error } = await supabase.from('profiles').update({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      activity_level: formData.activity_level,
      medical_conditions: formData.medical_conditions,
      goal: formData.goal,
      loss_target: formData.goal === 'Lose Fat' ? formData.loss_target : null,
      calorie_target: target
    }).eq('user_id', user.id)

    setIsSavingProfile(false)
    if (error) {
      showToast('Error saving profile', 'error')
    } else {
      showToast('Profile updated successfully!')
    }
  }

  const handleRegeneratePlan = async () => {
    setIsGeneratingPlan(true)
    
    // First save the profile
    await handleProfileSave()

    try {
      const res = await authFetch(`${API_BASE}/api/generate-plan/`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          age: parseInt(formData.age) || 25,
          gender: formData.gender || 'male',
          weight: parseFloat(formData.weight) || 70,
          height: parseFloat(formData.height) || 170,
          tdee: calculateTarget(formData) + 500,
          calorie_target: calculateTarget(formData),
          goal: formData.goal === 'Lose Fat' ? 'lose_fat' : formData.goal === 'Build Muscle' ? 'build_muscle' : 'improve_health',
          activity_level: formData.activity_level || 'moderate',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to generate plan')
      }
      showToast('New plan generated successfully!')
    } catch (error) {
      console.error(error)
      if (error.message === 'SESSION_EXPIRED') {
        showToast('Session expired. Please log in again.', 'error')
        navigate('/login')
      } else {
        showToast(`Error: ${error.message}`, 'error')
      }
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!password) return
    const { error } = await supabase.auth.updateUser({ password })
    if (error) showToast(error.message, 'error')
    else {
      showToast('Password updated')
      setPassword('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary-accent" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg font-medium text-sm flex items-center gap-2 z-50 animate-fade-in ${toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-primary-pale text-primary-accent border border-primary-light'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="animate-fade-in">
        <h1 className="font-heading text-2xl font-bold text-text-primary">{t('settings.title')}</h1>
        <p className="text-text-muted text-sm mt-1">Manage your profile, goals, and account preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <User size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">Profile Settings</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('auth.name')}</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.age')}</label>
                <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.gender')}</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Weight (kg)</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Height (cm)</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.activity')}</label>
                <select value={formData.activity_level} onChange={e => setFormData({...formData, activity_level: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all">
                  <option value="sedentary">Sedentary (Office job, no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="active">Very Active (6-7 days/week)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={handleProfileSave} disabled={isSavingProfile} className="flex items-center gap-2 bg-[#2E7D52] hover:bg-[#236040] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Health & Goals */}
          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <Target size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">Health & Goals</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Medical Conditions (Optional)</label>
                <input type="text" placeholder="e.g. Hypertension, Celiac..." value={formData.medical_conditions} onChange={e => setFormData({...formData, medical_conditions: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Primary Goal</label>
                <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all">
                  <option value="Lose Fat">{t('onboarding.lose_fat')}</option>
                  <option value="Build Muscle">{t('onboarding.build_muscle')}</option>
                  <option value="Improve Health">{t('onboarding.improve_health')}</option>
                </select>
              </div>

              {formData.goal === 'Lose Fat' && (
                <div className="p-4 bg-primary-pale rounded-xl border border-primary-light/30">
                  <label className="text-xs font-semibold text-text-muted mb-1 block">Weekly Loss Target</label>
                  <select value={formData.loss_target} onChange={e => setFormData({...formData, loss_target: e.target.value})} className="w-full px-4 py-2 bg-white rounded-lg text-sm border border-transparent focus:border-primary-accent outline-none">
                    <option value="0.25">0.25 kg / week (Moderate)</option>
                    <option value="0.5">0.5 kg / week (Recommended)</option>
                    <option value="1">1.0 kg / week (Aggressive)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <p className="text-sm font-semibold text-text-primary">Recalculate AI Plan</p>
                <p className="text-xs text-text-muted">Generate a new meal and workout plan based on your latest stats.</p>
              </div>
              <button onClick={handleRegeneratePlan} disabled={isGeneratingPlan} className="flex items-center gap-2 bg-[#2E7D52] hover:bg-[#236040] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap disabled:opacity-50">
                {isGeneratingPlan ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Regenerate My Plan
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Settings (Account & Notifications) */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <Lock size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">{t('settings.account')}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Email Address</label>
                <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-gray-50 text-text-muted rounded-xl text-sm border border-gray-200 outline-none cursor-not-allowed" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.change_password')}</label>
                <div className="flex gap-2">
                  <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="flex-1 px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
                  <button onClick={handlePasswordChange} className="bg-gray-100 hover:bg-gray-200 text-text-primary px-3 rounded-xl font-semibold text-sm transition-all">Update</button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all">
                <LogOut size={16} />{t('settings.sign_out')}</button>
            </div>
          </div>

          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <Bell size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">{t('settings.notifications')}</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'dailyMeal', label: 'Daily meal reminder' },
                { key: 'workoutReminder', label: 'Workout reminder' },
                { key: 'weeklyProgress', label: 'Weekly progress report' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary font-medium">{item.label}</span>
                  <button 
                    onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notifications[item.key] ? 'bg-primary-accent' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <Flame size={18} className="text-orange-500" />
              <h2 className="font-heading font-bold text-text-primary">Your Streaks</h2>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 bg-bg-main rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
                <span className="text-xs text-text-muted font-bold uppercase mb-1">Current Streak</span>
                <div className="flex items-center gap-1.5">
                  <Flame size={20} className="text-orange-500" />
                  <span className="text-xl font-bold text-text-primary">{streak?.current_streak || 0}</span>
                </div>
              </div>
              <div className="flex-1 bg-bg-main rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
                <span className="text-xs text-text-muted font-bold uppercase mb-1">Longest Streak</span>
                <div className="flex items-center gap-1.5">
                  <Trophy size={20} className="text-yellow-500" />
                  <span className="text-xl font-bold text-text-primary">{streak?.longest_streak || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
