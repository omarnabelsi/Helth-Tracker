-- Create inbody_logs table
CREATE TABLE IF NOT EXISTS public.inbody_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weight FLOAT NOT NULL,
    body_fat_pct FLOAT NOT NULL,
    muscle_mass_kg FLOAT NOT NULL,
    visceral_fat INT NOT NULL,
    bmr INT NOT NULL,
    water_pct FLOAT NOT NULL,
    analysis_result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.inbody_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own InBody logs" 
ON public.inbody_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own InBody logs" 
ON public.inbody_logs FOR SELECT 
USING (auth.uid() = user_id);
