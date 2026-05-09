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
      { name: 'Push-ups', nameAr: 'تمرين الضغط', sets: 4, reps: '10-15', muscle: 'chest', notes: 'Focus on form' },
      { name: 'Decline Push-ups', nameAr: 'ضغط منحدر', sets: 3, reps: '10-12', muscle: 'chest', notes: 'Feet on chair' },
      { name: 'Pike Push-ups', nameAr: 'ضغط القمة', sets: 3, reps: '8-10', muscle: 'shoulders', notes: 'Hips high' },
      { name: 'Lateral Raises (Bottles)', nameAr: 'رفع جانبي', sets: 3, reps: '12-15', muscle: 'shoulders', notes: 'Control the weight' },
      { name: 'Diamond Push-ups', nameAr: 'ضغط الألماس', sets: 3, reps: '8-12', muscle: 'triceps', notes: 'Hands form diamond' }
    ],
    small_gym: [
      { name: 'Dumbbell Bench Press', nameAr: 'ضغط الدمبل على المقعد', sets: 4, reps: '8-10', muscle: 'chest', notes: 'Full range' },
      { name: 'Incline Dumbbell Press', nameAr: 'ضغط الدمبل المائل', sets: 3, reps: '8-10', muscle: 'chest', notes: 'Upper chest focus' },
      { name: 'Dumbbell Shoulder Press', nameAr: 'ضغط الكتف بالدمبل', sets: 4, reps: '8-10', muscle: 'shoulders', notes: 'Full extension' },
      { name: 'Lateral Raises', nameAr: 'الرفع الجانبي', sets: 3, reps: '12-15', muscle: 'shoulders', notes: 'Keep elbows slightly bent' },
      { name: 'Overhead Tricep Extension', nameAr: 'تمديد الترايسبس', sets: 3, reps: '10-12', muscle: 'triceps', notes: 'Keep elbows close' }
    ],
    big_gym: [
      { name: 'Barbell Bench Press', nameAr: 'ضغط البار على المقعد', sets: 4, reps: '6-8', muscle: 'chest', notes: 'Power movement' },
      { name: 'Incline Barbell Press', nameAr: 'ضغط البار المائل', sets: 4, reps: '8-10', muscle: 'chest', notes: 'Upper chest focus' },
      { name: 'Barbell Overhead Press', nameAr: 'ضغط البار فوق الرأس', sets: 4, reps: '6-8', muscle: 'shoulders', notes: 'Strict form' },
      { name: 'Cable Lateral Raises', nameAr: 'رفع جانبي بالكابل', sets: 3, reps: '15-20', muscle: 'shoulders', notes: 'Constant tension' },
      { name: 'Cable Pushdown', nameAr: 'دفع الكابل للأسفل', sets: 4, reps: '12-15', muscle: 'triceps', notes: 'Lock elbows at sides' }
    ]
  },

  // ─── PULL ───────────────────────────────────────────
  pull: {
    home: [
      { name: 'Pull-ups', nameAr: 'عقلة', sets: 4, reps: '5-10', muscle: 'back', notes: 'Full hang' },
      { name: 'Resistance Band Rows', nameAr: 'شفط بالشريط المطاطي', sets: 3, reps: '12-15', muscle: 'back', notes: 'Squeeze shoulder blades' },
      { name: 'Superman Hold', nameAr: 'تمرين سوبرمان', sets: 3, reps: '12-15', muscle: 'back', notes: 'Lower back focus' },
      { name: 'Chin-ups', nameAr: 'شنق عكسي', sets: 3, reps: '5-10', muscle: 'biceps', notes: 'Palms facing you' },
      { name: 'Towel Bicep Curls', nameAr: 'تجعيل البيسبس بالمنشفة', sets: 3, reps: '10-15', muscle: 'biceps', notes: 'Slow and controlled' }
    ],
    small_gym: [
      { name: 'Dumbbell Bent Over Row', nameAr: 'شفط الدمبل للخلف', sets: 4, reps: '8-10', muscle: 'back', notes: 'Back flat' },
      { name: 'Single Arm Dumbbell Row', nameAr: 'شفط أحادي', sets: 3, reps: '10-12', muscle: 'back', notes: 'Knee on bench' },
      { name: 'Dumbbell Face Pulls', nameAr: 'شد الوجه بالدمبل', sets: 3, reps: '15', muscle: 'back', notes: 'Rear delt focus' },
      { name: 'Dumbbell Bicep Curls', nameAr: 'تجعيل البيسبس', sets: 4, reps: '10-12', muscle: 'biceps', notes: 'Alternate arms' },
      { name: 'Hammer Curls', nameAr: 'تجعيل المطرقة', sets: 3, reps: '10-12', muscle: 'biceps', notes: 'Neutral grip' }
    ],
    big_gym: [
      { name: 'Lat Pulldown', nameAr: 'شد اللاتيسيموس', sets: 4, reps: '10-12', muscle: 'back', notes: 'Wide grip' },
      { name: 'Seated Cable Row', nameAr: 'شفط الكابل جالساً', sets: 4, reps: '10-12', muscle: 'back', notes: 'Squeeze at back' },
      { name: 'T-Bar Row', nameAr: 'شفط T-بار', sets: 3, reps: '8-10', muscle: 'back', notes: 'Power row' },
      { name: 'Barbell Bicep Curl', nameAr: 'تجعيل البار', sets: 4, reps: '8-10', muscle: 'biceps', notes: 'Strict curls' },
      { name: 'Preacher Curls', nameAr: 'تجعيل الواعظ', sets: 3, reps: '10-12', muscle: 'biceps', notes: 'Peak contraction' }
    ]
  },

  // ─── LEGS ───────────────────────────────────────────
  legs: {
    home: [
      { name: 'Bodyweight Squats', nameAr: 'قرفصاء بوزن الجسم', sets: 4, reps: '15-20', muscle: 'quads', notes: 'Full depth' },
      { name: 'Lunges', nameAr: 'خطوات الرياضة', sets: 3, reps: '12 each leg', muscle: 'quads', notes: 'Step forward' },
      { name: 'Glute Bridges', nameAr: 'جسر الردفين', sets: 4, reps: '15-20', muscle: 'glutes', notes: 'Squeeze glutes' },
      { name: 'Romanian Deadlift (Bodyweight)', nameAr: 'رفع رومانيا بوزن الجسم', sets: 3, reps: '12-15', muscle: 'hamstrings', notes: 'Hip hinge' },
      { name: 'Calf Raises', nameAr: 'رفع الساق', sets: 4, reps: '20-25', muscle: 'calves', notes: 'On a step' }
    ],
    small_gym: [
      { name: 'Dumbbell Goblet Squat', nameAr: 'قرفصاء الكأس', sets: 4, reps: '10-12', muscle: 'quads', notes: 'Hold DB at chest' },
      { name: 'Bulgarian Split Squat', nameAr: 'قرفصاء بلغارية', sets: 3, reps: '8-10 each leg', muscle: 'quads', notes: 'Rear foot elevated' },
      { name: 'Dumbbell Romanian Deadlift', nameAr: 'رفع رومانيا بالدمبل', sets: 4, reps: '10-12', muscle: 'hamstrings', notes: 'Keep back flat' },
      { name: 'Dumbbell Hip Thrust', nameAr: 'دفع الورك بالدمبل', sets: 4, reps: '12-15', muscle: 'glutes', notes: 'Power move' },
      { name: 'Standing Calf Raises', nameAr: 'رفع الساق واقفاً', sets: 4, reps: '20', muscle: 'calves', notes: 'Full range' }
    ],
    big_gym: [
      { name: 'Barbell Back Squat', nameAr: 'قرفصاء البار الخلفي', sets: 4, reps: '6-8', muscle: 'quads', notes: 'Heavy squats' },
      { name: 'Leg Press', nameAr: 'ضغط الأرجل', sets: 4, reps: '10-12', muscle: 'quads', notes: 'Control descent' },
      { name: 'Romanian Deadlift', nameAr: 'رفع رومانيا', sets: 4, reps: '8-10', muscle: 'hamstrings', notes: 'Stretch focus' },
      { name: 'Leg Curl Machine', nameAr: 'آلة تجعيل الأرجل', sets: 4, reps: '10-12', muscle: 'hamstrings', notes: 'Squeeze at top' },
      { name: 'Seated Calf Raises', nameAr: 'رفع الساق جالساً', sets: 4, reps: '15-20', muscle: 'calves', notes: 'Peak stretch' }
    ]
  },

  // ─── REST ───────────────────────────────────────────
  rest: {
    home: [
      { name: 'Light Walking', nameAr: 'مشي خفيف', sets: 1, reps: '20-30 min', muscle: 'cardio', notes: 'Enjoy it' },
      { name: 'Full Body Stretch', nameAr: 'تمدد كامل', sets: 1, reps: '15-20 min', muscle: 'flexibility', notes: 'Relax' }
    ],
    small_gym: [
      { name: 'Light Treadmill Walk', nameAr: 'مشي خفيف على التريدميل', sets: 1, reps: '20 min', muscle: 'cardio', notes: 'Easy pace' },
      { name: 'Full Body Stretch', nameAr: 'تمدد كامل', sets: 1, reps: '15 min', muscle: 'flexibility', notes: 'Relax' }
    ],
    big_gym: [
      { name: 'Light Treadmill Walk', nameAr: 'مشي خفيف على التريدميل', sets: 1, reps: '20 min', muscle: 'cardio', notes: 'Easy pace' },
      { name: 'Full Body Stretch', nameAr: 'تمدد كامل', sets: 1, reps: '15 min', muscle: 'flexibility', notes: 'Relax' }
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
