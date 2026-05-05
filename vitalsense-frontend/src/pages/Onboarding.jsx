import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { VitaBot } from '../components/VitaBot'
import { SpeechBubble } from '../components/SpeechBubble'

const Onboarding = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', gender: '', age: '', weight: '',
    height: '', activity: '', goal: '',
    weeklyLoss: '', conditions: '', gym: '', equipment: []
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const nextStep = () => {
    // After gym step (step index 5), if gym is not 'home', go to equipment step
    // If gym is 'home', skip equipment step and go straight to analyzing
    if (step === 5 && form.gym === 'home') {
      setStep(7) // Skip equipment step — go to analyzing
    } else {
      setStep(s => s + 1)
    }
    setAnimKey(k => k + 1)
  }

  // TDEE calculation
  const calculateTDEE = () => {
    const w = parseFloat(form.weight)
    const h = parseFloat(form.height)
    const a = parseInt(form.age)
    const bmr = form.gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161
    const multipliers = { Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725 }
    return Math.round(bmr * (multipliers[form.activity] || 1.2))
  }

  const calculateTarget = (tdee) => {
    if (form.goal === 'lose_fat') {
      const deficits = { '0.25kg': 275, '0.5kg': 550, '1kg': 1100 }
      return tdee - (deficits[form.weeklyLoss] || 550)
    }
    if (form.goal === 'build_muscle') return tdee + 300
    return tdee
  }

  // CRITICAL: Complete onboarding and navigate to dashboard
  const completeOnboarding = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return; }

      const tdee = calculateTDEE()
      const calorieTarget = calculateTarget(tdee)

      // Save to Supabase — upsert in case profile already exists
      const profileData = {
        user_id: session.user.id,
        name: form.name || 'User',
        age: parseInt(form.age),
        gender: form.gender,
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        activity_level: form.activity,
        goal: form.goal,
        weekly_loss_target: form.weeklyLoss ? parseFloat(form.weeklyLoss) : null,
        medical_conditions: form.conditions || 'None',
        gym_type: form.gym,
        tdee: tdee,
        calorie_target: calorieTarget,
        onboarding_complete: true
      }

      let { error } = await supabase.from('profiles').upsert({
        ...profileData,
        available_equipment: form.equipment || []
      }, { onConflict: 'user_id' })

      // Fallback if available_equipment column doesn't exist yet (400 Bad Request)
      if (error) {
        console.warn('First upsert failed, likely due to missing available_equipment column. Retrying without it...');
        const { error: fallbackError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
        error = fallbackError;
      }

      if (error) {
        console.error('Onboarding save error:', error)
        toast.error('Failed to save profile. Please check console.')
        setLoading(false)
        return
      }

      // Call generate-plan in background
      const token = session.access_token
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      fetch(`${apiUrl}/api/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          age: form.age, gender: form.gender, weight: form.weight, 
          height: form.height, tdee, calorie_target: calorieTarget, 
          goal: form.goal, weekly_loss_target: form.weeklyLoss, 
          medical_conditions: form.conditions || 'None', 
          activity_level: form.activity, gym_type: form.gym,
          available_equipment: form.equipment || []
        })
      }).catch(e => console.error('Plan gen error:', e))

      // Navigate to dashboard — use replace so back button doesn't return to onboarding
      navigate('/dashboard', { replace: true })

    } catch (err) {
      console.error('Complete onboarding error:', err)
      setLoading(false)
    }
  }

  const steps = [
    { prog: 0, bubble: "Hi! I'm VitaBot — your AI health coach. I'll build your perfect plan in 60 seconds!" },
    { prog: 15, bubble: "First things first — what should I call you?" },
    { prog: 30, bubble: "Let me learn about your body to calculate your exact calorie needs!" },
    { prog: 45, bubble: "What's your main goal? I'll build everything around this!" },
    { prog: 60, bubble: "Any health conditions or injuries? This keeps your plan safe!" },
    { prog: 75, bubble: "Where do you train? This shapes your entire workout program!" },
    { prog: 78, bubble: form.gym === 'small_gym' ? "What equipment do you have access to? I'll only give you exercises you can actually do!" : "Your gym sounds well-equipped! Check everything available so I can build the perfect program!" },
    { prog: 88, bubble: "Running my AI engines... building your perfect personalized plan!" },
    { prog: 100, bubble: `Plan ready${form.name ? ', ' + form.name : ''}! Let's crush those goals! 🤖💪` }
  ]

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Progress bar */}
        {step > 0 && (
          <div className="onboarding-progress">
            <div className="onboarding-progress-fill" style={{ width: `${steps[step]?.prog || 0}%` }}/>
          </div>
        )}

        {/* Mascot row */}
        <div className="mascot-row">
          <div key={`bot-${animKey}`} style={{ animation: 'vitabotEntrance 0.5s ease-out forwards, vitabotBounce 2.5s ease-in-out 0.5s infinite', flexShrink: 0 }}>
            <VitaBot size={90}/>
          </div>
          <SpeechBubble key={`bubble-${step}`} text={steps[step]?.bubble || ''} />
        </div>

        {/* Step content */}
        <div key={`step-${step}`} style={{ animation: 'cardIn 0.45s cubic-bezier(0.34, 1.2, 0.64, 1) forwards' }}>
          {step === 0 && <WelcomeStep onNext={nextStep}/>}
          {step === 1 && <NameStep form={form} update={update} onNext={nextStep}/>}
          {step === 2 && <StatsStep form={form} update={update} onNext={nextStep}/>}
          {step === 3 && <GoalStep form={form} update={update} onNext={nextStep}/>}
          {step === 4 && <ConditionsStep form={form} update={update} onNext={nextStep}/>}
          {step === 5 && <GymStep form={form} update={update} onNext={nextStep}/>}
          {step === 6 && form.gym !== 'home' && <EquipmentStep form={form} update={update} onNext={nextStep}/>}
          {step === 7 && <AnalyzingStep onDone={nextStep}/>}
          {step === 8 && <SuccessStep form={form} onDone={completeOnboarding} loading={loading}/>}
        </div>
      </div>

      <style>{`
        /* Full page */
        .onboarding-page {
          background: radial-gradient(ellipse at top, #0d2818 0%, #0A1209 60%, #050d07 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 32px 20px;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }
        
        .onboarding-container {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        /* Progress bar — glowing green */
        .onboarding-progress {
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
        }
        .onboarding-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2E7D52, #4CAF7D, #81C784);
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px rgba(76, 175, 125, 0.6);
        }
        
        /* Mascot row */
        .mascot-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 0 4px;
        }
        
        /* Speech bubble — premium glass */
        .speech-bubble {
          background: rgba(46, 125, 82, 0.15);
          border: 1px solid rgba(76, 175, 125, 0.35);
          border-radius: 20px 20px 20px 6px;
          padding: 14px 18px;
          backdrop-filter: blur(12px);
          max-width: 260px;
          animation: bubbleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .speech-bubble p {
          color: #E8F5E9;
          font-size: 15px;
          line-height: 1.55;
          font-weight: 500;
          margin: 0;
        }
        
        /* Main card */
        .onboarding-card {
          background: rgba(27, 58, 45, 0.4);
          border: 1px solid rgba(76, 175, 125, 0.2);
          border-radius: 24px;
          padding: 28px 24px;
          backdrop-filter: blur(20px);
          animation: cardIn 0.45s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        
        /* Card title */
        .card-title {
          color: #FFFFFF;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }
        .card-subtitle {
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          margin: 0 0 20px 0;
        }
        
        /* Text input */
        .onboarding-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(76, 175, 125, 0.3);
          border-radius: 14px;
          padding: 16px 18px;
          color: white;
          font-size: 16px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .onboarding-input:focus {
          border-color: #4CAF7D;
          background: rgba(76, 175, 125, 0.08);
        }
        .onboarding-input::placeholder { color: rgba(255,255,255,0.25); }
        
        /* Option card — for goal/gym selection */
        .option-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .option-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(46,125,82,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .option-card:hover {
          border-color: rgba(76, 175, 125, 0.4);
          background: rgba(76, 175, 125, 0.06);
          transform: translateY(-1px);
        }
        .option-card.selected {
          border-color: #4CAF7D;
          background: rgba(76, 175, 125, 0.14);
          box-shadow: 0 0 0 1px rgba(76, 175, 125, 0.3), 0 4px 20px rgba(46, 125, 82, 0.2);
        }
        .option-card.selected::before { opacity: 1; }
        .option-icon {
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.06);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .option-card.selected .option-icon {
          background: rgba(76, 175, 125, 0.2);
        }
        .option-title {
          color: white;
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 3px 0;
        }
        .option-desc {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          margin: 0;
        }
        .option-check {
          margin-left: auto;
          width: 22px;
          height: 22px;
          background: #4CAF7D;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          flex-shrink: 0;
          animation: checkPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        /* Gender / activity toggle pills */
        .pill-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .pill {
          flex: 1;
          padding: 13px 8px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pill:hover { border-color: rgba(76, 175, 125, 0.3); color: white; }
        .pill.selected {
          background: rgba(76, 175, 125, 0.18);
          border-color: #4CAF7D;
          color: white;
          box-shadow: 0 0 12px rgba(76, 175, 125, 0.2);
        }
        
        /* Number inputs row */
        .number-grid { display: flex; gap: 10px; margin-bottom: 16px; }
        .number-field { flex: 1; text-align: center; }
        .number-label {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .number-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(76, 175, 125, 0.25);
          border-radius: 12px;
          padding: 14px 4px;
          color: white;
          font-size: 22px;
          font-weight: 800;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
        }
        .number-input:focus { border-color: #4CAF7D; }
        
        /* Hide arrows for number inputs */
        .number-input::-webkit-outer-spin-button,
        .number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .number-input[type=number] {
          -moz-appearance: textfield;
        }
        
        /* Textarea */
        .onboarding-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(76, 175, 125, 0.3);
          border-radius: 14px;
          padding: 14px 16px;
          color: white;
          font-size: 14px;
          outline: none;
          resize: none;
          line-height: 1.6;
          font-family: inherit;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .onboarding-textarea:focus { border-color: #4CAF7D; }
        .onboarding-textarea::placeholder { color: rgba(255,255,255,0.25); }
        
        /* Quick-add chips */
        .chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .chip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(76, 175, 125, 0.25);
          border-radius: 20px;
          padding: 7px 14px;
          color: rgba(255,255,255,0.65);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .chip:hover {
          background: rgba(76, 175, 125, 0.12);
          border-color: #4CAF7D;
          color: white;
        }
        
        /* Primary CTA button */
        .btn-primary {
          width: 100%;
          padding: 17px;
          background: linear-gradient(135deg, #2E7D52, #3a9d6a);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(46, 125, 82, 0.35);
          margin-top: 8px;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #3a9d6a, #4CAF7D);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(46, 125, 82, 0.45);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.25);
          box-shadow: none;
          transform: none;
          cursor: not-allowed;
        }
        
        /* Secondary skip button */
        .btn-secondary {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          border-color: rgba(76, 175, 125, 0.3);
          color: rgba(255,255,255,0.7);
        }
        
        /* Weekly loss selector */
        .loss-selector {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(76, 175, 125, 0.15);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .loss-label {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .loss-options { display: flex; gap: 8px; }
        .loss-opt {
          flex: 1;
          padding: 12px 4px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .loss-opt.selected {
          background: rgba(76, 175, 125, 0.16);
          border-color: #4CAF7D;
        }
        .loss-opt-val { color: white; font-size: 14px; font-weight: 700; }
        .loss-opt-kcal { color: rgba(255,255,255,0.4); font-size: 10px; margin-top: 2px; }
        
        /* Calorie target live preview */
        .calorie-preview {
          background: rgba(76, 175, 125, 0.08);
          border: 1px solid rgba(76, 175, 125, 0.25);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .calorie-preview-label { color: rgba(255,255,255,0.5); font-size: 13px; }
        .calorie-preview-val { color: #4CAF7D; font-size: 20px; font-weight: 800; }
        
        /* Analyzing bars */
        .analyze-bar-wrap {
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          height: 8px;
          overflow: hidden;
          margin-top: 8px;
        }
        .analyze-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #2E7D52, #4CAF7D);
          border-radius: 6px;
          transition: width 1.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 8px rgba(76, 175, 125, 0.5);
        }
        
        /* Success stat cards */
        .success-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        .success-stat {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(76,175,125,0.15);
          border-radius: 14px;
          padding: 14px 8px;
          text-align: center;
        }
        .success-stat-val { color: #4CAF7D; font-size: 22px; font-weight: 800; }
        .success-stat-lbl { color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 4px; }
        
        /* Equipment checkbox grid */
        .equipment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }
        .equipment-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .equipment-item.checked {
          background: rgba(76, 175, 125, 0.12);
          border-color: #4CAF7D;
        }
        .equipment-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .equipment-item.checked .equipment-checkbox {
          background: #4CAF7D;
          border-color: #4CAF7D;
          color: white;
          font-size: 11px;
        }
        .equipment-label { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; }
        .equipment-item.checked .equipment-label { color: white; }
        
        /* Animations */
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateX(-16px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes checkPop {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes vitabotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes vitabotEntrance {
          from { opacity: 0; transform: scale(0.5) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes eyeGlow {
          0%, 100% { opacity: 1; r: 7; }
          50% { opacity: 0.4; }
        }
        @keyframes antennaGlow {
          0%, 100% { fill: #4CAF7D; filter: drop-shadow(0 0 4px #4CAF7D); }
          50% { fill: #2E7D52; filter: none; }
        }
      `}</style>
    </div>
  )
}

