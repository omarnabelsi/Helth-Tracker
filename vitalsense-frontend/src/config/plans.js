export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    nameAr: 'مجاني',
    price: 0,
    priceLabel: '$0 / month',
    priceLabelAr: '0$ / شهر',
    color: '#6B7280',
    features: [
      { text: '7-day meal plan', ar: 'خطة وجبات 7 أيام', included: true },
      { text: 'Basic workout plan', ar: 'خطة تمارين أساسية', included: true },
      { text: 'Lebanese food database', ar: 'قاعدة بيانات الطعام اللبناني', included: true },
      { text: '10 AI chat messages/day', ar: '10 رسائل ذكاء اصطناعي يومياً', included: true },
      { text: 'Basic progress tracking', ar: 'تتبع تقدم أساسي', included: true },
      { text: 'Advanced AI analysis', ar: 'تحليل ذكاء اصطناعي متقدم', included: false },
      { text: 'Unlimited AI chat', ar: 'محادثة ذكاء اصطناعي غير محدودة', included: false },
      { text: 'Meal photo recognition', ar: 'تعرف على الطعام بالصورة', included: false },
      { text: 'Weekly AI report', ar: 'تقرير ذكاء اصطناعي أسبوعي', included: false },
      { text: 'All 5 app themes', ar: 'جميع مظاهر التطبيق الخمسة', included: false },
      { text: 'Priority support', ar: 'دعم ذو أولوية', included: false },
      { text: 'Export PDF plans', ar: 'تصدير الخطط PDF', included: false },
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    nameAr: 'بريميوم',
    price: 9.99,
    priceLabel: '$9.99 / month',
    priceLabelAr: '9.99$ / شهر',
    color: '#4CAF7D',
    features: [
      { text: '7-day meal plan', ar: 'خطة وجبات 7 أيام', included: true },
      { text: 'Full PPL workout plan', ar: 'خطة تمارين PPL كاملة', included: true },
      { text: 'Lebanese + Global food database', ar: 'قاعدة بيانات لبنانية وعالمية', included: true },
      { text: 'Unlimited AI chat', ar: 'محادثة ذكاء اصطناعي غير محدودة', included: true },
      { text: 'Advanced progress tracking', ar: 'تتبع تقدم متقدم', included: true },
      { text: 'Advanced AI body analysis', ar: 'تحليل جسم متقدم بالذكاء الاصطناعي', included: true },
      { text: 'Meal photo recognition', ar: 'تعرف على الطعام بالصورة', included: true },
      { text: 'Weekly AI insight report', ar: 'تقرير رؤى ذكاء اصطناعي أسبوعي', included: true },
      { text: 'All 5 app themes', ar: 'جميع مظاهر التطبيق الخمسة', included: true },
      { text: 'Priority support', ar: 'دعم ذو أولوية', included: true },
      { text: 'Export PDF plans', ar: 'تصدير الخطط PDF', included: true },
      { text: 'Goal recalibration', ar: 'إعادة معايرة الأهداف', included: true },
    ]
  }
}

export const PREMIUM_FEATURES = [
  'unlimited_chat', 'meal_photo', 'weekly_report',
  'all_themes', 'pdf_export', 'global_food_search',
  'advanced_progress', 'goal_recalibration'
]

// Themes available for free users
export const FREE_THEMES = ['deep_forest', 'arctic_blue']
