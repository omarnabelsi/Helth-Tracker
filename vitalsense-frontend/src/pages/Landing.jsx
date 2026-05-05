import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, BarChart3, Target, Brain, Sparkles,
  Heart, Utensils, Dumbbell, TrendingUp, MessageCircle,
  ChevronRight, Star, ArrowRight, Shield, Zap, Eye,
  Menu, X, User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

const foods = [
  { name: 'Manakish', cal: '350 kcal', desc: 'Zaatar flatbread', emoji: '🫓' },
  { name: 'Fattoush', cal: '180 kcal', desc: 'Fresh herb salad', emoji: '🥗' },
  { name: 'Hummus', cal: '220 kcal', desc: 'Chickpea dip', emoji: '🫘' },
  { name: 'Shawarma', cal: '480 kcal', desc: 'Grilled chicken wrap', emoji: '🌯' },
  { name: 'Labneh', cal: '150 kcal', desc: 'Strained yogurt', emoji: '🥛' },
  { name: 'Tabbouleh', cal: '120 kcal', desc: 'Parsley & bulgur', emoji: '🥬' },
]

const steps = [
  { icon: BarChart3, title: 'Enter Stats', desc: 'Age, weight, height' },
  { icon: Target, title: 'Choose Goal', desc: 'Fat loss, muscle, health' },
  { icon: Brain, title: 'AI Analysis', desc: '3 models analyze you' },
  { icon: Sparkles, title: 'Get Your Plan', desc: 'Diet + workout ready' },
]

