"""
Workout Plans router — generate and retrieve workout plans.
"""
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import WorkoutPlanGenerateRequest, WorkoutPlanOut
from services.supabase_client import supabase
from services.auth_service import get_current_user
from services.plan_generator import generate_workout_plan

router = APIRouter()


@router.post("/generate", response_model=WorkoutPlanOut, status_code=201)
async def generate(body: WorkoutPlanGenerateRequest, current_user: dict = Depends(get_current_user)):
    """
    Generate a personalized weekly workout plan.
    Adapts exercises based on body type, goal, and health conditions.
    """
    user_id = current_user["id"]

    # Latest body profile
    bp_res = (
        supabase.table("body_profiles").select("*")
        .eq("user_id", user_id).order("scanned_at", desc=True).limit(1).execute()
    )
    if not bp_res.data:
        raise HTTPException(status_code=404, detail="Complete a body scan first")
    bp = bp_res.data[0]

    # Current goal
    goal_res = (
        supabase.table("goals").select("*")
        .eq("user_id", user_id).order("set_at", desc=True).limit(1).execute()
    )
    if not goal_res.data:
        raise HTTPException(status_code=404, detail="Set a goal first")
    goal = goal_res.data[0]

    # Health conditions
    conds = supabase.table("health_conditions").select("condition_name").eq("user_id", user_id).execute()
    condition_names = [c["condition_name"] for c in (conds.data or [])]

    # Generate plan
    plan = generate_workout_plan(
        bp.get("body_type"), goal["goal_type"],
        condition_names, body.intensity_level,
    )

    # Save to DB
    result = supabase.table("workout_plans").insert({
        "user_id": user_id, "goal_id": goal["id"],
        "weekly_exercises": plan["weekly_exercises"],
        "intensity_level": plan["intensity_level"],
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save workout plan")
    return result.data[0]


@router.get("/current", response_model=WorkoutPlanOut)
async def get_current_plan(current_user: dict = Depends(get_current_user)):
    """Return the latest workout plan for the user."""
    result = (
        supabase.table("workout_plans").select("*")
        .eq("user_id", current_user["id"])
        .order("generated_at", desc=True).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No workout plan found")
    return result.data[0]