const WelcomeStep = ({onNext}) => (
  <div className="onboarding-card">
    <div style={{textAlign:'center',padding:'8px 0'}}>
      <div style={{color:'#4CAF7D',fontSize:'12px',fontWeight:'600',letterSpacing:'1px',marginBottom:'8px'}}>VITALSENSE AI</div>
      <h2 className="card-title">Your AI Health Coach<br/>Built for Lebanon 🇱🇧</h2>
      <p className="card-subtitle" style={{marginBottom:'24px', lineHeight: '1.6'}}>I'll ask you a few quick questions and build a fully personalized nutrition and workout plan — powered by AI.</p>
      <button className="btn-primary" onClick={onNext}>SOUNDS GOOD! 🤖</button>
    </div>
  </div>
)

const NameStep = ({form,update,onNext}) => (
  <div className="onboarding-card">
    <h3 className="card-title">What's your name?</h3>
    <p className="card-subtitle">You can change this later in settings</p>
    <input className="onboarding-input" placeholder="Enter your name" value={form.name} onChange={e=>update('name',e.target.value)} style={{marginBottom:'16px'}}/>
    <button className="btn-primary" onClick={onNext} disabled={!form.name.trim()}>Continue →</button>
    <button className="btn-secondary" onClick={()=>{update('name','User');onNext()}}>Skip for now</button>
  </div>
)

