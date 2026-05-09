// ─── MEAL TIME DEFINITIONS ──────────────────────────────
export const MEAL_TIMES = {
  breakfast: {
    label: 'Breakfast',
    labelAr: 'الفطور',
    timeRange: '6am - 10am',
    emoji: '🌅',
    maxCalories: 0.25, // 25% of daily target
    description: 'Light to medium, energizing, easy to digest',
    descriptionAr: 'خفيف إلى متوسط، مانح للطاقة، سهل الهضم'
  },
  lunch: {
    label: 'Lunch',
    labelAr: 'الغداء',
    timeRange: '12pm - 3pm',
    emoji: '☀️',
    maxCalories: 0.35,
    description: 'Biggest meal of the day, balanced macros',
    descriptionAr: 'أكبر وجبة في اليوم، توازن في المغذيات'
  },
  dinner: {
    label: 'Dinner',
    labelAr: 'العشاء',
    timeRange: '6pm - 9pm',
    emoji: '🌙',
    maxCalories: 0.30,
    description: 'Medium sized, protein focused, lower carbs',
    descriptionAr: 'متوسط الحجم، غني بالبروتين، كربوهيدرات أقل'
  },
  snack: {
    label: 'Snack',
    labelAr: 'وجبة خفيفة',
    timeRange: 'Anytime',
    emoji: '🍎',
    maxCalories: 0.10,
    description: 'Small, light, under 300 calories',
    descriptionAr: 'صغيرة وخفيفة، أقل من 300 سعرة'
  }
}

// ─── FOOD CATEGORIES WITH MEAL TIME RULES ───────────────
export const FOOD_MEAL_RULES = {

  // ✅ BREAKFAST APPROPRIATE
  breakfast_foods: [
    'eggs', 'oats', 'oatmeal', 'yogurt', 'labneh', 'cheese',
    'bread', 'toast', 'manakish', 'zaatar', 'honey', 'jam',
    'fruits', 'banana', 'apple', 'berries', 'orange',
    'milk', 'smoothie', 'cereal', 'granola', 'pancakes',
    'foul moudamas', 'hummus', 'olive oil', 'olives',
    'avocado toast', 'ful', 'beans on toast',
    'protein shake', 'cottage cheese', 'chia seeds',
    'fatayer', 'kaak', 'croissant', 'muffin'
  ],

  // ✅ LUNCH APPROPRIATE
  lunch_foods: [
    'shawarma', 'grilled chicken', 'rice', 'pasta', 'pizza',
    'burger', 'sandwich', 'wrap', 'salad', 'soup',
    'fattoush', 'tabbouleh', 'tabboula', 'hummus',
    'kafta', 'kebab', 'grilled fish', 'steak',
    'riz a dajaj', 'riz bi lahma', 'moujadara',
    'moghrabia', 'malfouf mahchi', 'koussa mahchi',
    'yakhnat bamia', 'yakhnat fassoulia', 'yakhnat mouloukhia',
    'mousaka batinjan', 'loubia bil zet', 'kafta wa batata',
    'kebba bil sayniya', 'lahm bil ajin', 'fattat hommos',
    'chichbarak', 'sayadia', 'warak enab', 'borgul bi banadoura',
    'sushi', 'noodles', 'fried rice', 'biryani',
    'lentil soup', 'vegetable soup', 'chicken soup',
    'caesar salad', 'greek salad', 'niçoise salad'
  ],

  // ✅ DINNER APPROPRIATE
  dinner_foods: [
    'grilled chicken', 'grilled fish', 'salmon', 'tuna',
    'steak', 'lean beef', 'turkey', 'lamb',
    'steamed vegetables', 'roasted vegetables', 'salad',
    'soup', 'lentil soup', 'fattoush', 'tabbouleh',
    'shawarma lahma', 'shawarma dajaj', 'kafta',
    'riz a dajaj', 'sayadia', 'yakhnat bamia',
    'pasta', 'quinoa', 'sweet potato',
    'stir fry', 'curry', 'tagine',
    'moujadara', 'loubia bil zet',
    'grilled shrimp', 'baked fish', 'chicken breast'
  ],

  // ✅ SNACK APPROPRIATE (light, small)
  snack_foods: [
    'fruits', 'apple', 'banana', 'orange', 'grapes',
    'nuts', 'almonds', 'walnuts', 'cashews', 'pistachios',
    'yogurt', 'labneh', 'cheese', 'string cheese',
    'protein bar', 'protein shake', 'smoothie',
    'hummus with vegetables', 'celery', 'carrots',
    'rice cakes', 'crackers', 'dark chocolate',
    'dates', 'dried fruits', 'trail mix',
    'boiled eggs', 'cottage cheese',
    'hindbe bil zet', 'fatayer sabanikh',
    'kaak', 'biscuits', 'fruit salad',
    'energy ball', 'granola bar'
  ],

  // ❌ NEVER FOR BREAKFAST
  not_breakfast: [
    'pizza', 'burger', 'shawarma', 'kebab', 'steak',
    'fried chicken', 'french fries', 'chips',
    'baba ghanouj', 'warak enab', 'malfouf mahchi',
    'koussa mahchi', 'kafta', 'riz bi lahma',
    'moghrabia', 'chichbarak', 'yakhnat',
    'mousaka', 'sayadia', 'heavy pasta',
    'fried fish', 'full roast', 'biryani',
    'heavy soup', 'lahm bil ajin as main',
    'alcohol', 'energy drinks'
  ],

  // ❌ NEVER FOR SNACK (too heavy)
  not_snack: [
    'pizza', 'burger', 'steak', 'full meal rice',
    'baba ghanouj as meal', 'full shawarma plate',
    'yakhnat', 'malfouf mahchi', 'koussa mahchi',
    'moghrabia', 'chichbarak', 'kafta wa batata',
    'heavy pasta', 'biryani', 'full roast chicken',
    'riz bi lahma', 'kebba bil sayniya',
    'fattat hommos as full plate', 'sayadia',
    'warak enab full portion'
  ],

  // ❌ NEVER FOR DINNER (too heavy/sugary at night)
  not_dinner: [
    'heavy desserts', 'baklava as main',
    'sugary cereals', 'pancakes with syrup',
    'very heavy fried foods', 'full pizza',
    'french fries as meal', 'very high carb only'
  ],

  // 🍰 DESSERTS — only as snack or after lunch/dinner, never as breakfast
  desserts: [
    'baklava', 'knafeh', 'maamoul', 'halawa',
    'mouhallabiya', 'riz bil halib', 'nammoura',
    'sfouf', 'katayef', 'osmaliya', 'halawat el jiben',
    'ice cream', 'cake', 'chocolate', 'cookies',
    'maakaron', 'moushabak', 'znoud el sitt',
    'ward el sham', 'madlouka', 'mafrouka',
    'barazik', 'ghourayba', 'saniora'
  ]
}

