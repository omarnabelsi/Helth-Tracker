"""
Generate Plan router — AI-powered full plan generation using Gemini.
POST /generate-plan → generates meal + workout plan adapted to medical conditions.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.supabase_client import supabase
from services.ai_plan_generator import generate_full_plan

router = APIRouter()


class GeneratePlanRequest(BaseModel):
    """Request body for /api/generate-plan."""
    user_id: str
    age: int = Field(..., gt=0)
    gender: str = Field(..., pattern="^(male|female)$")
    weight: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    tdee: float = Field(..., gt=0)
    calorie_target: float = Field(..., gt=0)
    goal: str = Field(..., pattern="^(lose_fat|build_muscle|improve_health)$")
    weekly_loss_target: Optional[str] = None
    medical_conditions: Optional[str] = None
    activity_level: str = Field(
        default="moderate",
        pattern="^(sedentary|light|moderate|active|very_active)$",
    )
    gym_type: Optional[str] = "home"
    equipment_list: Optional[list] = None


class GeneratePlanResponse(BaseModel):
    """Response from plan generation."""
    id: str
    user_id: str
    plan_data: dict
    created_at: Optional[str] = None


@router.post("", response_model=GeneratePlanResponse, status_code=201)
async def generate_plan(body: GeneratePlanRequest):
    """
    Generate a personalized weekly meal + workout plan using Gemini AI.
    Stores the result in the 'plans' table.
    """
    import traceback
    try:
        print(f"[DEBUG] Starting plan generation for user {body.user_id}...")
        plan_data = generate_full_plan(
            age=body.age,
            gender=body.gender,
            weight=body.weight,
            height=body.height,
            tdee=body.tdee,
            calorie_target=body.calorie_target,
            goal=body.goal,
            weekly_loss_target=body.weekly_loss_target,
            medical_conditions=body.medical_conditions,
            activity_level=body.activity_level,
            gym_type=body.gym_type,
            equipment_list=body.equipment_list,
        )
        print(f"[DEBUG] AI generation successful.")
    except Exception as e:
        print(f"[ERROR] AI generation failed:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI plan generation failed: {str(e)}")

    # Ensure only 1 master plan exists per user: Delete old entries first
    try:
        supabase.table("plans").delete().eq("user_id", body.user_id).execute()
    except Exception as e:
        print(f"[WARNING] Failed to delete old plans: {e}")
        pass # Ignore if none exist

    # Store the new plan
    payload = {
        "user_id": body.user_id,
        "plan_data": plan_data,
    }
    
    try:
        payload["user_profile"] = {
            "age": body.age,
            "gender": body.gender,
            "weight": body.weight,
            "height": body.height,
            "tdee": body.tdee,
            "calorie_target": body.calorie_target,
            "goal": body.goal,
            "weekly_loss_target": body.weekly_loss_target,
            "medical_conditions": body.medical_conditions,
            "activity_level": body.activity_level,
            "gym_type": body.gym_type,
            "equipment_list": body.equipment_list,
        }
        print(f"[DEBUG] Attempting to save plan to DB...")
        result = supabase.table("plans").insert(payload).execute()
        print(f"[DEBUG] DB save result: {result.data is not None}")
    except Exception as e:
        print(f"[WARNING] Failed to save with user_profile: {e}")
        # Fallback if user_profile column is missing
        if "user_profile" in payload:
            del payload["user_profile"]
        result = supabase.table("plans").insert(payload).execute()

    if not result.data:
        print(f"[ERROR] Final DB insert failed - result.data is empty")
        raise HTTPException(status_code=500, detail="Failed to save plan to database")

    print(f"[DEBUG] Plan generation complete.")
    return result.data[0]


@router.get("/current/{user_id}")
async def get_current_plan(user_id: str):
    """Return the latest generated plan for a user."""
    result = (
        supabase.table("plans").select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No plan found. Complete onboarding first.")
    return result.data[0]