const StatsStep = ({form,update,onNext}) => (
  <div className="onboarding-card">
    <h3 className="card-title" style={{marginBottom:'16px'}}>Basic Stats</h3>
    <div className="pill-row">
      {['male','female'].map(g=>
        <div key={g} onClick={()=>update('gender',g)} className={`pill ${form.gender===g?'selected':''}`}>
          {g==='male'?'👨 Male':'👩 Female'}
        </div>
      )}
    </div>
    <div className="number-grid">
      {[{f:'age',l:'Age',p:'25'},{f:'weight',l:'Weight (kg)',p:'75'},{f:'height',l:'Height (cm)',p:'175'}].map(({f,l,p})=>(
        <div key={f} className="number-field">
          <div className="number-label">{l}</div>
          <input type="number" className="number-input" placeholder={p} value={form[f]} onChange={e=>update(f,e.target.value)} />
        </div>
      ))}
    </div>
    <div className="number-label" style={{marginBottom:'8px'}}>Activity Level</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px'}}>
      {['Sedentary','Light','Moderate','Active'].map(a=>
        <div key={a} onClick={()=>update('activity',a)} className={`pill ${form.activity===a?'selected':''}`} style={{padding:'10px'}}>
          {a}
        </div>
      )}
    </div>
    <button className="btn-primary" onClick={onNext} disabled={!form.gender||!form.age||!form.weight||!form.height||!form.activity}>Continue →</button>
  </div>
)