// ─── VALIDATION FUNCTION ────────────────────────────────
export const isFoodValidForMeal = (foodName, mealType) => {
  const name = foodName.toLowerCase()

  // Check if it's a dessert
  const isDessert = FOOD_MEAL_RULES.desserts.some(d => name.includes(d.toLowerCase()))

  if (mealType === 'breakfast') {
    // Desserts NOT allowed for breakfast
    if (isDessert) return { valid: false, reason: 'Desserts are not appropriate for breakfast' }
    // Check not_breakfast list
    const blocked = FOOD_MEAL_RULES.not_breakfast.some(f => name.includes(f.toLowerCase()))
    if (blocked) return { valid: false, reason: `${foodName} is too heavy for breakfast` }
    return { valid: true }
  }

  if (mealType === 'snack') {
    // Too heavy for snack
    const blocked = FOOD_MEAL_RULES.not_snack.some(f => name.includes(f.toLowerCase()))
    if (blocked) return { valid: false, reason: `${foodName} is too heavy for a snack` }
    // Desserts OK as snack but warn about calories
    if (isDessert) return { valid: true, warning: 'This is a high-calorie snack — consider a smaller portion' }
    return { valid: true }
  }

  if (mealType === 'dinner') {
    const blocked = FOOD_MEAL_RULES.not_dinner.some(f => name.includes(f.toLowerCase()))
    if (blocked) return { valid: false, reason: `${foodName} is not ideal for dinner` }
    return { valid: true }
  }

  if (mealType === 'lunch') {
    // Almost anything is OK for lunch
    return { valid: true }
  }

  return { valid: true }
}

// ─── GET SUGGESTIONS FOR MEAL TYPE ──────────────────────
export const getSuggestionsForMeal = (mealType, language = 'en') => {
  const suggestions = {
    breakfast: {
      en: ['Eggs with labneh', 'Manakish zaatar', 'Oatmeal with fruits', 'Foul moudamas', 'Yogurt with honey', 'Avocado toast', 'Fatayer sabanikh'],
      ar: ['بيض مع لبنة', 'مناقيش زعتر', 'شوفان مع فواكه', 'فول مدمس', 'لبن مع عسل', 'توست أفوكادو', 'فطاير سبانخ']
    },
    lunch: {
      en: ['Shawarma dajaj', 'Riz a dajaj', 'Fattoush salad', 'Kafta wa batata', 'Grilled fish', 'Moujadara', 'Yakhnat bamia'],
      ar: ['شاورما دجاج', 'رز عدجاج', 'فتوش', 'كفتة وبطاطا', 'سمك مشوي', 'مجدرة', 'يخنة بامية']
    },
    dinner: {
      en: ['Grilled chicken', 'Tabbouleh', 'Lentil soup', 'Sayadia', 'Loubia bil zet', 'Steamed vegetables', 'Fattoush with protein'],
      ar: ['دجاج مشوي', 'تبولة', 'شوربة عدس', 'صيادية', 'لوبيا بالزيت', 'خضار مطهي', 'فتوش مع بروتين']
    },
    snack: {
      en: ['Mixed nuts', 'Greek yogurt', 'Banana', 'Labneh with vegetables', 'Dates', 'Protein shake', 'Apple with almond butter'],
      ar: ['مكسرات مشكلة', 'لبن يوناني', 'موزة', 'لبنة مع خضار', 'تمر', 'بروتين شيك', 'تفاحة مع زبدة اللوز']
    }
  }
  return suggestions[mealType]?.[language] || suggestions[mealType]?.['en'] || []
}
