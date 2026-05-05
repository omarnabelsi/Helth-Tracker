import { useState, useRef, useEffect } from 'react'
import { Send, Camera, Download, AlertTriangle, CheckCircle, FileText, Bot, User, Sparkles, Copy, Check, Phone, ClipboardList } from 'lucide-react'
import MacroBar from '../components/MacroBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { authFetch } from '../utils/authFetch'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  const { t } = useTranslation();
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [copied, setCopied] = useState(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const chatEndRef = useRef(null)

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
          setMessages(scrubMessages(parsed))
          return
        } catch (e) { console.error('Failed to parse saved chat:', e) }
      }

      try {
        const res = await authFetch(`${API_BASE}/chat/history`)
        if (res.ok) {
          const history = await res.json()
          if (history.length > 0) {
            const mapped = history.map(m => ({ role: m.role === 'assistant' ? 'ai' : 'user', text: m.content, type: 'normal' }))
            setMessages(scrubMessages(mapped))
          } else {
            const name = prof?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there'
            setMessages([{ role: 'ai', type: 'normal', text: `Hi ${name}! 👋 I'm your VitalSense AI health coach. I know your full meal plan, workout schedule, and medical history. Ask me anything about your nutrition, workouts, or health!` }])
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
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])

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
      }])
    }

    setIsTyping(true)
    try {
      const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const todayName = fullDayNames[new Date().getDay()]
      const todayMeals = plan?.weeklyMealPlan?.[todayName] || []
      const totalPlannedCal = todayMeals.reduce((s, m) => s + (m?.calories || 0), 0)

      const systemContext = `You are a personal health coach for this user:
        Name: ${profile?.name || 'User'}, Age: ${profile?.age || '?'}, Gender: ${profile?.gender || '?'},
        Weight: ${profile?.weight || '?'}kg, Height: ${profile?.height || '?'}cm,
        Goal: ${profile?.goal || '?'}, Daily calorie target: ${profile?.calorie_target || 2000} kcal,
        Medical conditions: ${profile?.medical_conditions || 'None'},
        Today's planned meals: ${todayMeals.map(m => `${m.name} (${m.calories} kcal)`).join(', ')},
        Total planned calories today: ${totalPlannedCal} kcal,
        Remaining calorie budget: ${(profile?.calorie_target || 2000) - totalPlannedCal} kcal.
        Answer only based on this user's specific data. Only recommend Lebanese dishes.
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
            remaining: (profile?.calorie_target || 2000) - totalPlannedCal,
            total: profile?.calorie_target || 2000,
            verdict: 'info',
            verdictText: `You have ${(profile?.calorie_target || 2000) - totalPlannedCal} kcal remaining today.`,
          }])
        } else if (!isDanger) {
          setMessages(prev => [...prev, { role: 'ai', type: 'normal', text: data.reply }])
        }
      } else { throw new Error(`Server error: ${response.status}`) }
    } catch (error) {
      console.error('Chat error:', error)
      if (!isDanger) {
        setMessages(prev => [...prev, { role: 'ai', type: 'normal', text: `Error: ${error.message}`, isError: true }])
      }
    } finally { setIsTyping(false) }
  }

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = fullDayNames[new Date().getDay()]
  const todayMeals = plan?.weeklyMealPlan?.[todayName] || []
  const totalPlannedCal = todayMeals.reduce((s, m) => s + (m?.calories || 0), 0)
  const remainingCal = (profile?.calorie_target || 2000) - totalPlannedCal

  return (
    <div className="flex h-full">
      {/* Left Panel — Profile */}
      <div className="w-[300px] bg-bg-card border-r border-gray-100 p-5 overflow-y-auto flex-shrink-0 hidden lg:block">
        <div className="animate-fade-in">
          <div className="text-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-accent to-primary-light mx-auto flex items-center justify-center ring-4 ring-primary-accent/20">
              <span className="text-white text-2xl font-bold">{(profile?.name || 'U')[0]}</span>
            </div>
            <h2 className="font-heading font-bold text-text-primary mt-3">{profile?.name || user?.user_metadata?.full_name || 'User'}</h2>
            <span className="text-xs text-primary-accent font-semibold bg-primary-pale px-3 py-1 rounded-full">Premium Member</span>
          </div>
          <div className="bg-bg-main rounded-2xl p-4 space-y-3 mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('chat.health_profile')}</h3>
            {[
              { label: 'Weight', value: `${profile?.weight || '—'} kg` },
              { label: 'Goal', value: profile?.goal?.replace('_', ' ') || '—' },
              { label: 'Conditions', value: profile?.medical_conditions ? profile.medical_conditions.substring(0, 30) + '...' : 'None' },
              { label: 'Activity', value: profile?.activity_level || '—' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-xs text-text-muted">{s.label}</span>
                <span className="text-xs font-semibold text-text-primary capitalize">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-bg-main rounded-2xl p-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('chat.todays_calories')}</h3>
            <MacroBar label="Consumed" current={totalPlannedCal} target={profile?.calorie_target || 2000} color="#4CAF7D" unit=" kcal" />
            <p className="text-xs text-text-muted mt-2">{remainingCal} kcal remaining</p>
          </div>
          {todayMeals.length > 0 && (
            <div className="bg-bg-main rounded-2xl p-4 mt-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('chat.todays_meals')}</h3>
              <div className="space-y-2">
                {todayMeals.map((meal, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-text-primary font-medium truncate mr-2">{meal.name}</span>
                    <span className="text-text-muted flex-shrink-0">{meal.calories}</span>
                  </div>
                ))}
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
                <span className="text-[10px] text-text-muted">Online · Knows your plan</span>
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
                      <span className="text-sm font-bold text-primary-accent">Food Check</span>
                    </div>
                    <p className="text-sm text-text-primary mb-3">{msg.text}</p>
                    <MacroBar label="Calories" current={msg.total - msg.remaining} target={msg.total} color="#4CAF7D" unit=" kcal" />
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
          <button className="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted hover:text-primary-accent hover:bg-primary-pale transition-all flex-shrink-0">
            <Camera size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your health, meals, or workouts..."
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
        <p className="text-sm text-red-100 mb-4">This sounds serious. Please take action immediately:</p>
        <ol className="space-y-2 mb-5">
          {[
            'Stop all physical activity now',
            'Sit or lie down in a safe position',
            'Call emergency services: 140 (Lebanon Red Cross)',
            'Contact someone nearby for help',
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
            {generating ? 'Generating...' : summary ? 'Summary Ready' : '📋 Generate Doctor Summary'}
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