const GoalStep = ({form,update,onNext}) => (
  <div className="onboarding-card">
    <h3 className="card-title" style={{marginBottom:'16px'}}>Choose Your Goal</h3>
    {[{id:'lose_fat',icon:'🔥',t:'Lose Fat',d:'Burn calories, reduce body fat'},{id:'build_muscle',icon:'💪',t:'Build Muscle',d:'Gain strength and mass'},{id:'improve_health',icon:'❤️',t:'Improve Health',d:'General wellness and fitness'}].map(g=>(
      <div key={g.id} onClick={()=>update('goal',g.id)} className={`option-card ${form.goal===g.id?'selected':''}`}>
        <div className="option-icon">{g.icon}</div>
        <div style={{flex:1}}>
          <div className="option-title">{g.t}</div>
          <div className="option-desc">{g.d}</div>
        </div>
        {form.goal===g.id&&<div className="option-check">✓</div>}
      </div>
    ))}
    {form.goal==='lose_fat'&&(
      <div className="loss-selector">
        <div className="loss-label">Weekly loss target:</div>
        <div className="loss-options">
          {[{v:'0.25kg',k:'-275 kcal'},{v:'0.5kg',k:'-550 kcal'},{v:'1kg',k:'-1100 kcal'}].map(w=>(
            <div key={w.v} onClick={()=>update('weeklyLoss',w.v)} className={`loss-opt ${form.weeklyLoss===w.v?'selected':''}`}>
              <div className="loss-opt-val">{w.v}</div>
              <div className="loss-opt-kcal">{w.k}</div>
            </div>
          ))}
        </div>
      </div>
    )}
    <button className="btn-primary" onClick={onNext} disabled={!form.goal}>Continue →</button>
  </div>
)

