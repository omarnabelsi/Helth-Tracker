// 4-day rotating PPL cycle: Push -> Pull -> Legs -> Rest
// This cycle repeats every 4 days
export const PPL_SCHEDULE = {
  1: { type: 'push', name: 'Push Day', nameAr: 'يوم الدفع', emoji: '🫸', color: '#E53935', desc: 'Chest · Shoulders · Triceps', descAr: 'الصدر · الأكتاف · الترايسبس' },
  2: { type: 'pull', name: 'Pull Day', nameAr: 'يوم السحب', emoji: '🫷', color: '#1E88E5', desc: 'Back · Biceps · Rear Delts', descAr: 'الظهر · البايسبس · الأكتاف الخلفية' },
  3: { type: 'legs', name: 'Legs Day', nameAr: 'يوم الأرجل', emoji: '🦵', color: '#43A047', desc: 'Quads · Hamstrings · Glutes · Calves', descAr: 'الرباعية · أوتار الركبة · الأرداف · السمانة' },
  4: { type: 'rest', name: 'Rest Day', nameAr: 'يوم راحة', emoji: '😴', color: '#757575', desc: 'Recovery · Stretching · Walking', descAr: 'استشفاء · إطالة · مشي' }
}

// Fixed anchor date (a Monday) to calculate the rotation
const ANCHOR_DATE = new Date('2026-01-05T00:00:00Z') 

export const getPPLDay = (date = new Date()) => {
  const diffTime = Math.abs(date - ANCHOR_DATE)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return (diffDays % 4) + 1 // Returns 1-4
}

export const getDayType = () => {
  const pplDay = getPPLDay()
  return PPL_SCHEDULE[pplDay]
}

