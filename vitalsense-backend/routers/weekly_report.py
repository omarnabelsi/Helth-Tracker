"""
Weekly Report router — Generates AI weekly insight reports.
POST /api/weekly-report → generates and stores a weekly health report.
"""
import os
import traceback
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from services.gemini_service import ask_gemini

router = APIRouter()

class WeeklyReportRequest(BaseModel):
    user_id: str

@router.post("/")
async def generate_weekly_report(body: WeeklyReportRequest):
    """
    Generate an AI weekly insight report for a user.
    Fetches last 7 days of data and calls Gemini.
    """
    user_id = body.user_id
    today = datetime.utcnow()
    week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
    seven_days_ago = (today - timedelta(days=7)).isoformat()

    # Check if report already exists for this week
    existing = supabase.table("weekly_reports").select("*").eq("user_id", user_id).eq("week_start", week_start).execute()
    if existing.data:
        return existing.data[0]

    # Fetch profile
    prof_res = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    profile = prof_res.data if prof_res.data else {}

    # Fetch last 7 days workout logs
    workout_res = supabase.table("workout_logs").select("*").eq("user_id", user_id).gte("date", seven_days_ago[:10]).execute()
    workout_count = len(workout_res.data) if workout_res.data else 0

    # Fetch weight entries
    weight_res = supabase.table("weight_logs").select("*").eq("user_id", user_id).gte("logged_at", seven_days_ago).order("logged_at", desc=False).execute()
    weights = weight_res.data or []
    start_weight = weights[0]["weight_kg"] if weights else profile.get("weight", "unknown")
    end_weight = weights[-1]["weight_kg"] if weights else profile.get("weight", "unknown")

    # Fetch streak
    streak_res = supabase.table("streaks").select("current_streak").eq("user_id", user_id).single().execute()
    streak = streak_res.data.get("current_streak", 0) if streak_res.data else 0

    calorie_target = profile.get("calorie_target", 2000)
    goal = profile.get("goal", "improve health")
    name = profile.get("name", "User")

    prompt = (
        f"Generate a weekly health insight report for this user. "
        f"Name: {name}. Last 7 days: "
        f"Workouts completed: {workout_count}/7, "
        f"Average daily calories: estimated vs target {calorie_target} kcal, "
        f"Weight change: {start_weight}kg to {end_weight}kg, "
        f"Current streak: {streak} days. "
        f"Goal: {goal}. "
        f"Write 3 sections: "
        f"1) What went well (2 sentences), "
        f"2) What to improve (2 sentences), "
        f"3) This week's focus tip (1 sentence). "
        f"Warm, motivational tone. Address the user by name."
    )

    try:
        report_text = ask_gemini(
            "You are VitalSense AI, a supportive and knowledgeable health coach.",
            [],
            prompt
        )
    except Exception as e:
        print(f"[weekly-report] Gemini error: {traceback.format_exc()}")
        report_text = f"Hey {name}! Keep up the great work this week. Stay consistent with your meals and workouts!"

    # Save to Supabase
    result = supabase.table("weekly_reports").insert({
        "user_id": user_id,
        "week_start": week_start,
        "report_text": report_text,
    }).execute()

    if result.data:
        return result.data[0]
    return {"user_id": user_id, "week_start": week_start, "report_text": report_text}


@router.get("/{user_id}")
async def get_weekly_report(user_id: str):
    """Return the latest weekly report for a user."""
    today = datetime.utcnow()
    week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')

    result = supabase.table("weekly_reports").select("*").eq("user_id", user_id).eq("week_start", week_start).execute()
    if result.data:
        return result.data[0]
    return None
