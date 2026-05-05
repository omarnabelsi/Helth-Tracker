"""
VitalSense AI — FastAPI Backend Entry Point
Registers all routers and configures CORS middleware.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables before anything else
load_dotenv()

# ── Startup env check ──
_required_env = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'GEMINI_API_KEY']
for _key in _required_env:
    if not os.getenv(_key):
        print(f"[ERROR] Missing env var: {_key}")
    else:
        print(f"[OK] {_key} loaded")

from routers import (
    auth,
    body_profile,
    health_conditions,
    goals,
    diet_plans,
    workout_plans,
    meal_logs,
    progress_snapshots,
    chat,
    generate_plan,
    progress_report,
    meal_photo,
    doctor_summary,
    weekly_report,
    analyze_progress_photo,
)

app = FastAPI(
    title="VitalSense AI",
    description="Health & body analysis platform backend",
    version="1.0.0",
)

# ── CORS — allow the frontend to call the API ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for Netlify deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──
app.include_router(auth.router,                prefix="/auth",                tags=["Auth"])
app.include_router(body_profile.router,         prefix="/body-profile",        tags=["Body Profile"])
app.include_router(health_conditions.router,    prefix="/health-conditions",   tags=["Health Conditions"])
app.include_router(goals.router,                prefix="/goals",               tags=["Goals"])
app.include_router(diet_plans.router,           prefix="/diet-plans",          tags=["Diet Plans"])
app.include_router(workout_plans.router,        prefix="/workout-plans",       tags=["Workout Plans"])
app.include_router(meal_logs.router,            prefix="/meal-logs",           tags=["Meal Logs"])
app.include_router(progress_snapshots.router,   prefix="/progress-snapshots",  tags=["Progress Snapshots"])
app.include_router(chat.router,                 prefix="/chat",                tags=["AI Chat"])
app.include_router(generate_plan.router,        prefix="/api/generate-plan",   tags=["Plan Generation"])
app.include_router(progress_report.router,      prefix="/api/progress-report", tags=["Progress Report"])
app.include_router(meal_photo.router,            prefix="/api/analyze-meal-photo", tags=["Meal Photo"])
app.include_router(doctor_summary.router,        prefix="/api/doctor-summary",  tags=["Doctor Summary"])
app.include_router(weekly_report.router,         prefix="/api/weekly-report",   tags=["Weekly Report"])
app.include_router(analyze_progress_photo.router,prefix="/api/analyze-progress-photo", tags=["Progress Photo Analysis"])


@app.get("/", tags=["Root"])
async def root():
    """Health-check / welcome endpoint."""
    return {"message": "VitalSense AI API is running 🚀"}
