import { useState, useEffect, useRef, useMemo } from 'react'
import { Camera, TrendingDown, TrendingUp, Flame, Bot, Upload, ChevronRight, Scale, Target, Calendar, Award, Share2, Trash2 } from 'lucide-react'
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'
import { toPng } from 'html-to-image'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'

const mockWeightData = [
  { date: 'Apr 10', weight: 76.2 },
  { date: 'Apr 12', weight: 76.0 },
  { date: 'Apr 14', weight: 75.8 },
  { date: 'Apr 16', weight: 75.5 },
  { date: 'Apr 18', weight: 75.3 },
  { date: 'Apr 20', weight: 75.0 },
  { date: 'Apr 22', weight: 74.8 },
  { date: 'Apr 24', weight: 74.6 },
  { date: 'Apr 26', weight: 74.5 },
  { date: 'Apr 28', weight: 74.5 },
]

const mockProgressPhotos = [
  { date: 'Apr 10', bodyFat: '20.3%', label: 'Start' },
  { date: 'Apr 17', bodyFat: '19.1%', label: 'Week 1' },
  { date: 'Apr 24', bodyFat: '18.2%', label: 'Week 2' },
]

export default function Progress() {
  const { t } = useTranslation();
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('1month')
  const [profile, setProfile] = useState(null)
  const [weightLogs, setWeightLogs] = useState([])
  const [progressPhotos, setProgressPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [newWeight, setNewWeight] = useState('')
  const [isLoggingWeight, setIsLoggingWeight] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, photoId: null, photoUrl: null })
  
  const fileInputRef = useRef(null)
  const shareRef = useRef(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        // Fetch profile
        const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
        if (prof) setProfile(prof)
        
        // Fetch weight logs
        const { data: weights } = await supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true })
        if (weights) setWeightLogs(weights)
        
        // Fetch progress photos
        const { data: photos } = await supabase.from('progress_photos').select('*').eq('user_id', user.id).order('date', { ascending: false })
        if (photos) setProgressPhotos(photos)
      } catch (err) {
        console.error('Error loading progress data:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const subDays = (date, days) => {
    const result = new Date(date)
    result.setDate(result.getDate() - days)
    return result
  }

  const filteredWeightData = useMemo(() => {
    const data = weightLogs.map(l => ({
      date: new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: l.weight_kg,
      rawDate: new Date(l.logged_at)
    }))
    const cutoff = subDays(new Date(), timeRange === '2weeks' ? 14 : timeRange === '1month' ? 30 : 90)
    return data.filter(d => d.rawDate >= cutoff)
  }, [weightLogs, timeRange])

  const handleWeightLog = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      toast.error('Please enter a valid weight')
      return
    }
    if (!user) return
    setIsLoggingWeight(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session.user.id

      const { data, error } = await supabase.from('weight_logs').insert({
        user_id: userId,
        weight_kg: parseFloat(newWeight),
        logged_at: new Date().toISOString()
      }).select()
      
      if (error) throw error

      await supabase.from('profiles')
        .update({ weight: parseFloat(newWeight) })
        .eq('user_id', userId)
      
      setWeightLogs(prev => [...prev, data[0]])
      setNewWeight('')
      toast.success('Weight logged successfully')
    } catch (err) {
      console.error('Error logging weight:', err)
      toast.error(`Failed to log weight: ${err.message}`)
    } finally {
      setIsLoggingWeight(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    setIsUploadingPhoto(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session.user.id
      const timestamp = Date.now()
      const filePath = `${userId}/${timestamp}.jpg`

      // 1. Get base64 for AI analysis
      const getBase64 = (f) => new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(f)
        reader.onload = () => resolve(reader.result.split(',')[1])
      })
      const base64Str = await getBase64(file)

      // 2. Call backend for AI analysis
      let aiAnalysis = { body_fat_pct: null, notes: 'Snapshot' }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analyze-progress-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64Str })
        })
        if (response.ok) {
          aiAnalysis = await response.json()
        }
      } catch (err) {
        console.error("AI Analysis failed", err)
      }

      // 3. Upload to Supabase Storage

      const { error: uploadError } = await supabase.storage
        .from('BUCKET_PROGRESS')
        .upload(filePath, file, { contentType: 'image/jpeg', upsert: false })
        
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      
      const { data: { publicUrl } } = supabase.storage
        .from('BUCKET_PROGRESS')
        .getPublicUrl(filePath)
      
      const { data, error: dbError } = await supabase.from('progress_photos').insert({
        user_id: userId,
        photo_url: publicUrl,
        date: new Date().toISOString().split('T')[0],
        body_fat_pct: aiAnalysis.body_fat_pct,
        notes: aiAnalysis.notes || 'Snapshot'
      }).select()
      
      if (dbError) throw new Error(`Database error: ${dbError.message}`)
      
      setProgressPhotos(prev => [data[0], ...prev])
      toast.success('Progress photo uploaded!')
    } catch (err) {
      console.error('Photo upload error:', err)
      toast.error(err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async (photoId, photoUrl) => {
    setDeleteModal({ isOpen: true, photoId, photoUrl })
  }

  const confirmDeletePhoto = async () => {
    const { photoId, photoUrl } = deleteModal
    if (!photoId) return
    
    try {
      const { error: dbError } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId)
        
      if (dbError) throw dbError;
      
      // Attempt to clean up storage
      if (photoUrl && photoUrl.includes('BUCKET_PROGRESS')) {
        const filePath = photoUrl.split('BUCKET_PROGRESS/')[1]
        if (filePath) {
          await supabase.storage.from('BUCKET_PROGRESS').remove([filePath])
        }
      }
      
      setProgressPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch (err) {
      console.error('Error deleting photo:', err)
      toast.error('Failed to delete photo')
    }
  }

  const generateReport = async () => {
    if (!user || weightLogs.length === 0) return
    setIsGeneratingReport(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/progress-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          weight_logs: weightLogs,
          profile: profile
        })
      })
      const data = await response.json()
      setAiReport(data.report)
    } catch (err) {
      console.error('Error generating report:', err)
      setAiReport("Unable to generate report at this time.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const displayPhotos = progressPhotos.map(p => ({
    id: p.id,
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bodyFat: p.body_fat_pct ? `${p.body_fat_pct}%` : '---',
    label: p.notes || 'Snapshot',
    url: p.photo_url
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto">
      <div ref={shareRef} className="space-y-6 p-4 rounded-3xl bg-bg-card border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="font-heading text-2xl font-bold text-text-primary">{t('progress.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('progress.subtitle')}</p>
      </div>

      {/* Progress Photos */}
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-text-primary">{t('dashboard.body_progress')}</h2>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-primary-accent/10 active:scale-[0.98] disabled:opacity-50"
          >
            {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                <Upload size={16} />
                {t('progress.upload_photo')}
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        {displayPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayPhotos.map((photo, i) => (
              <div key={i} className="bg-bg-card rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="aspect-[3/4] bg-gradient-to-b from-gray-50 to-gray-100 relative flex items-center justify-center">
                  {photo.url ? (
                    <img src={photo.url} className="w-full h-full object-cover" alt={photo.label} />
                  ) : (
                    <>
                      <div className="w-20 h-32 bg-gray-200 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gray-300 -mt-16"></div>
                      </div>
                    </>
                  )}
                  <div className="absolute top-3 right-3 bg-primary-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {photo.bodyFat}
                  </div>
                  <div className="absolute top-3 left-3 bg-bg-card text-text-primary text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {photo.label}
                  </div>
                  {photo.id && (
                    <button 
                      onClick={() => handleDeletePhoto(photo.id, photo.url)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100"
                      title="Delete Photo"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-text-primary">{photo.date}</p>
                  <p className="text-xs text-text-muted mt-0.5">Body Fat Est: {photo.bodyFat}</p>
                  <p className="text-[10px] text-primary-accent font-medium mt-1 flex items-center gap-1">
                    <Bot size={10} />
                    {t('chat.knows_plan')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-bg-card rounded-2xl border border-gray-100 p-8 text-center animate-fade-in-up">
            <Camera size={32} className="text-text-light mx-auto mb-3" />
            <p className="text-sm text-text-muted mb-4">{t('progress.no_photos')}</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary-accent hover:bg-primary-accent/90 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-primary-accent/15"
            >
              {t('progress.upload_first')}
            </button>
          </div>
        )}
      </div>

      {/* Time Range Tabs */}
      <div className="flex gap-2 animate-fade-in-up delay-100">
        {[
          { key: '2weeks', label: t('progress.two_weeks') },
          { key: '1month', label: t('progress.one_month') },
          { key: '3months', label: t('progress.three_months') },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTimeRange(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              timeRange === t.key
                ? 'bg-primary-accent text-white shadow-md shadow-primary-accent/20'
                : 'bg-bg-card text-text-muted border border-gray-200 hover:border-primary-accent/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Weight Chart */}
      <div className="bg-bg-card rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up delay-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-text-primary">{t('progress.weight_chart')}</h3>
        </div>
        {filteredWeightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredWeightData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={40} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '8px 12px' }}
                formatter={(val) => [`${val} ${t('common.kg')}`, t('settings.weight')]}
              />
              <Area type="monotone" dataKey="weight" stroke="#4CAF7D" strokeWidth={3} fill="url(#colorWeight)" dot={{ fill: '#4CAF7D', strokeWidth: 2, stroke: '#fff', r: 5 }} activeDot={{ fill: '#2E7D52', stroke: '#fff', strokeWidth: 2, r: 7 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <Scale size={32} className="text-text-light mb-3" />
            <p className="text-sm text-text-muted mb-4">{t('progress.no_weight_logs')}</p>
            <div className="flex items-center gap-2 bg-bg-main p-1.5 rounded-2xl border border-gray-100">
              <input 
                type="number" 
                placeholder="e.g. 75" 
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-20 px-3 py-2 bg-transparent rounded-xl text-sm outline-none text-center font-bold text-text-primary" 
              />
              <span className="text-sm text-text-muted font-medium pr-2">{t('common.kg')}</span>
              <button 
                onClick={handleWeightLog}
                disabled={isLoggingWeight}
                className="btn-primary text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-md shadow-primary-accent/10 active:scale-[0.95] disabled:opacity-50"
              >
                {isLoggingWeight ? <Loader2 size={14} className="animate-spin" /> : t('progress.save_weight')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stat Change Cards */}
      <div className="grid md:grid-cols-3 gap-4 animate-fade-in-up delay-300">
        {[
          { label: t('progress.total_lost'), value: '--', icon: TrendingDown, color: 'green' },
          { label: t('progress.body_fat'), value: '--', icon: TrendingDown, color: 'green' },
          { label: t('dashboard.streak_days'), value: `0 ${t('dashboard.streak_days')}`, icon: Flame, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${
              stat.color === 'green' ? 'bg-green-50' : 'bg-orange-50'
            } flex items-center justify-center`}>
              <stat.icon size={20} className={stat.color === 'green' ? 'text-green-600' : 'text-orange-500'} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-heading">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Progress Report */}
      <div className="bg-bg-card rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up delay-400">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-accent/20">
              <Bot size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-text-primary">{t('progress.ai_report')}</h3>
                {!aiReport && (
                  <button 
                    onClick={generateReport}
                    disabled={isGeneratingReport}
                    className="text-xs font-bold text-primary-accent hover:text-primary-light transition-colors disabled:opacity-50"
                  >
                    {isGeneratingReport ? t('common.loading') : t('progress.generate_report')}
                  </button>
                )}
              </div>
              <div className="text-sm text-text-muted leading-relaxed">
                {aiReport ? (
                  <p>{aiReport}</p>
                ) : (
                  <p>Click generate to get your AI progress report based on your logs.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Body Metrics Timeline */}
      {weightLogs.length >= 2 && (
        <div className="bg-bg-card rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up delay-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-accent" />
              <h2 className="font-heading font-bold text-text-primary">{t('progress.body_metrics')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-bg-main rounded-xl p-4 text-center">
              <p className="text-xs text-text-muted font-semibold">{t('progress.total_lost')}</p>
              <p className="text-lg font-bold text-primary-accent">{weightLogs.length >= 2 ? (weightLogs[0].weight_kg - weightLogs[weightLogs.length-1].weight_kg).toFixed(1) : '0'} kg</p>
            </div>
            <div className="bg-bg-main rounded-xl p-4 text-center">
              <p className="text-xs text-text-muted font-semibold">Current BMI</p>
              <p className="text-lg font-bold text-info">{weightLogs.length > 0 && profile?.height ? (weightLogs[weightLogs.length-1].weight_kg / ((profile.height/100)**2)).toFixed(1) : '—'}</p>
            </div>
            <div className="bg-bg-main rounded-xl p-4 text-center">
              <p className="text-xs text-text-muted font-semibold">{t('dashboard.streak_days')}</p>
              <p className="text-lg font-bold text-warning">{weightLogs.length}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={weightLogs.map(w => ({ date: new Date(w.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: w.weight_kg, bmi: profile?.height ? (w.weight_kg / ((profile.height/100)**2)) : null }))} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="weight" fill="#E8F5EE" stroke="#2E7D52" name="Weight (kg)" />
              <Line yAxisId="right" type="monotone" dataKey="bmi" stroke="#3B82F6" strokeWidth={2} name="BMI" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Share Progress Button */}
      <div className="bg-bg-card rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up delay-600">
        <button
          onClick={async () => {
            if (shareRef.current) {
              const loadingToast = toast.loading('Generating your progress report...')
              try {
                // html-to-image handles modern CSS (oklch, oklab) much better than html2canvas
                const dataUrl = await toPng(shareRef.current, {
                  cacheBust: true,
                  backgroundColor: '#0a192f',
                  pixelRatio: 2, // High resolution
                })
                
                const link = document.createElement('a')
                link.download = `VitalSense_Progress_${new Date().toISOString().split('T')[0]}.png`
                link.href = dataUrl
                link.click()
                
                toast.dismiss(loadingToast)
                toast.success('Progress report downloaded!')
              } catch (err) {
                console.error('Share error:', err)
                toast.dismiss(loadingToast)
                toast.error('Failed to generate image. Please try again.')
              }
            }
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-primary-accent/15 active:scale-[0.99]"
        >
          <Share2 size={18} />
          {t('progress.share_progress')}
        </button>
      </div>
      
      {/* Confirm Delete Modal */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDeletePhoto}
        title="Delete Progress Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
    </div>
  )
}
