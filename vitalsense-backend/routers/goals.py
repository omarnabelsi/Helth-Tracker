"""
Goals router — set a goal and auto-trigger plan generation.
"""
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import GoalCreate, GoalOut
from services.supabase_client import supabase
from services.auth_service import get_current_user
from services.plan_generator import generate_diet_plan, generate_workout_plan

router = APIRouter()


@router.post("/", response_model=GoalOut, status_code=201)
async def set_goal(body: GoalCreate, current_user: dict = Depends(get_current_user)):
    """
    Save a new goal and automatically generate diet + workout plans.
    Requires an existing body profile.
    """
    user_id = current_user["id"]

    # Insert the goal
    goal_result = supabase.table("goals").insert({
        "user_id": user_id,
        "goal_type": body.goal_type,
        "target_weight_kg": body.target_weight_kg,
    }).execute()
    if not goal_result.data:
        raise HTTPException(status_code=500, detail="Failed to save goal")
    goal = goal_result.data[0]

    # Fetch latest body profile for plan generation
    profile = (
        supabase.table("body_profiles")
        .select("*").eq("user_id", user_id)
        .order("scanned_at", desc=True).limit(1).execute()
    )
    if not profile.data:
        return goal  # no profile yet — plans will be generated later

    bp = profile.data[0]

    # Fetch health conditions
    conds = supabase.table("health_conditions").select("condition_name").eq("user_id", user_id).execute()
    condition_names = [c["condition_name"] for c in (conds.data or [])]

    # Generate and save diet plan
    diet = generate_diet_plan(
        bp["weight_kg"], bp["height_cm"], bp["age"], bp["sex"],
        body.goal_type, condition_names,
    )
    supabase.table("diet_plans").insert({
        "user_id": user_id, "goal_id": goal["id"],
        "weekly_meals": diet["weekly_meals"],
        "daily_calories": diet["daily_calories"],
        "protein_g": diet["protein_g"],
        "carbs_g": diet["carbs_g"],
        "fat_g": diet["fat_g"],
    }).execute()

    # Generate and save workout plan
    workout = generate_workout_plan(
        bp.get("body_type"), body.goal_type, condition_names,
    )
    supabase.table("workout_plans").insert({
        "user_id": user_id, "goal_id": goal["id"],
        "weekly_exercises": workout["weekly_exercises"],
        "intensity_level": workout["intensity_level"],
    }).execute()

    return goal


@router.get("/current", response_model=GoalOut)
async def get_current_goal(current_user: dict = Depends(get_current_user)):
    """Return the user's most recent goal."""
    result = (
        supabase.table("goals")
        .select("*").eq("user_id", current_user["id"])
        .order("set_at", desc=True).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No goal found")
    return result.data[0]
