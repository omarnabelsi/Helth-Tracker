import { useState, useRef, useEffect } from 'react'
import { Send, Camera, Download, AlertTriangle, CheckCircle, FileText, Bot, User, Sparkles, Copy, Check, Phone, ClipboardList } from 'lucide-react'
import MacroBar from '../components/MacroBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { authFetch } from '../utils/authFetch'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '../hooks/useSubscription'
import { UserAvatar } from '../components/AppLayout'


const DANGER_KEYWORDS = [
  'chest pain', 'heart attack', 'can\'t breathe', 'shortness of breath',
  'dizziness', 'fainting', 'fainted', 'collapsed',
  'severe pain', 'numbness', 'unconscious',
]

const suggestions = [
  'Can I eat shawarma tonight?',
  'What should I eat for breakfast?',
  'I feel dizzy after my workout',
  'How many calories do I have left?',
]

export default function Chat() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth()
  const { isPremium } = useSubscription()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [copied, setCopied] = useState(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)

  const scrubMessages = (msgs) => {
    return msgs.filter(m =>
      !m.text?.startsWith('[Context:') &&
      !m.text?.includes('User Profile:') &&
      !m.text?.includes('Daily calorie target:')
    )
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (prof) setProfile(prof)

      const { data: plans } = await supabase.from('plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      if (plans?.length) setPlan(plans[0].plan_data)

      const saved = sessionStorage.getItem(`chat_messages_${user.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Filter messages older than 24 hours
          const cutoff = Date.now() - (24 * 60 * 60 * 1000)
          const filtered = scrubMessages(parsed).filter(m => !m.timestamp || m.timestamp > cutoff)
          setMessages(filtered)
          return
        } catch (e) { console.error('Failed to parse saved chat:', e) }
      }

      try {
        const res = await authFetch(`${API_BASE}/chat/history`)
        if (res.ok) {
          const history = await res.json()
          if (history.length > 0) {
            const mapped = history.map(m => ({ 
              role: m.role === 'assistant' ? 'ai' : 'user', 
              text: m.content, 
              type: 'normal',
              timestamp: new Date(m.sent_at).getTime()
            }))
            setMessages(scrubMessages(mapped))
          } else {
            const name = prof?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || t('common.user')
            setMessages([{ role: 'ai', type: 'normal', text: t('chat.coach_greeting', { name }) }])
          }
        }
      } catch (err) { console.error('Failed to load chat history:', err) }
    })()
  }, [user])

  useEffect(() => {
    if (user && messages.length > 0) {
      sessionStorage.setItem(`chat_messages_${user.id}`, JSON.stringify(messages))
    }
  }, [messages, user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkDanger = (text) => {
    const lower = text.toLowerCase()
    return DANGER_KEYWORDS.some(kw => lower.includes(kw))
  }

  // Check free-tier daily message limit (10 messages/day)
  const checkChatLimit = async () => {
    if (isPremium) return true
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('sent_at', today)
    if (count >= 10) {
      setMessages(prev => [...prev, {
        role: 'ai',
        type: 'upgrade',
        text: isAr
          ? 'لقد وصلت إلى حد 10 رسائل اليومي. قم بالترقية إلى بريميوم للحصول على محادثات غير محدودة!'
          : 'You have reached your 10 message daily limit. Upgrade to Premium for unlimited chat!',
        timestamp: Date.now()
      }])
      return false
    }
    return true
  }

  // Generate doctor summary via Gemini backend
  const generateDoctorSummary = async (symptomText) => {
    setGeneratingSummary(true)
    try {
      const res = await authFetch(`${API_BASE}/api/doctor-summary/`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          name: profile?.name || 'Patient',
          age: profile?.age,
          weight: profile?.weight,
          conditions: profile?.medical_conditions,
          symptom: symptomText,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.summary
      }
    } catch (err) { console.error('Doctor summary error:', err) }
    finally { setGeneratingSummary(false) }
    return `Patient: ${profile?.name || 'Unknown'}\nAge: ${profile?.age || 'N/A'}\nWeight: ${profile?.weight || 'N/A'}kg\nConditions: ${profile?.medical_conditions || 'None'}\nReported symptom: "${symptomText}"\nPlease evaluate urgently.`
  }

  // Download doctor summary as PDF
  const downloadSummaryPDF = (summaryText) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(220, 38, 38)
    doc.text('VitalSense AI — Emergency Medical Summary', 20, 20)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    doc.setDrawColor(220, 38, 38)
    doc.line(20, 34, 190, 34)
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(summaryText, 170)
    doc.text(lines, 20, 44)
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('This is an AI-generated summary. Please consult a medical professional.', 20, 280)
    doc.save(`VitalSense_Emergency_${profile?.name || 'Patient'}.pdf`)
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    // Check daily limit for free users before sending
    const canSend = await checkChatLimit()
    if (!canSend) { setInput(''); return }

    const userMessage = input.trim()
    const now = Date.now()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: now }])

    const isDanger = checkDanger(userMessage)

    if (isDanger) {
      // Insert emergency notification
      supabase.from('notifications').insert({
        user_id: user.id,
        type: 'emergency',
        title: '🚨 Health Emergency Flagged',
        message: userMessage,
        read: false,
      }).then(() => {})

      setMessages(prev => [...prev, {
        role: 'ai',
        type: 'emergency',
        text: userMessage,
        timestamp: Date.now()
      }])
    }

    setIsTyping(true)
    try {
      // 1. Get planned calories for today
      const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const todayName = fullDayNames[new Date().getDay()]
      const todayPlanMeals = plan?.weeklyMealPlan?.[todayName] || []
      
      // Fix: todayPlanMeals is a list of meal objects, each with a 'dishes' array
      let totalPlannedCal = 0
      todayPlanMeals.forEach(meal => {
        if (Array.isArray(meal.dishes)) {
          meal.dishes.forEach(d => { totalPlannedCal += (d.calories || 0) })
        } else if (meal.calories) {
          totalPlannedCal += meal.calories // fallback for flat format
        }
      })

      // 2. Get ACTUAL consumed calories for today
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: logs } = await supabase.from('meal_logs')
        .select('calories')
        .eq('user_id', user.id)
        .gte('logged_at', `${todayStr}T00:00:00`)
        .lte('logged_at', `${todayStr}T23:59:59`)
      
      const actualConsumedCal = (logs || []).reduce((s, l) => s + (l.calories || 0), 0)
      const calorieTarget = profile?.calorie_target || 2000
      const remainingBudget = calorieTarget - actualConsumedCal

      const systemContext = `You are a personal health coach for this user:
        Name: ${profile?.name || 'User'}, Age: ${profile?.age || '?'}, Gender: ${profile?.gender || '?'},
        Weight: ${profile?.weight || '?'}kg, Height: ${profile?.height || '?'}cm,
        Goal: ${profile?.goal || '?'}, Daily calorie target: ${calorieTarget} kcal.
        
        CURRENT STATUS FOR TODAY:
        - Actually consumed: ${actualConsumedCal} kcal
        - Planned in meal plan: ${totalPlannedCal} kcal
        - Remaining budget: ${remainingBudget} kcal
        
        Today's planned dishes: ${todayPlanMeals.map(m => (m.dishes || []).map(d => d.name).join(', ')).join(', ')}.
        
        Answer based on ACTUAL consumed vs target. Only recommend Lebanese dishes.
        If user reports chest pain, dizziness, or fainting — immediately flag a health warning.`

      const response = await authFetch(`${API_BASE}/chat/`, {
        method: 'POST',
        body: JSON.stringify({ message: userMessage, injected_context: systemContext }),
      })

      if (response.ok) {
        const data = await response.json()
        const isFoodQuestion = /can i eat|should i eat|shawarma|falafel|hommos|food|meal|breakfast|lunch|dinner|snack|calories|kcal/i.test(userMessage)

        if (isFoodQuestion && !isDanger) {
          setMessages(prev => [...prev, {
            role: 'ai', type: 'food-check', text: data.reply,
            remaining: remainingBudget,
            total: calorieTarget,
            verdict: 'info',
            verdictText: `You have ${remainingBudget} kcal remaining today based on your logs.`,
            timestamp: Date.now()
          }])
        } else if (!isDanger) {
          setMessages(prev => [...prev, { role: 'ai', type: 'normal', text: data.reply, timestamp: Date.now() }])
        }
      } else { throw new Error(`Server error: ${response.status}`) }
    } catch (error) {
      console.error('Chat error:', error)
      if (!isDanger) {
        setMessages(prev => [...prev, { role: 'ai', type: 'normal', text: `Error: ${error.message}`, isError: true }])
      }
    } finally { setIsTyping(false) }
  }
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      
      setMessages(prev => [...prev, { 
        role: 'user', 
        text: t('chat.analyzing_photo') || 'Analyzing photo...', 
        timestamp: Date.now(),
        type: 'image'
      }])
      setIsTyping(true)

      try {
        const res = await authFetch(`${API_BASE}/api/analyze-meal-photo/`, {
          method: 'POST',
          body: JSON.stringify({ image_base64: base64, user_id: user.id })
        })
        if (res.ok) {
          const data = await res.json()
          const dishNames = data.dishes.map(d => isAr ? d.arabicName || d.name : d.name).join(', ')
          setMessages(prev => [...prev, {
            role: 'ai',
            type: 'food-check',
            text: `I've analyzed your photo! I see: ${dishNames}. Total calories: ~${data.totalCalories} kcal.`,
            total: profile?.calorie_target || 2000,
            remaining: (profile?.calorie_target || 2000) - data.totalCalories,
            verdictText: `This meal is about ${data.totalCalories} kcal.`,
            timestamp: Date.now()
          }])
        }
      } catch (err) {
        console.error('Image analysis failed:', err)
      } finally {
        setIsTyping(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = fullDayNames[new Date().getDay()]
  const todayMeals = plan?.weeklyMealPlan?.[todayName] || []
  let totalPlannedCal = 0
  todayMeals.forEach(meal => {
    if (Array.isArray(meal.dishes)) {
      meal.dishes.forEach(d => { totalPlannedCal += (d.calories || 0) })
    } else if (meal.calories) {
      totalPlannedCal += meal.calories
    }
  })
  const remainingCal = (profile?.calorie_target || 2000) - totalPlannedCal

  return (
    <div className="flex h-full">
      {/* Left Panel — Profile */}
      <div className="w-[300px] bg-bg-card border-r border-gray-100 p-5 overflow-y-auto flex-shrink-0 hidden lg:block">
        <div className="animate-fade-in">
          <div className="text-center mb-5 flex flex-col items-center">
            <UserAvatar profile={profile || { name: profile?.name || user?.user_metadata?.full_name, avatar_url: user?.user_metadata?.avatar_url }} size={80} />
            <h2 className="font-heading font-bold text-text-primary mt-3">{profile?.name || user?.user_metadata?.full_name || 'User'}</h2>
            <span className="text-xs text-primary-accent font-semibold bg-primary-pale px-3 py-1 rounded-full">Premium Member</span>
          </div>
          <div className="bg-bg-main rounded-2xl p-4 space-y-3 mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('chat.health_profile')}</h3>
            {[
              { label: t('settings.weight'), value: `${profile?.weight || '—'} ${t('common.kg')}` },
              { label: t('onboarding.choose_goal'), value: profile?.goal?.replace('_', ' ') || '—' },
              { label: t('onboarding.health_conditions'), value: profile?.medical_conditions ? (profile.medical_conditions.length > 20 ? profile.medical_conditions.substring(0, 20) + '...' : profile.medical_conditions) : t('common.none') },
              { label: t('onboarding.activity_level'), value: profile?.activity_level || '—' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-xs text-text-muted">{s.label}</span>
                <span className="text-[10px] font-bold text-text-primary capitalize text-right ml-2 leading-tight">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-bg-main rounded-2xl p-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('chat.todays_calories')}</h3>
            <MacroBar label={t('dashboard.completed')} current={Math.round(totalPlannedCal)} target={profile?.calorie_target || 2000} color="#4CAF7D" unit={` ${t('common.kcal')}`} />
            <p className="text-xs text-text-muted mt-2">{Math.round(remainingCal)} {t('common.kcal')} {t('nutrition.calories_remaining')}</p>
          </div>
          {todayMeals.length > 0 && (
            <div className="bg-bg-main rounded-2xl p-4 mt-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('chat.todays_meals')}</h3>
              <div className="space-y-2">
                {todayMeals.map((mealSlot, i) => {
                  const slotCal = Array.isArray(mealSlot.dishes) 
                    ? mealSlot.dishes.reduce((s, d) => s + (d.calories || 0), 0)
                    : (mealSlot.calories || 0)
                  return (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-text-primary font-medium truncate mr-2">{mealSlot.meal || mealSlot.name}</span>
                      <span className="text-text-muted flex-shrink-0">{slotCal} {t('common.kcal')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-bg-card border-b border-gray-100 flex items-center px-5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center ring-2 ring-primary-accent/20">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">{t('chat.title')}</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[10px] text-text-muted">{t('common.online')} · {t('chat.knows_plan')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center flex-shrink-0 ring-2 ring-primary-accent/20 mt-0.5">
                  <Bot size={14} className="text-white" />
                </div>
              )}

              <div className={`max-w-[70%]`}>
                {msg.role === 'user' ? (
                  <div className="bg-primary-accent text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                ) : msg.type === 'emergency' ? (
                  <EmergencyCard
                    symptom={msg.text}
                    profile={profile}
                    user={user}
                    onGenerateSummary={generateDoctorSummary}
                    onDownloadPDF={downloadSummaryPDF}
                    onCopy={copyToClipboard}
                    copied={copied}
                    idx={i}
                    generating={generatingSummary}
                  />
                ) : msg.type === 'health-warning' ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span className="text-sm font-bold text-red-700">🚨 Health Alert</span>
                    </div>
                    <p className="text-sm text-red-800 mb-3">{msg.text}</p>
                    {msg.tips && (
                      <ul className="space-y-1.5">
                        {msg.tips.map((tip, j) => (
                          <li key={j} className="text-xs text-red-700 flex items-start gap-2">
                            <span className="mt-0.5">•</span>{tip}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : msg.type === 'food-check' ? (
                  <div className="bg-primary-pale border border-primary-light/30 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-primary-accent" />
                      <span className="text-sm font-bold text-primary-accent">{t('chat.food_check')}</span>
                    </div>
                    <p className="text-sm text-text-primary mb-3">{msg.text}</p>
                    <MacroBar label={t('common.kcal')} current={msg.total - msg.remaining} target={msg.total} color="#4CAF7D" unit={` ${t('common.kcal')}`} />
                    <p className="text-xs font-semibold text-primary-accent mt-2">{msg.verdictText}</p>
                  </div>
                ) : msg.type === 'doctor-summary' ? (
                  <div className="bg-bg-card border-2 border-red-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-red-500" />
                      <span className="text-sm font-bold text-text-primary">Doctor Summary</span>
                    </div>
                    <p className="text-sm text-text-muted mb-3">{msg.text}</p>
                    <div className="bg-red-50 rounded-xl p-3 space-y-1.5 mb-3 border border-red-100">
                      {typeof msg.summary === 'object' ? (
                        Object.entries(msg.summary).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-text-primary font-medium">{val}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-text-primary whitespace-pre-wrap">{msg.summary}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(typeof msg.summary === 'string' ? msg.summary : Object.entries(msg.summary).map(([k, v]) => `${k}: ${v}`).join('\n'), i)}
                        className="flex items-center gap-2 bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
                      >
                        {copied === i ? <Check size={12} /> : <Copy size={12} />}
                        {copied === i ? 'Copied!' : 'Copy Summary'}
                      </button>
                      <button
                        onClick={() => downloadSummaryPDF(typeof msg.summary === 'string' ? msg.summary : Object.entries(msg.summary).map(([k, v]) => `${k}: ${v}`).join('\n'))}
                        className="flex items-center gap-2 bg-gray-100 text-text-primary text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <Download size={12} />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-bg-card border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center flex-shrink-0 ring-2 ring-primary-accent/20">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-bg-card border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} className="text-xs bg-bg-main border border-gray-200 hover:border-primary-accent/30 text-text-muted px-4 py-2 rounded-xl whitespace-nowrap transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-bg-card border-t border-gray-100 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted hover:text-primary-accent hover:bg-primary-pale transition-all flex-shrink-0"
          >
            <Camera size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-2.5 bg-bg-main rounded-xl text-sm text-text-primary placeholder:text-text-light border border-transparent focus:border-primary-accent/30 focus:ring-2 focus:ring-primary-accent/10 outline-none transition-all"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary-accent flex items-center justify-center text-white hover:bg-primary-accent/90 transition-all shadow-md shadow-primary-accent/20 flex-shrink-0 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Emergency Card Component ──
function EmergencyCard({ symptom, profile, user, onGenerateSummary, onDownloadPDF, onCopy, copied, idx, generating }) {
  const [summary, setSummary] = useState(null)

  const handleGenerate = async () => {
    const result = await onGenerateSummary(symptom)
    setSummary(result)
  }

  return (
    <div className="w-full space-y-3">
      {/* Full-width red emergency card */}
      <div className="bg-red-600 text-white rounded-2xl rounded-tl-sm p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} className="text-white" />
          <span className="text-base font-bold">{t('chat.emergency_title')}</span>
        </div>
        <p className="text-sm text-red-100 mb-4">{t('chat.emergency_subtitle')}</p>
        <ol className="space-y-2 mb-5">
          {[
            t('chat.emergency_step1'),
            t('chat.emergency_step2'),
            t('chat.emergency_step3'),
            t('chat.emergency_step4'),
          ].map((step, j) => (
            <li key={j} className="text-sm text-white flex items-start gap-2">
              <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">{j + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating || summary}
            className="flex items-center gap-2 bg-white text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            <ClipboardList size={14} />
            {generating ? t('common.loading') : summary ? t('progress.ai_report') : t('chat.generate_report')}
          </button>
          <a
            href="tel:140"
            className="flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors"
          >
            <Phone size={14} />
            📞 Call 140
          </a>
        </div>
      </div>

      {/* AI Doctor Summary (shown after generation) */}
      {summary && (
        <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-red-500" />
            <span className="text-sm font-bold text-text-primary">AI-Generated Doctor Summary</span>
            <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">Gemini AI</span>
          </div>
          <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onCopy(summary, idx)}
              className="flex items-center gap-2 bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
            >
              {copied === idx ? <Check size={12} /> : <Copy size={12} />}
              {copied === idx ? 'Copied!' : '📋 Copy Summary'}
            </button>
            <button
              onClick={() => onDownloadPDF(summary)}
              className="flex items-center gap-2 bg-gray-100 text-text-primary text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Download size={12} />
              📄 Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
