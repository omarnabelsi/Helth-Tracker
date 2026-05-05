import { supabase } from '../lib/supabase'

/**
 * Update streak for a user. Called on every meal log or workout completion.
 * An "active day" = user logged at least one meal OR completed a workout.
 */
export const updateStreak = async (userId) => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streak) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    })
    await checkBadges(userId, 1)
    return
  }

  if (streak.last_active_date === today) return // already counted today

  if (streak.last_active_date === yesterday) {
    const newStreak = streak.current_streak + 1
    const longest = Math.max(newStreak, streak.longest_streak)
    await supabase
      .from('streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longest,
        last_active_date: today,
      })
      .eq('user_id', userId)
    await checkBadges(userId, newStreak)
  } else {
    // Streak broken — reset
    await supabase
      .from('streaks')
      .update({ current_streak: 1, last_active_date: today })
      .eq('user_id', userId)
    await checkBadges(userId, 1)
  }
}

/**
 * Badge definitions
 */
export const BADGES = [
  { id: 'first_login', icon: '👋', title: 'Welcome!', desc: 'Joined VitalSense AI' },
  { id: 'first_workout', icon: '💪', title: 'First Sweat', desc: 'Completed your first workout' },
  { id: 'first_meal_log', icon: '🍽️', title: 'Fuel Up', desc: 'Logged your first meal' },
  { id: 'streak_3', icon: '🔥', title: 'On Fire', desc: '3 day streak' },
  { id: 'streak_7', icon: '⚡', title: 'Week Warrior', desc: '7 day streak' },
  { id: 'streak_14', icon: '🏆', title: 'Two Week Champion', desc: '14 day streak' },
  { id: 'streak_30', icon: '👑', title: 'Month Master', desc: '30 day streak' },
  { id: 'lost_1kg', icon: '⚖️', title: 'First Kilo', desc: 'Lost your first kilogram' },
  { id: 'lost_5kg', icon: '🎯', title: 'Goal Crusher', desc: 'Lost 5 kilograms' },
  { id: 'workouts_10', icon: '🏅', title: 'Dedicated', desc: 'Completed 10 workouts' },
  { id: 'plan_complete', icon: '✅', title: 'Full Week', desc: 'Completed all 7 workouts in a week' },
  { id: 'calorie_goal_7', icon: '🥗', title: 'Nutrition Pro', desc: 'Hit calorie goal 7 days in a row' },
]

/**
 * Check and unlock badges based on current state
 */
export const checkBadges = async (userId, currentStreak = 0) => {
  // Get existing achievements
  const { data: existing } = await supabase
    .from('achievements')
    .select('badge_id')
    .eq('user_id', userId)

  const unlockedIds = new Set((existing || []).map((a) => a.badge_id))
  const newBadges = []

  // Streak badges
  const streakBadges = [
    { id: 'streak_3', threshold: 3 },
    { id: 'streak_7', threshold: 7 },
    { id: 'streak_14', threshold: 14 },
    { id: 'streak_30', threshold: 30 },
  ]
  for (const sb of streakBadges) {
    if (currentStreak >= sb.threshold && !unlockedIds.has(sb.id)) {
      newBadges.push(sb.id)
    }
  }

  // Check workout count badge
  const { count: workoutCount } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (workoutCount >= 1 && !unlockedIds.has('first_workout')) {
    newBadges.push('first_workout')
  }
  if (workoutCount >= 10 && !unlockedIds.has('workouts_10')) {
    newBadges.push('workouts_10')
  }

  // Check weight loss badges
  const { data: weightLogs } = await supabase
    .from('weight_logs')
    .select('weight_kg')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true })

  if (weightLogs && weightLogs.length >= 2) {
    const first = weightLogs[0].weight_kg
    const last = weightLogs[weightLogs.length - 1].weight_kg
    const lost = first - last
    if (lost >= 1 && !unlockedIds.has('lost_1kg')) newBadges.push('lost_1kg')
    if (lost >= 5 && !unlockedIds.has('lost_5kg')) newBadges.push('lost_5kg')
  }

  // Insert new badges
  for (const badgeId of newBadges) {
    await supabase.from('achievements').insert({
      user_id: userId,
      badge_id: badgeId,
    })
    // Also insert notification
    const badge = BADGES.find((b) => b.id === badgeId)
    if (badge) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'achievement',
        title: `🏅 Achievement Unlocked: ${badge.title}`,
        message: badge.desc,
      })
    }
  }

  return newBadges
}

/**
 * Unlock first_login badge (called on signup/first dashboard load)
 */
export const unlockFirstLogin = async (userId) => {
  const { data: existing } = await supabase
    .from('achievements')
    .select('badge_id')
    .eq('user_id', userId)
    .eq('badge_id', 'first_login')
    .single()

  if (!existing) {
    await supabase.from('achievements').insert({
      user_id: userId,
      badge_id: 'first_login',
    })
  }
}

/**
 * Unlock first_meal_log badge
 */
export const unlockFirstMealLog = async (userId) => {
  const { data: existing } = await supabase
    .from('achievements')
    .select('badge_id')
    .eq('user_id', userId)
    .eq('badge_id', 'first_meal_log')
    .single()

  if (!existing) {
    await supabase.from('achievements').insert({
      user_id: userId,
      badge_id: 'first_meal_log',
    })
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'achievement',
      title: '🏅 Achievement Unlocked: Fuel Up',
      message: 'Logged your first meal',
    })
  }
}
