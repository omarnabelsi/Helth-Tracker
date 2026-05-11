import { useState, useEffect } from 'react'
import { PLANS } from '../config/plans'
import { useSubscription } from '../hooks/useSubscription'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Crown, Check, X, Sparkles, ArrowLeft } from 'lucide-react'

const Pricing = () => {
  const { isPremium } = useSubscription()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'

  const handleUpgrade = async () => {
    // Placeholder — Stripe integration goes here
    // window.location.href = '/api/create-checkout-session'
    const msg = isAr
      ? 'سيتم تفعيل الدفع قريباً! تواصل معنا على WhatsApp للترقية اليدوية.'
      : 'Payment coming soon! Contact us on WhatsApp for manual upgrade.'
    alert(msg)
  }

  return (
    <div className="min-h-screen bg-bg-main p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 flex items-center justify-center mx-auto">
            <Crown size={28} className="text-yellow-400" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-text-primary">
            {isAr ? 'اختر خطتك' : 'Choose Your Plan'}
          </h1>
          <p className="text-text-muted text-base">
            {isAr ? 'ابدأ مجاناً وقم بالترقية في أي وقت' : 'Start free and upgrade anytime'}
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          {Object.values(PLANS).map(plan => {
            const isCurrentPlan = (plan.id === 'premium' && isPremium) || (plan.id === 'free' && !isPremium)
            const isPremiumPlan = plan.id === 'premium'

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 border-2 transition-all ${
                  isPremiumPlan
                    ? 'border-primary-accent bg-gradient-to-br from-primary-accent/10 to-primary-dark shadow-2xl shadow-primary-accent/20'
                    : 'border-border-color bg-bg-card'
                }`}
              >
                {/* Most Popular badge */}
                {isPremiumPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-accent text-white text-[10px] font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="text-3xl mb-3">{isPremiumPlan ? '👑' : '🌱'}</div>
                  <h2 className="font-heading text-2xl font-extrabold text-text-primary">
                    {isAr ? plan.nameAr : plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-primary-accent">
                      {isPremiumPlan ? '$9.99' : '$0'}
                    </span>
                    <span className="text-text-muted text-sm">/ month</span>
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-7">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        f.included
                          ? 'bg-primary-accent text-white'
                          : 'bg-white/5 text-text-muted'
                      }`}>
                        {f.included ? <Check size={11} /> : <X size={11} />}
                      </span>
                      <span className={`text-sm ${f.included ? 'text-text-primary font-medium' : 'text-text-muted line-through'}`}>
                        {isAr ? f.ar : f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentPlan ? (
                  <div className="w-full py-3.5 rounded-xl border border-border-color bg-white/5 text-text-muted text-sm font-bold text-center">
                    {isAr ? '✓ خطتك الحالية' : '✓ Current Plan'}
                  </div>
                ) : isPremiumPlan ? (
                  <button
                    onClick={handleUpgrade}
                    className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary-accent/20"
                  >
                    <Crown size={16} />
                    {isAr ? 'ترقية إلى بريميوم 👑' : 'Upgrade to Premium 👑'}
                  </button>
                ) : (
                  <div className="w-full py-3 text-center text-text-muted text-xs font-medium">
                    {isAr ? 'الخطة المجانية دائماً متاحة' : 'Free plan always available'}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ / info strip */}
        <div className="bg-bg-card border border-border-color rounded-2xl p-6 text-center animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary-accent" />
            <span className="text-text-primary font-bold text-sm">
              {isAr ? 'ضمان استرداد الأموال لمدة 7 أيام' : '7-day money-back guarantee'}
            </span>
          </div>
          <p className="text-text-muted text-xs">
            {isAr
              ? 'إذا لم تكن راضياً، سنسترد لك أموالك خلال 7 أيام. بدون أسئلة.'
              : "If you're not satisfied, we'll refund you within 7 days. No questions asked."}
          </p>
        </div>

      </div>
    </div>
  )
}

export default Pricing