const ConditionsStep = ({form,update,onNext}) => (
  <div className="onboarding-card">
    <h3 className="card-title">Health Conditions</h3>
    <p className="card-subtitle">Type any illnesses, injuries, or medications</p>
    <textarea className="onboarding-textarea" value={form.conditions} onChange={e=>update('conditions',e.target.value)} placeholder="E.g. knee injury, Type 2 diabetes, high blood pressure..." rows={3} style={{marginBottom:'12px'}}/>
    <div className="chips-wrap">
      {['No conditions','Heart disease','Diabetes','Joint pain','Back pain','High blood pressure','Asthma','Knee injury'].map(c=>(
        <div key={c} onClick={()=>update('conditions',c==='No conditions'?'None':(form.conditions?form.conditions+', '+c:c))} className="chip">
          {c}
        </div>
      ))}
    </div>
    <button className="btn-primary" onClick={onNext}>Continue →</button>
    <button className="btn-secondary" onClick={()=>{update('conditions','None');onNext()}}>Skip — No conditions</button>
  </div>
)

const GymStep = ({form,update,onNext}) => (
  <div className="onboarding-card">
    <h3 className="card-title" style={{marginBottom:'16px'}}>Where do you train?</h3>
    {[{id:'home',icon:'🏠',t:'At Home',d:'Bodyweight or minimal equipment'},{id:'small_gym',icon:'🏋️',t:'Small Gym',d:'Dumbbells, basic machines'},{id:'big_gym',icon:'💪',t:'Full Gym',d:'All machines, cables, full equipment'}].map(g=>(
      <div key={g.id} onClick={()=>update('gym',g.id)} className={`option-card ${form.gym===g.id?'selected':''}`}>
        <div className="option-icon">{g.icon}</div>
        <div style={{flex:1}}>
          <div className="option-title">{g.t}</div>
          <div className="option-desc">{g.d}</div>
        </div>
        {form.gym===g.id&&<div className="option-check">✓</div>}
      </div>
    ))}
    <button className="btn-primary" onClick={onNext} disabled={!form.gym} style={{marginTop:'6px'}}>Continue →</button>
  </div>
)