// Exercise lists per muscle group
export const PPL_EXERCISES = {

  // ─── PUSH ───────────────────────────────────────────
  push: {
    home: [
      { name: 'Push-ups', nameAr: 'تمرين الضغط', sets: 4, reps: '10-15', muscle: 'chest', notes: 'Keep core tight' },
      { name: 'Decline Push-ups', nameAr: 'ضغط منحدر', sets: 3, reps: '10-12', muscle: 'chest', notes: 'Feet elevated on chair' },
      { name: 'Pike Push-ups', nameAr: 'ضغط القمة', sets: 3, reps: '8-10', muscle: 'shoulders', notes: 'Hips high, head toward floor' },
      { name: 'Lateral Raises (Bottles)', nameAr: 'رفع جانبي', sets: 3, reps: '12-15', muscle: 'shoulders', notes: 'Use water bottles' },
      { name: 'Diamond Push-ups', nameAr: 'ضغط الألماس', sets: 3, reps: '8-12', muscle: 'triceps', notes: 'Hands form diamond shape' }
    ],
    small_gym: [
      { name: 'Dumbbell Bench Press', nameAr: 'ضغط الدمبل على المقعد', sets: 4, reps: '8-10', muscle: 'chest', notes: 'Full range of motion' },
      { name: 'Incline Dumbbell Press', nameAr: 'ضغط الدمبل المائل', sets: 3, reps: '8-10', muscle: 'chest', notes: '30-45 degree incline' },
      { name: 'Dumbbell Shoulder Press', nameAr: 'ضغط الكتف بالدمبل', sets: 4, reps: '8-10', muscle: 'shoulders', notes: 'Seated or standing' },
      { name: 'Lateral Raises', nameAr: 'الرفع الجانبي', sets: 3, reps: '12-15', muscle: 'shoulders', notes: 'Slight bend in elbows' },
      { name: 'Overhead Tricep Extension', nameAr: 'تمديد الترايسبس', sets: 3, reps: '10-12', muscle: 'triceps', notes: 'Keep elbows close' }
    ],
    big_gym: [
      { name: 'Barbell Bench Press', nameAr: 'ضغط البار على المقعد', sets: 4, reps: '6-8', muscle: 'chest', notes: 'Warm up properly' },
      { name: 'Incline Barbell Press', nameAr: 'ضغط البار المائل', sets: 4, reps: '8-10', muscle: 'chest', notes: '30-45 degree incline' },
      { name: 'Barbell Overhead Press', nameAr: 'ضغط البار فوق الرأس', sets: 4, reps: '6-8', muscle: 'shoulders', notes: 'Core braced' },
      { name: 'Cable Lateral Raises', nameAr: 'رفع جانبي بالكابل', sets: 3, reps: '15-20', muscle: 'shoulders', notes: 'Single arm at a time' },
      { name: 'Cable Pushdown', nameAr: 'دفع الكابل للأسفل', sets: 4, reps: '12-15', muscle: 'triceps', notes: 'Elbows locked at sides' }
    ]
  },

  // ─── PULL ───────────────────────────────────────────
  pull: {
    home: [
      { name: 'Pull-ups', nameAr: 'عقلة', sets: 4, reps: '5-10', muscle: 'back', notes: 'Full hang at bottom' },
      { name: 'Inverted Rows (Table)', nameAr: 'شفط مقلوب', sets: 3, reps: '10-12', muscle: 'back', notes: 'Keep body straight' },
      { name: 'Resistance Band Rows', nameAr: 'شفط بالشريط المطاطي', sets: 3, reps: '12-15', muscle: 'back', notes: 'Squeeze shoulder blades' },
      { name: 'Chin-ups', nameAr: 'شنق عكسي', sets: 3, reps: '5-10', muscle: 'biceps', notes: 'Palms facing you' },
      { name: 'Towel Bicep Curls', nameAr: 'تجعيل البيسبس بالمنشفة', sets: 3, reps: '10-15', muscle: 'biceps', notes: 'Loop towel around pole' }
    ],
    small_gym: [
      { name: 'Dumbbell Bent Over Row', nameAr: 'شفط الدمبل للخلف', sets: 4, reps: '8-10', muscle: 'back', notes: 'Back flat, squeeze at top' },
      { name: 'Single Arm Dumbbell Row', nameAr: 'شفط أحادي', sets: 3, reps: '10-12', muscle: 'back', notes: 'Knee on bench for support' },
      { name: 'Dumbbell Face Pulls', nameAr: 'شد الوجه بالدمبل', sets: 3, reps: '15', muscle: 'shoulders', notes: 'Rear delt focus' },
      { name: 'Dumbbell Bicep Curls', nameAr: 'تجعيل البيسبس', sets: 4, reps: '10-12', muscle: 'biceps', notes: 'Alternate arms' },
      { name: 'Hammer Curls', nameAr: 'تجعيل المطرقة', sets: 3, reps: '10-12', muscle: 'biceps', notes: 'Neutral grip throughout' }
    ],
    big_gym: [
      { name: 'Lat Pulldown', nameAr: 'شد اللاتيسيموس', sets: 4, reps: '10-12', muscle: 'back', notes: 'Wide grip, chest up' },
      { name: 'Seated Cable Row', nameAr: 'شفط الكابل جالساً', sets: 4, reps: '10-12', muscle: 'back', notes: 'Squeeze shoulder blades' },
      { name: 'Cable Face Pulls', nameAr: 'شد الوجه بالكابل', sets: 3, reps: '15-20', muscle: 'shoulders', notes: 'Elbows high and wide' },
      { name: 'Barbell Bicep Curl', nameAr: 'تجعيل البار', sets: 4, reps: '8-10', muscle: 'biceps', notes: 'No swinging' },
      { name: 'Hammer Curls', nameAr: 'تجعيل المطرقة', sets: 3, reps: '10-12', muscle: 'biceps', notes: 'Neutral grip' }
    ]
  },

  // ─── LEGS ───────────────────────────────────────────
  legs: {
    home: [
      { name: 'Bodyweight Squats', nameAr: 'قرفصاء بوزن الجسم', sets: 4, reps: '15-20', muscle: 'quads', notes: 'Knees track over toes' },
      { name: 'Lunges', nameAr: 'خطوات الرياضة', sets: 3, reps: '12 each leg', muscle: 'quads', notes: 'Step forward, knee to floor' },
      { name: 'Romanian Deadlift (Bodyweight)', nameAr: 'رفع رومانيا بوزن الجسم', sets: 3, reps: '12-15', muscle: 'hamstrings', notes: 'Hinge at hips' },
      { name: 'Glute Bridges', nameAr: 'جسر الردفين', sets: 4, reps: '15-20', muscle: 'glutes', notes: 'Squeeze at top' },
      { name: 'Calf Raises', nameAr: 'رفع الساق', sets: 4, reps: '20-25', muscle: 'calves', notes: 'Full stretch at bottom' }
    ],
    small_gym: [
      { name: 'Dumbbell Goblet Squat', nameAr: 'قرفصاء الكأس', sets: 4, reps: '10-12', muscle: 'quads', notes: 'Dumbbell at chest level' },
      { name: 'Dumbbell Romanian Deadlift', nameAr: 'رفع رومانيا بالدمبل', sets: 4, reps: '10-12', muscle: 'hamstrings', notes: 'Feel the stretch in hamstrings' },
      { name: 'Dumbbell Lunges', nameAr: 'خطوات بالدمبل', sets: 3, reps: '10 each leg', muscle: 'quads', notes: 'Alternate legs' },
      { name: 'Dumbbell Hip Thrust', nameAr: 'دفع الورك بالدمبل', sets: 4, reps: '12-15', muscle: 'glutes', notes: 'Dumbbell on hips' },
      { name: 'Standing Calf Raises', nameAr: 'رفع الساق واقفاً', sets: 4, reps: '20', muscle: 'calves', notes: 'Slow and controlled' }
    ],
    big_gym: [
      { name: 'Barbell Back Squat', nameAr: 'قرفصاء البار الخلفي', sets: 4, reps: '6-8', muscle: 'quads', notes: 'King of leg exercises' },
      { name: 'Romanian Deadlift', nameAr: 'رفع رومانيا', sets: 4, reps: '8-10', muscle: 'hamstrings', notes: 'Bar close to body' },
      { name: 'Leg Press', nameAr: 'ضغط الأرجل', sets: 4, reps: '10-12', muscle: 'quads', notes: 'Vary foot position for emphasis' },
      { name: 'Leg Curl Machine', nameAr: 'آلة تجعيل الأرجل', sets: 4, reps: '10-12', muscle: 'hamstrings', notes: 'Full stretch at top' },
      { name: 'Seated Calf Raises', nameAr: 'رفع الساق جالساً', sets: 4, reps: '15-20', muscle: 'calves', notes: 'Slow and full range' }
    ]
  },

  // ─── REST ───────────────────────────────────────────
  rest: {
    home: [
      { name: 'Light Walking', nameAr: 'مشي خفيف', sets: 1, reps: '20-30 min', muscle: 'cardio', notes: 'Keep it easy, enjoy it' },
      { name: 'Full Body Stretch', nameAr: 'تمدد كامل', sets: 1, reps: '15-20 min', muscle: 'flexibility', notes: 'Hold each stretch 30 seconds' },
      { name: 'Foam Rolling', nameAr: 'دحرجة بالأسطوانة', sets: 1, reps: '10-15 min', muscle: 'recovery', notes: 'Focus on sore areas' }
    ],
    small_gym: [
      { name: 'Light Treadmill Walk', nameAr: 'مشي خفيف على التريدميل', sets: 1, reps: '20 min', muscle: 'cardio', notes: 'Low incline, easy pace' },
      { name: 'Full Body Stretch', nameAr: 'تمدد كامل', sets: 1, reps: '15 min', muscle: 'flexibility', notes: 'Hold each stretch 30 seconds' }
    ],
    big_gym: [
      { name: 'Light Treadmill Walk', nameAr: 'مشي خفيف على التريدميل', sets: 1, reps: '20 min', muscle: 'cardio', notes: 'Low incline, easy pace' },
      { name: 'Stationary Bike (easy)', nameAr: 'دراجة ثابتة خفيفة', sets: 1, reps: '15 min', muscle: 'cardio', notes: 'Recovery pace' },
      { name: 'Full Body Stretch', nameAr: 'تمدد كامل', sets: 1, reps: '15 min', muscle: 'flexibility', notes: 'Focus on worked muscles' }
    ]
  }
}

// Medical condition exercise filters
export const CONDITION_FILTERS = {
  heart_disease: {
    remove: ['Barbell Bench Press', 'Deadlift', 'Barbell Back Squat', 'Jump Squats'],
    note: 'Low intensity only. No heavy compound lifts. Monitor heart rate.'
  },
  knee_injury: {
    remove: ['Barbell Back Squat', 'Jump Squats', 'Leg Extension Machine', 'Bulgarian Split Squat', 'Lunges'],
    note: 'Avoid deep knee flexion. Replace squats with hip-dominant exercises.'
  },
  back_pain: {
    remove: ['Deadlift', 'T-Bar Row', 'Barbell Bent Over Row', 'Romanian Deadlift'],
    note: 'Avoid heavy spinal loading. Use supported exercises only.'
  },
  shoulder_injury: {
    remove: ['Barbell Overhead Press', 'Dumbbell Shoulder Press', 'Upright Rows'],
    note: 'Avoid overhead pressing. Focus on lateral and rear delt work.'
  },
  diabetes: {
    remove: [],
    note: 'Monitor blood sugar before and after. Carry fast-acting carbs.'
  }
}
