-- 1. Create the missing inbody_logs table
CREATE TABLE IF NOT EXISTS public.inbody_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight numeric NOT NULL,
  body_fat_pct numeric NOT NULL,
  muscle_mass_kg numeric NOT NULL,
  visceral_fat integer NOT NULL,
  bmr integer NOT NULL,
  water_pct numeric NOT NULL,
  analysis_result jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS and create policies for inbody_logs
ALTER TABLE public.inbody_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own inbody logs" ON public.inbody_logs;
CREATE POLICY "Users can manage own inbody logs" ON public.inbody_logs FOR ALL USING (auth.uid() = user_id);

-- 3. Fix Streaks RLS (406 Error)
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own streaks" ON public.streaks;
CREATE POLICY "Users can manage own streaks" ON public.streaks FOR ALL USING (auth.uid() = user_id);
