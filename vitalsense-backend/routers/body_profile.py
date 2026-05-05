"""
Body Profile router — create a scan and retrieve the latest one.
"""
import uuid, json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional, List
from models.schemas import BodyProfileOut
from services.supabase_client import supabase
from services.auth_service import get_current_user

router = APIRouter()


@router.post("/", response_model=BodyProfileOut, status_code=201)
async def create_body_profile(
    weight_kg: float = Form(...),
    height_cm: float = Form(...),
    age: int = Form(...),
    sex: str = Form(...),
    body_type: Optional[str] = Form(None),
    body_fat_pct: Optional[float] = Form(None),
    posture_flags: Optional[str] = Form(None),  # JSON string from frontend
    selfie: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Receive body scan results + selfie file.
    Upload selfie to Supabase Storage, then save profile row.
    """
    user_id = current_user["id"]

    # Upload selfie to Supabase Storage bucket "selfies"
    file_ext = selfie.filename.split(".")[-1] if selfie.filename else "jpg"
    file_name = f"{user_id}/{uuid.uuid4().hex}.{file_ext}"
    file_bytes = await selfie.read()

    supabase.storage.from_("BUCKET_SELFIES").upload(file_name, file_bytes)
    selfie_url = f"{supabase.supabase_url}/storage/v1/object/public/BUCKET_SELFIES/{file_name}"

    # Parse posture flags from JSON string
    flags = json.loads(posture_flags) if posture_flags else []

    # Insert body profile row
    result = supabase.table("body_profiles").insert({
        "user_id": user_id,
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "age": age,
        "sex": sex,
        "body_type": body_type,
        "body_fat_pct": body_fat_pct,
        "posture_flags": flags,
        "selfie_url": selfie_url,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save body profile")

    return result.data[0]


@router.get("/latest", response_model=BodyProfileOut)
async def get_latest_body_profile(current_user: dict = Depends(get_current_user)):
    """Return the most recent body scan for the authenticated user."""
    result = (
        supabase.table("body_profiles")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("scanned_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No body profile found")
    return result.data[0]
