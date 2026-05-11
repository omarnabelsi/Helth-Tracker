-- ============================================================
-- EMERGENCY FIX: Remove recursive admin RLS policies
-- Run this IMMEDIATELY in Supabase SQL Editor to fix 500 errors
-- ============================================================

-- STEP 1: Drop all broken recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;

-- STEP 2: Create a SECURITY DEFINER function that checks admin status
-- This bypasses RLS internally so there's NO infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- STEP 3: Re-create admin policies using the safe function (no recursion)

-- Profiles: admins can SELECT all rows
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Profiles: admins can DELETE any row
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Subscriptions: admins can SELECT all rows
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (public.is_admin());

-- Subscriptions: admins can UPDATE any row
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (public.is_admin());

-- Subscriptions: admins can INSERT
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (public.is_admin());

-- Done! The is_admin() function uses SECURITY DEFINER to bypass RLS
-- internally, so it won't cause infinite recursion.
