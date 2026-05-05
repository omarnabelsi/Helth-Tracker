"""
Health Conditions router — CRUD for user conditions.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.schemas import HealthConditionCreate, HealthConditionOut
from services.supabase_client import supabase
from services.auth_service import get_current_user

router = APIRouter()


@router.post("/", response_model=HealthConditionOut, status_code=201)
async def add_condition(body: HealthConditionCreate, current_user: dict = Depends(get_current_user)):
    """Add a health condition for the authenticated user."""
    result = supabase.table("health_conditions").insert({
        "user_id": current_user["id"],
        "condition_name": body.condition_name,
        "severity": body.severity,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add condition")
    return result.data[0]


@router.get("/", response_model=List[HealthConditionOut])
async def list_conditions(current_user: dict = Depends(get_current_user)):
    """Return all health conditions for the authenticated user."""
    result = (
        supabase.table("health_conditions")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("added_at", desc=True)
        .execute()
    )
    return result.data or []


@router.delete("/{condition_id}", status_code=204)
async def remove_condition(condition_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a health condition (only if it belongs to the user)."""
    # Verify ownership
    existing = (
        supabase.table("health_conditions")
        .select("id")
        .eq("id", condition_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Condition not found")

    supabase.table("health_conditions").delete().eq("id", condition_id).execute()
    return None
