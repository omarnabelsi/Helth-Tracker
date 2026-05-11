-- ============================================================
-- VitalSense AI — Subscription System + Admin Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own subscription" ON public.subscriptions;
CREATE POLICY "Users see own subscription" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 2. Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_free_subscription();

-- 3. Backfill free subscriptions for existing users
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 4. Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 5. Set admin account (replace email if needed)
UPDATE public.profiles SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'omarnabelsi12@gmail.com');

-- 6. Admin stats view
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'premium') AS premium_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'free') AS free_users,
  (SELECT COUNT(*) FROM public.meal_logs WHERE logged_at > NOW() - INTERVAL '7 days') AS meals_logged_week,
  (SELECT COUNT(*) FROM public.workout_logs WHERE date > NOW() - INTERVAL '7 days') AS workouts_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_week;

-- 7. Grant select on admin_stats to authenticated role
GRANT SELECT ON public.admin_stats TO authenticated;
