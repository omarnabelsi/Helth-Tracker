"""
Meal Logs router — photo upload, AI food recognition, and daily summary.
"""
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from models.schemas import MealLogOut, TodayMealSummary
from services.supabase_client import supabase
from services.auth_service import get_current_user
from services.clarifai_service import recognize_food

router = APIRouter()


@router.post("/", response_model=MealLogOut, status_code=201)
async def log_meal(
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a meal photo → identify food via Clarifai →
    estimate macros → save to meal_logs → return result.
    """
    user_id = current_user["id"]
    file_bytes = await photo.read()

    # Upload photo to Supabase Storage bucket "meals"
    ext = photo.filename.split(".")[-1] if photo.filename else "jpg"
    file_name = f"{user_id}/{uuid.uuid4().hex}.{ext}"
    supabase.storage.from_("BUCKET_MEALS").upload(file_name, file_bytes)
    photo_url = f"{supabase.supabase_url}/storage/v1/object/public/BUCKET_MEALS/{file_name}"

    # Recognize the food using Clarifai
    try:
        recognition = recognize_food(file_bytes)
    except Exception as e:
        # Fallback if Clarifai fails
        recognition = {
            "food_name": "Unknown food",
            "calories": 0, "protein_g": 0,
            "carbs_g": 0, "fat_g": 0,
        }

    # Save meal log
    result = supabase.table("meal_logs").insert({
        "user_id": user_id,
        "food_name": recognition["food_name"],
        "photo_url": photo_url,
        "calories": recognition["calories"],
        "protein_g": recognition["protein_g"],
        "carbs_g": recognition["carbs_g"],
        "fat_g": recognition["fat_g"],
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save meal log")
    return result.data[0]


@router.get("/today", response_model=TodayMealSummary)
async def get_today_meals(current_user: dict = Depends(get_current_user)):
    """Return all meals logged today with aggregated totals."""
    today_str = date.today().isoformat()

    result = (
        supabase.table("meal_logs")
        .select("*")
        .eq("user_id", current_user["id"])
        .gte("logged_at", f"{today_str}T00:00:00")
        .lte("logged_at", f"{today_str}T23:59:59")
        .order("logged_at", desc=True)
        .execute()
    )
    meals = result.data or []

    total_cal = sum(m.get("calories", 0) or 0 for m in meals)
    total_p = sum(m.get("protein_g", 0) or 0 for m in meals)
    total_c = sum(m.get("carbs_g", 0) or 0 for m in meals)
    total_f = sum(m.get("fat_g", 0) or 0 for m in meals)

    return TodayMealSummary(
        meals=meals,
        total_calories=total_cal,
        total_protein_g=total_p,
        total_carbs_g=total_c,
        total_fat_g=total_f,
    )
