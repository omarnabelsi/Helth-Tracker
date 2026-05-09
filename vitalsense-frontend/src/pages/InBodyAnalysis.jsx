import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { Activity, Target, TrendingUp, Info, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const InBodyAnalysis = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [showForm, setShowForm] = useState(true)
  
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    body_fat_pct: '',
    muscle_mass_kg: '',
    visceral_fat: '',
    bmr: '',
    water_pct: ''
  })

  useEffect(() => {
    fetchHistory()
    // Load initial data from profile if exists
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (data) {
      setFormData(prev => ({
        ...prev,
        weight: data.weight || '',
        height: data.height || '',
        age: data.age || '',
        gender: data.gender || 'male'
      }))
    }
  }

  const fetchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_BASE}/api/inbody/history`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      console.error('History fetch error:', err)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_BASE}/api/inbody/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      setResults(data)
      setShowForm(false)
      fetchHistory()
      toast.success(t('progress.inbody_complete'))
    } catch (err) {
      console.error('Analysis error:', err)
      toast.error(t('progress.inbody_error'))
    } finally {
      setLoading(false)
    }
  }

  const updateProfileTargets = async () => {
    if (!results) return
    const { calories, protein_g, carbs_g, fat_g } = results.recommended_targets
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          calorie_target: calories,
          protein_target: protein_g,
          carbs_target: carbs_g,
          fat_target: fat_g
        })
        .eq('user_id', user.id)
      
      if (error) throw error
      toast.success(t('progress.targets_updated'))
    } catch (err) {
      toast.error(t('progress.targets_error'))
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity className="text-primary-accent" size={32} />
          {t('progress.inbody_title')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
          {t('progress.inbody_subtitle')}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr' : 'minmax(300px, 1fr) 2fr', gap: '32px' }}>
        {/* Form Section */}
        {showForm ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>{t('progress.enter_results')}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('onboarding.weight_kg')}</label>
                <input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('onboarding.height_cm')}</label>
                <input name="height" type="number" value={formData.height} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('onboarding.age')}</label>
                <input name="age" type="number" value={formData.age} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('settings.gender')}</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}>
                  <option value="male">{t('settings.male')}</option>
                  <option value="female">{t('settings.female')}</option>
                </select>
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('progress.body_fat_pct')}</label>
                <input name="body_fat_pct" type="number" step="0.1" value={formData.body_fat_pct} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('progress.muscle_mass_kg')}</label>
                <input name="muscle_mass_kg" type="number" step="0.1" value={formData.muscle_mass_kg} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('progress.visceral_fat')}</label>
                <input name="visceral_fat" type="number" value={formData.visceral_fat} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('progress.bmr')}</label>
                <input name="bmr" type="number" value={formData.bmr} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>{t('progress.water_pct')}</label>
                <input name="water_pct" type="number" step="0.1" value={formData.water_pct} onChange={handleInputChange} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} />
              </div>
              
              <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full p-4 rounded-2xl font-bold text-base shadow-xl shadow-primary-accent/10 active:scale-[0.98]"
                >
                  {loading ? <div className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin" /> {t('progress.analyzing_ai')}</div> : t('progress.run_ai_analysis')}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Results Section */
          <>
            {/* Left: Summary Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(76,175,125,0.1)', border: '2px solid rgba(76,175,125,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#4CAF7D' }}>{results.score}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{t('progress.composition_score')}</h3>
                <p style={{ color: '#4CAF7D', fontSize: '14px', fontWeight: '600' }}>{t('progress.focus')}: {results.focus_area}</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={18} className="text-primary-accent" />
                  {t('progress.recommended_targets')}
                </h3>
                <div style={{ spaceY: '16px' }}>
                   <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justify: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{t('progress.daily_calories')}</span>
                        <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{results.recommended_targets.calories} {t('common.kcal')}</span>
                      </div>
                      <div style={{ h: '4px', bg: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ h: '100%', bg: '#4CAF7D', width: '70%' }}></div>
                      </div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#3B82F6', fontWeight: '700', fontSize: '16px' }}>{results.recommended_targets.protein_g}g</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{t('nutrition.protein').toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '16px' }}>{results.recommended_targets.carbs_g}g</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{t('nutrition.carbs').toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#EF4444', fontWeight: '700', fontSize: '16px' }}>{results.recommended_targets.fat_g}g</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{t('nutrition.fat').toUpperCase()}</div>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={updateProfileTargets}
                  className="btn-primary w-full mt-6 p-3 rounded-xl font-bold text-sm shadow-md shadow-primary-accent/10 active:scale-[0.98]"
                >
                  {t('progress.adopt_targets')}
                </button>
              </div>
              
              <button 
                onClick={() => setShowForm(true)}
                className="w-full bg-bg-card border border-border-color p-3 rounded-xl text-text-primary text-sm font-semibold hover:bg-bg-main transition-colors active:scale-[0.98]"
              >
                {t('progress.new_analysis')}
              </button>
            </div>

            {/* Right: Detailed Analysis & Advice */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} className="text-primary-accent" />
                  {t('progress.analysis_report')}
                </h2>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {results.analysis}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="text-primary-accent">ℹ️</span>
                  {t('progress.actionable_advice')}
                </h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', spaceY: '16px' }}>
                  {results.advice.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                      <CheckCircle2 size={18} className="text-primary-accent" style={{ flexShrink: 0, marginTop: '2px' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* History Section */}
      <div style={{ marginTop: '64px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>{t('progress.test_history')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.length > 0 ? history.map((log, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{new Date(log.created_at).toLocaleDateString()}</span>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0' }}>
                  {t('dashboard.weight')}: {log.weight}{t('common.kg')} · {t('progress.body_fat')}: {log.body_fat_pct}% · {t('progress.muscle')}: {log.muscle_mass_kg}{t('common.kg')}
                </p>
              </div>
              <button 
                onClick={() => { setResults(log.analysis_result); setShowForm(false) }}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px 16px', borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer' }}
              >
                {t('progress.view_report')}
              </button>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>
              {t('progress.no_tests')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InBodyAnalysis
