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

const steps = [
  { icon: BarChart3, title: 'step_1_title', desc: 'step_1_desc' },
  { icon: Target, title: 'step_2_title', desc: 'step_2_desc' },
  { icon: Brain, title: 'step_3_title', desc: 'step_3_desc' },
  { icon: Sparkles, title: 'step_4_title', desc: 'step_4_desc' },
]

const features = [
  { icon: Utensils, title: 'meal_plans_title', desc: 'meal_plans_desc' },
  { icon: Dumbbell, title: 'adaptive_workouts_title', desc: 'adaptive_workouts_desc' },
  { icon: TrendingUp, title: 'progress_tracking_title', desc: 'progress_tracking_desc' },
  { icon: MessageCircle, title: 'health_chat_title', desc: 'health_chat_desc' },
]

const aiModels = [
  { icon: Eye, title: 'vision_title', desc: 'vision_desc', color: 'from-blue-500 to-cyan-400' },
  { icon: Zap, title: 'recommendation_title', desc: 'recommendation_desc', color: 'from-primary-accent to-primary-light' },
  { icon: MessageCircle, title: 'chat_assistant_title', desc: 'chat_assistant_desc', color: 'from-purple-500 to-pink-400' },
]

export default function Landing() {
  const { t } = useTranslation();
  
  const foods = [
    { name: t('lebanese_foods.manakish'), cal: `350 ${t('common.kcal')}`, desc: t('lebanese_foods.manakish_desc'), emoji: '🫓' },
    { name: t('lebanese_foods.fattoush'), cal: `180 ${t('common.kcal')}`, desc: t('lebanese_foods.fattoush_desc'), emoji: '🥗' },
    { name: t('lebanese_foods.hummus'), cal: `220 ${t('common.kcal')}`, desc: t('lebanese_foods.hummus_desc'), emoji: '🫘' },
    { name: t('lebanese_foods.shawarma'), cal: `480 ${t('common.kcal')}`, desc: t('lebanese_foods.shawarma_desc'), emoji: '🌯' },
    { name: t('lebanese_foods.labneh'), cal: `150 ${t('common.kcal')}`, desc: t('lebanese_foods.labneh_desc'), emoji: '🥛' },
    { name: t('lebanese_foods.tabbouleh'), cal: `120 ${t('common.kcal')}`, desc: t('lebanese_foods.tabbouleh_desc'), emoji: '🥬' },
  ]

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
            <a href="#how" className="text-white/70 hover:text-white text-sm transition-colors">{t('landing.nav_how')}</a>
            <a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">{t('landing.nav_features')}</a>
            <a href="#foods" className="text-white/70 hover:text-white text-sm transition-colors">{t('landing.nav_foods')}</a>
            {!user && (
              <Link to="/login" className="text-white/70 hover:text-white text-sm transition-colors">{t('auth.login')}</Link>
            )}
            <Link 
              to={user ? "/dashboard" : "/onboarding"} 
              className="bg-primary-accent hover:bg-primary-accent/90 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-accent/25"
            >
              {user ? t('landing.go_to_dashboard') : t('landing.get_started')}
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
              {user ? t('landing.go_to_dashboard') : t('landing.get_started')}
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
              <span className="text-primary-light text-xs font-semibold">{t('landing.hero_tag')}</span>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6">
              {t('landing.hero_title').split('AI')[0]}
              <br />
              <span className="bg-gradient-to-r from-primary-light to-primary-lighter bg-clip-text text-transparent">
                AI {t('landing.hero_title').split('AI')[1]}
              </span>
              <br />
              <span className="text-3xl lg:text-4xl font-bold text-white/70">
                — {t('landing.hero_subtitle')}
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-lg mb-8">
              {t('landing.hero_desc')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={user ? "/dashboard" : "/onboarding"}
                className="group bg-primary-accent hover:bg-primary-light text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary-accent/30 flex items-center gap-2"
              >
                {user ? t('landing.go_to_dashboard') : t('landing.get_started_free')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how"
                className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-300 backdrop-blur"
              >
                {t('landing.see_how')}
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
                <p className="text-white/50 text-xs">{t('landing.trusted_by')}</p>
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
                    <div className="text-white/50 text-[10px] mb-1">{t('landing.daily_progress')}</div>
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
                      <div className="text-white/40 text-[10px]">{t('dashboard.workout_card')}</div>
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
                    <div className="text-xs font-bold text-text-primary">{t('dashboard.health_advisory')}</div>
                    <div className="text-[10px] text-text-muted">72 bpm — {t('dashboard.completed')}</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -left-2 bg-bg-card rounded-2xl shadow-xl p-3 animate-float delay-500 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <div>
                    <div className="text-xs font-bold text-text-primary">18 {t('dashboard.streak_days')}</div>
                    <div className="text-[10px] text-text-muted">{t('dashboard.keep_going')}</div>
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
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">{t('landing.how_tag')}</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              {t('landing.how_title')}
            </h2>
            <p className="text-text-muted mt-3 max-w-lg mx-auto">
              {t('landing.how_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-bg-card rounded-2xl p-6 text-center border border-gray-100 hover:border-primary-accent/30 hover:shadow-lg hover:shadow-primary-accent/5 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-accent to-primary-light flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-accent/20 group-hover:scale-110 transition-transform">
                    <step.icon size={22} className="text-white" />
                  </div>
                  <div className="text-xs text-primary-accent font-bold mb-1">{t('common.ago')} {i + 1}</div>
                  <h3 className="font-heading font-bold text-text-primary mb-1">{t(`landing.${step.title}`)}</h3>
                  <p className="text-xs text-text-muted">{t(`landing.${step.desc}`)}</p>
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
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">{t('landing.ai_tag')}</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              {t('landing.ai_title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {aiModels.map((model, i) => (
              <div key={i} className="group relative bg-bg-main rounded-2xl p-8 border border-gray-100 hover:border-primary-accent/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-accent/5 to-transparent rounded-bl-full"></div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${model.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <model.icon size={22} className="text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">{t(`landing.${model.title}`)}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t(`landing.${model.desc}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section id="features" className="py-24 bg-bg-main">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">{t('landing.features_tag')}</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              {t('landing.features_title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-bg-card rounded-2xl p-6 border border-gray-100 hover:border-primary-accent/20 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary-pale flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={20} className="text-primary-accent" />
                </div>
                <h3 className="font-heading font-bold text-text-primary mb-2">{t(`landing.${f.title}`)}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t(`landing.${f.desc}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Lebanese Foods ===== */}
      <section id="foods" className="py-24 bg-bg-card overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary-accent text-sm font-semibold uppercase tracking-widest">{t('landing.foods_tag')}</span>
            <h2 className="font-heading text-4xl font-bold text-text-primary mt-3">
              {t('landing.foods_title')}
            </h2>
            <p className="text-text-muted mt-3">{t('landing.foods_subtitle')}</p>
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
            {t('landing.cta_title')}
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            {t('landing.cta_desc')}
          </p>
          <Link
            to={user ? "/dashboard" : "/onboarding"}
            className="inline-flex items-center gap-2 bg-primary-accent hover:bg-primary-light text-white font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary-accent/30 text-lg group"
          >
            {user ? t('landing.go_to_dashboard') : t('landing.get_started_free')}
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
            <p className="text-white/40 text-sm">{t('landing.footer_desc')}</p>
            <div className="flex gap-6">
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{t('landing.privacy')}</a>
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{t('landing.terms')}</a>
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">{t('landing.contact')}</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/30 text-xs">© 2026 VitalSense AI. {t('landing.all_rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
