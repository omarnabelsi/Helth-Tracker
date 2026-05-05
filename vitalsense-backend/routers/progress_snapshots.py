"""
Progress Snapshots router — track body changes over time.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from models.schemas import ProgressSnapshotOut
from services.supabase_client import supabase
from services.auth_service import get_current_user
from services.gemini_service import generate_progress_comparison

router = APIRouter()


@router.post("/", response_model=ProgressSnapshotOut, status_code=201)
async def create_snapshot(
    weight_kg: float = Form(...),
    body_fat_pct: Optional[float] = Form(None),
    selfie: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a progress selfie + current weight →
    compare to previous snapshot via Gemini →
    save snapshot with AI comparison text.
    """
    user_id = current_user["id"]

    # Upload selfie to Supabase Storage bucket "progress"
    ext = selfie.filename.split(".")[-1] if selfie.filename else "jpg"
    file_name = f"{user_id}/{uuid.uuid4().hex}.{ext}"
    file_bytes = await selfie.read()
    supabase.storage.from_("BUCKET_PROGRESS").upload(file_name, file_bytes)
    selfie_url = f"{supabase.supabase_url}/storage/v1/object/public/BUCKET_PROGRESS/{file_name}"

    # Fetch previous snapshot for comparison
    prev_res = (
        supabase.table("progress_snapshots")
        .select("*").eq("user_id", user_id)
        .order("taken_at", desc=True).limit(1).execute()
    )
    previous = prev_res.data[0] if prev_res.data else None

    current_data = {"weight_kg": weight_kg, "body_fat_pct": body_fat_pct}

    # Generate AI comparison using Gemini
    try:
        ai_comparison = generate_progress_comparison(previous, current_data)
    except Exception:
        ai_comparison = "Comparison unavailable at this time."

    # Save snapshot
    result = supabase.table("progress_snapshots").insert({
        "user_id": user_id,
        "weight_kg": weight_kg,
        "body_fat_pct": body_fat_pct,
        "selfie_url": selfie_url,
        "ai_comparison": ai_comparison,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save snapshot")
    return result.data[0]


@router.get("/", response_model=List[ProgressSnapshotOut])
async def list_snapshots(current_user: dict = Depends(get_current_user)):
    """Return all progress snapshots ordered by date."""
    result = (
        supabase.table("progress_snapshots")
        .select("*").eq("user_id", current_user["id"])
        .order("taken_at", desc=True).execute()
    )
    return result.data or []