const features = [
  { icon: Utensils, title: 'Smart Meal Plans', desc: 'Lebanese food-aware AI generates weekly meal plans tailored to your culture and macros.' },
  { icon: Dumbbell, title: 'Adaptive Workouts', desc: 'Exercises adjusted for your medical conditions and fitness level in real-time.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'AI-powered body analysis tracks your transformation with visual progress reports.' },
  { icon: MessageCircle, title: 'Health Chat', desc: 'Ask anything — from meal swaps to symptom checks — your AI coach is always available.' },
]

const aiModels = [
  { icon: Eye, title: 'Vision AI', desc: 'Analyzes your selfie to estimate body composition, posture, and physical metrics using computer vision.', color: 'from-blue-500 to-cyan-400' },
  { icon: Zap, title: 'Recommendation Engine', desc: 'Creates personalized diet and workout plans by cross-referencing your data with 10,000+ nutritional profiles.', color: 'from-primary-accent to-primary-light' },
  { icon: MessageCircle, title: 'Chat Assistant', desc: 'Natural language health coach powered by Gemini AI — understands context, medical history, and Lebanese cuisine.', color: 'from-purple-500 to-pink-400' },
]

export default function Landing() {
  const { t } = useTranslation();
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-bg-main">
      {/* ===== Navbar ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-primary-dark/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-accent flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
              </svg>
            </div>
            <span className="font-heading font-bold text-white text-lg">VitalSense AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-white/70 hover:text-white text-sm transition-colors">How it Works</a>
            <a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">Features</a>
            <a href="#foods" className="text-white/70 hover:text-white text-sm transition-colors">Lebanese Foods</a>
            {!user && (
              <Link to="/login" className="text-white/70 hover:text-white text-sm transition-colors">{t('auth.login')}</Link>
            )}
            <Link 
              to={user ? "/dashboard" : "/onboarding"} 
              className="bg-primary-accent hover:bg-primary-accent/90 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-accent/25"
            >
              {user ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-primary-dark/98 backdrop-blur-md border-t border-white/10 px-6 py-4 space-y-3">
            <a href="#how" className="block text-white/70 text-sm py-2">How it Works</a>
            <a href="#features" className="block text-white/70 text-sm py-2">Features</a>
            <Link 
              to={user ? "/dashboard" : "/onboarding"} 
              className="block bg-primary-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl text-center mt-2"
            >
              {user ? "Dashboard" : "Get Started"}
            </Link>
            {!user && (
              <Link to="/login" className="block text-white/70 text-sm py-2 text-center">{t('auth.login')}</Link>
            )}
          </div>
        )}
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative bg-primary-dark min-h-[92vh] flex items-center overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-light/8 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-accent/5 rounded-full blur-3xl"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full mb-6">
              <Sparkles size={14} className="text-primary-light" />
              <span className="text-primary-light text-xs font-semibold">Powered by 3 AI Models</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6">
              Your Personal
              <br />
              <span className="bg-gradient-to-r from-primary-light to-primary-lighter bg-clip-text text-transparent">
                AI Health Coach
              </span>
              <br />
              <span className="text-3xl lg:text-4xl font-bold text-white/70">
                — Built for Lebanon
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-lg mb-8">
              Smart nutrition tracking with Lebanese food recognition, AI-powered workouts adapted for your medical conditions, and a personal health assistant that speaks your language.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={user ? "/dashboard" : "/onboarding"}
                className="group bg-primary-accent hover:bg-primary-light text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary-accent/30 flex items-center gap-2"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how"
                className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-300 backdrop-blur"
              >
                See How It Works
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10">
              <div className="flex -space-x-2">
                {[...'ABCD'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-accent to-primary-light border-2 border-primary-dark flex items-center justify-center text-white text-xs font-bold">
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/50 text-xs">Trusted by 2,000+ users in Lebanon</p>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden lg:block relative animate-fade-in delay-300">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Phone mockup */}
              <div className="absolute inset-8 bg-gradient-to-br from-primary-dark to-[#0f2b1f] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/10 rounded-full"></div>
                <div className="p-6 pt-10">
                  <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur">
                    <div className="text-white/50 text-[10px] mb-1">Daily Progress</div>
                    <div className="text-white text-xl font-bold font-heading">78%</div>
                    <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-primary-accent to-primary-light rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/8 rounded-xl p-3 backdrop-blur">
                      <div className="text-primary-light text-lg font-bold">1,650</div>
                      <div className="text-white/40 text-[10px]">{t('dashboard.calories')}</div>
                    </div>
                    <div className="bg-white/8 rounded-xl p-3 backdrop-blur">
                      <div className="text-primary-light text-lg font-bold">125g</div>
                      <div className="text-white/40 text-[10px]">{t('dashboard.protein')}</div>
                    </div>
                    <div className="bg-white/8 rounded-xl p-3 backdrop-blur">
                      <div className="text-primary-light text-lg font-bold">45min</div>
                      <div className="text-white/40 text-[10px]">Workout</div>
                    </div>
                    <div className="bg-white/8 rounded-xl p-3 backdrop-blur">
                      <div className="text-primary-light text-lg font-bold">7.5h</div>
                      <div className="text-white/40 text-[10px]">{t('dashboard.sleep')}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -top-2 -right-2 bg-bg-card rounded-2xl shadow-xl p-3 animate-float border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <Heart size={14} className="text-primary-accent" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-primary">Heart Rate</div>
                    <div className="text-[10px] text-text-muted">72 bpm — Normal</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -left-2 bg-bg-card rounded-2xl shadow-xl p-3 animate-float delay-500 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <div>
                    <div className="text-xs font-bold text-text-primary">18 Day Streak</div>
                    <div className="text-[10px] text-text-muted">Keep it going!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80V40C240 65 480 20 720 40C960 60 1200 15 1440 40V80H0Z" fill="#F5F7F4"/>
          </svg>
        </div>
      </section>

      {/* ===== How it Works ===== */}
      <section id="how" className="py-24 bg-bg-main">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">How it Works</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              4 Steps to Your Healthier Self
            </h2>
            <p className="text-text-muted mt-3 max-w-lg mx-auto">
              Our AI analyzes your unique body, preferences, and medical conditions to create the perfect plan.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-bg-card rounded-2xl p-6 text-center border border-gray-100 hover:border-primary-accent/30 hover:shadow-lg hover:shadow-primary-accent/5 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-accent/20 group-hover:scale-110 transition-transform">
                    <step.icon size={22} className="text-white" />
                  </div>
                  <div className="text-xs text-primary-accent font-bold mb-1">Step {i + 1}</div>
                  <h3 className="font-heading font-bold text-text-primary mb-1">{step.title}</h3>
                  <p className="text-xs text-text-muted">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight size={20} className="absolute top-1/2 -right-3 -translate-y-1/2 text-primary-light hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3 AI Models ===== */}
      <section className="py-24 bg-bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">AI Technology</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              3 AI Models Working For You
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {aiModels.map((model, i) => (
              <div key={i} className="group relative bg-bg-main rounded-2xl p-8 border border-gray-100 hover:border-primary-accent/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-accent/5 to-transparent rounded-bl-full"></div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${model.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <model.icon size={22} className="text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">{model.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{model.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section id="features" className="py-24 bg-bg-main">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              Everything You Need
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-bg-card rounded-2xl p-6 border border-gray-100 hover:border-primary-accent/20 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary-pale flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={20} className="text-primary-accent" />
                </div>
                <h3 className="font-heading font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Lebanese Foods ===== */}
      <section id="foods" className="py-24 bg-bg-card overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">Lebanese Cuisine</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              We Know Your Food
            </h2>
            <p className="text-text-muted mt-3">AI-powered calorie tracking for authentic Lebanese dishes</p>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {foods.map((food, i) => (
              <div key={i} className="min-w-[200px] snap-center bg-bg-main rounded-2xl p-5 border border-gray-100 hover:border-primary-accent/30 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 flex-shrink-0">
                <div className="text-4xl mb-3">{food.emoji}</div>
                <h3 className="font-heading font-bold text-text-primary">{food.name}</h3>
                <p className="text-xs text-text-muted mb-2">{food.desc}</p>
                <span className="inline-block text-xs font-bold text-primary-accent bg-primary-pale px-3 py-1 rounded-full">
                  {food.cal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 bg-primary-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-64 h-64 bg-primary-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-primary-light/8 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-6">
            Start Your Health Journey Today
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Join thousands in Lebanon who are transforming their health with AI-powered coaching.
          </p>
          <Link
            to={user ? "/dashboard" : "/onboarding"}
            className="inline-flex items-center gap-2 bg-primary-accent hover:bg-primary-light text-white font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary-accent/30 text-lg group"
          >
            {user ? "Go to Dashboard" : "Get Started Free"}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-primary-dark border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-accent flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-white">VitalSense AI</span>
            </div>
            <p className="text-white/40 text-sm">Your AI-powered health companion for a better life.</p>
            <div className="flex gap-6">
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Privacy</a>
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Terms</a>
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/30 text-xs">© 2026 VitalSense AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
