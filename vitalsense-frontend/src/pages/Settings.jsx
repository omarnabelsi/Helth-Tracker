import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Target, Lock, Bell, Activity, Save, LogOut, Loader2, Sparkles, AlertCircle, Flame, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../utils/authFetch'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../components/LanguageToggle'
import ThemePicker from '../components/ThemePicker'

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
          goal: data.goal || 'improve_health',
          loss_target: data.weekly_loss_target || '0.5'
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

  // Calculate TDEE and Target calories
  const calculateMacros = (data) => {
    const w = parseFloat(data.weight) || 70
    const h = parseFloat(data.height) || 170
    const a = parseInt(data.age) || 30
    
    let bmr = (10 * w) + (6.25 * h) - (5 * a)
    bmr += data.gender === 'male' ? 5 : -161

    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
    const tdee = bmr * (multipliers[data.activity_level] || 1.55)
    
    let target = tdee
    if (data.goal === 'lose_fat') {
      const loss = parseFloat(data.loss_target) || 0.5
      target -= (loss * 1100) 
    } else if (data.goal === 'build_muscle') {
      target += 300
    }
    
    return { tdee: Math.round(tdee), target: Math.round(target) }
  }

  const handleProfileSave = async () => {
    const { tdee, target } = calculateMacros(formData)
    
    const { error } = await supabase.from('profiles').update({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      activity_level: formData.activity_level,
      medical_conditions: formData.medical_conditions,
      goal: formData.goal,
      weekly_loss_target: formData.goal === 'lose_fat' ? parseFloat(formData.loss_target) : null,
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
      const { tdee, target } = calculateMacros(formData)
      const res = await authFetch(`${API_BASE}/api/generate-plan`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          age: parseInt(formData.age) || 25,
          gender: formData.gender || 'male',
          weight: parseFloat(formData.weight) || 70,
          height: parseFloat(formData.height) || 170,
          tdee: tdee,
          calorie_target: target,
          goal: formData.goal,
          weekly_loss_target: formData.goal === 'lose_fat' ? formData.loss_target : null,
          medical_conditions: formData.medical_conditions,
          activity_level: formData.activity_level || 'moderate',
          gym_type: profile?.gym_type || 'home',
          equipment_list: profile?.equipment_list || []
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
        <p className="text-text-muted text-sm mt-1">{t('settings.profile_section')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <User size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">{t('settings.profile_section')}</h2>
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
                  <option value="male">{t('settings.male')}</option>
                  <option value="female">{t('settings.female')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.weight')}</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.height')}</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.activity')}</label>
                <select value={formData.activity_level} onChange={e => setFormData({...formData, activity_level: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all">
                  <option value="sedentary">{t('settings.sedentary')}</option>
                  <option value="light">{t('settings.light')}</option>
                  <option value="moderate">{t('settings.moderate')}</option>
                  <option value="active">{t('settings.active')}</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={handleProfileSave} disabled={isSavingProfile} className="flex items-center gap-2 bg-[#2E7D52] hover:bg-[#236040] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('settings.save_changes')}
              </button>
            </div>
          </div>

          {/* Health & Goals */}
          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <Target size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">{t('settings.health_section')}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.conditions')}</label>
                <input type="text" placeholder={t('onboarding.conditions_placeholder')} value={formData.medical_conditions} onChange={e => setFormData({...formData, medical_conditions: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.goal')}</label>
                <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all">
                  <option value="lose_fat">{t('onboarding.lose_fat')}</option>
                  <option value="build_muscle">{t('onboarding.build_muscle')}</option>
                  <option value="improve_health">{t('onboarding.improve_health')}</option>
                </select>
              </div>

              {formData.goal === 'lose_fat' && (
                <div className="p-4 bg-primary-pale rounded-xl border border-primary-light/30">
                  <label className="text-xs font-semibold text-text-muted mb-1 block">Weekly Loss Target</label>
                  <select value={formData.loss_target} onChange={e => setFormData({...formData, loss_target: e.target.value})} className="w-full px-4 py-2 bg-bg-card rounded-lg text-sm border border-border-color focus:border-primary-accent outline-none">
                    <option value="0.25">0.25 kg / week (Moderate)</option>
                    <option value="0.5">0.5 kg / week (Recommended)</option>
                    <option value="1">1.0 kg / week (Aggressive)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <p className="text-sm font-semibold text-text-primary">{t('settings.regenerate_plan')}</p>
                <p className="text-xs text-text-muted">{t('onboarding.analyzing_subtitle')}</p>
              </div>
              <button onClick={handleRegeneratePlan} disabled={isGeneratingPlan} className="flex items-center gap-2 bg-[#2E7D52] hover:bg-[#236040] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap disabled:opacity-50">
                {isGeneratingPlan ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {t('settings.regenerate_plan')}
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
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.email')}</label>
                <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-gray-50 text-text-muted rounded-xl text-sm border border-gray-200 outline-none cursor-not-allowed" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">{t('settings.change_password')}</label>
                <div className="space-y-3">
                  <input type="password" placeholder={t('settings.new_password')} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-bg-main rounded-xl text-sm border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all" />
                  <button onClick={handlePasswordChange} className="w-full bg-primary-accent/10 hover:bg-primary-accent text-primary-accent hover:text-white py-2.5 rounded-xl font-bold text-xs transition-all border border-primary-accent/20 flex items-center justify-center uppercase tracking-wider">
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary font-medium">{t('settings.language')}</span>
                <LanguageToggle userId={user?.id} />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <span className="text-sm text-text-primary font-medium block mb-2">{t('settings.theme', 'App Theme')}</span>
                <ThemePicker />
              </div>
              <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-3 rounded-xl font-bold text-sm transition-all mt-6 border border-red-500/20 shadow-sm shadow-red-500/5">
                <LogOut size={18} />{t('settings.sign_out')}</button>
            </div>
          </div>

          <div className="bg-bg-card border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <Bell size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">{t('settings.notifications')}</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'dailyMeal', label: t('settings.notif_meals') },
                { key: 'workoutReminder', label: t('settings.notif_workout') },
                { key: 'weeklyProgress', label: t('settings.notif_weekly') }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary font-medium">{item.label}</span>
                  <button 
                    onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notifications[item.key] ? 'bg-primary-accent' : 'bg-gray-400'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border-color">
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