const EquipmentStep = ({ form, update, onNext }) => {
  const allEquipment = {
    small_gym: [
      { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
      { id: 'barbell', label: 'Barbell + Plates', icon: '⚖️' },
      { id: 'bench', label: 'Bench', icon: '🛏️' },
      { id: 'pull_up_bar', label: 'Pull-up Bar', icon: '🔝' },
      { id: 'resistance_bands', label: 'Resistance Bands', icon: '🔁' },
      { id: 'treadmill', label: 'Treadmill', icon: '🏃' },
      { id: 'stationary_bike', label: 'Stationary Bike', icon: '🚴' },
      { id: 'kettlebell', label: 'Kettlebells', icon: '🔔' },
    ],
    big_gym: [
      { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
      { id: 'barbell', label: 'Barbell + Rack', icon: '⚖️' },
      { id: 'bench', label: 'Bench Press', icon: '🛏️' },
      { id: 'cables', label: 'Cable Machine', icon: '🔗' },
      { id: 'lat_pulldown', label: 'Lat Pulldown', icon: '⬇️' },
      { id: 'leg_press', label: 'Leg Press', icon: '🦵' },
      { id: 'smith_machine', label: 'Smith Machine', icon: '🏗️' },
      { id: 'treadmill', label: 'Treadmill', icon: '🏃' },
      { id: 'rowing_machine', label: 'Rowing Machine', icon: '🚣' },
      { id: 'stairmaster', label: 'StairMaster', icon: '🪜' },
      { id: 'pull_up_bar', label: 'Pull-up Bar', icon: '🔝' },
      { id: 'resistance_bands', label: 'Resistance Bands', icon: '🔁' },
    ]
  }

  const equipment = allEquipment[form.gym] || allEquipment['small_gym']
  const selected = form.equipment || []

  const toggle = (id) => {
    const current = form.equipment || []
    const updated = current.includes(id)
      ? current.filter(e => e !== id)
      : [...current, id]
    update('equipment', updated)
  }

  const selectAll = () => update('equipment', equipment.map(e => e.id))

  return (
    <div className="onboarding-card">
      <h2 className="card-title">What equipment do you have?</h2>
      <p className="card-subtitle">Select everything available to you — your workouts will be built around these</p>

      {/* Select all shortcut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
          {selected.length} of {equipment.length} selected
        </span>
        <button onClick={selectAll} style={{ background: 'none', border: '1px solid rgba(76,175,125,0.3)', borderRadius: '8px', padding: '5px 12px', color: '#4CAF7D', fontSize: '12px', cursor: 'pointer' }}>
          Select All
        </button>
      </div>

      <div className="equipment-grid">
        {equipment.map(eq => (
          <div
            key={eq.id}
            className={`equipment-item ${selected.includes(eq.id) ? 'checked' : ''}`}
            onClick={() => toggle(eq.id)}
          >
            <div className="equipment-checkbox">
              {selected.includes(eq.id) && '✓'}
            </div>
            <span style={{ fontSize: '16px' }}>{eq.icon}</span>
            <span className="equipment-label">{eq.label}</span>
          </div>
        ))}
      </div>

      {/* None available option */}
      <div
        className={`equipment-item ${selected.length === 0 ? 'checked' : ''}`}
        onClick={() => update('equipment', [])}
        style={{ marginBottom: '20px', gridColumn: 'span 2' }}
      >
        <div className="equipment-checkbox">{selected.length === 0 && '✓'}</div>
        <span style={{ fontSize: '16px' }}>🤷</span>
        <span className="equipment-label">Not sure / Basic only</span>
      </div>

      <button className="btn-primary" onClick={onNext} disabled={selected.length === 0}>
        Continue →
      </button>
      <button className="btn-secondary" onClick={() => { update('equipment', []); onNext(); }}>
        Skip — I'll train with what's available
      </button>
    </div>
  )
}

const AnalyzingStep = ({onDone}) => {
  useEffect(()=>{
    const t1=setTimeout(()=>document.getElementById('b1')?.style&&(document.getElementById('b1').style.width='100%'),300)
    const t2=setTimeout(()=>document.getElementById('b2')?.style&&(document.getElementById('b2').style.width='100%'),1000)
    const t3=setTimeout(()=>document.getElementById('b3')?.style&&(document.getElementById('b3').style.width='100%'),1800)
    const t4=setTimeout(onDone,2800)
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4)}
  },[])
  return (
    <div className="onboarding-card">
      <div style={{textAlign:'center',marginBottom:'20px'}}>
        <div className="card-title" style={{fontSize:'18px'}}>Analyzing your profile...</div>
        <div className="card-subtitle" style={{marginTop:'4px', marginBottom: 0}}>3 AI models working for you</div>
      </div>
      {[{id:'b1',l:'📊 Calculating your TDEE & macros'},{id:'b2',l:'🍽️ Building your Lebanese meal plan'},{id:'b3',l:'💪 Creating your workout program'}].map(b=>(
        <div key={b.id} style={{marginBottom:'16px'}}>
          <div className="option-desc" style={{marginBottom:'8px'}}>{b.l}</div>
          <div className="analyze-bar-wrap">
            <div id={b.id} className="analyze-bar"/>
          </div>
        </div>
      ))}
    </div>
  )
}

const SuccessStep = ({form,onDone,loading}) => (
  <div className="onboarding-card" style={{textAlign:'center'}}>
    <div style={{fontSize:'48px',marginBottom:'12px'}}>🎉</div>
    <h3 className="card-title" style={{fontSize:'20px'}}>Your Plan is Ready{form.name&&form.name!=='User'?`, ${form.name}`:''}!</h3>
    <p className="card-subtitle" style={{lineHeight:1.6}}>VitaBot has built your fully personalized plan. Time to crush those goals!</p>
    <div className="success-stats">
      {[{v:'7',l:'Day meal plan'},{v:'6',l:'Workouts/week'},{v:'AI',l:'Personalized'}].map(s=>(
        <div key={s.l} className="success-stat">
          <div className="success-stat-val">{s.v}</div>
          <div className="success-stat-lbl">{s.l}</div>
        </div>
      ))}
    </div>
    <button className="btn-primary" onClick={onDone} disabled={loading}>{loading?'Setting up...':'Go to Dashboard →'}</button>
  </div>
)

export default Onboarding
