"""
Doctor Summary router — Generates a medical summary using Gemini.
POST /api/doctor-summary → generates a concise medical summary for a doctor.
"""
import os
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.gemini_service import ask_gemini

router = APIRouter()

class DoctorSummaryRequest(BaseModel):
    user_id: str
    name: str
    age: Optional[int] = None
    weight: Optional[float] = None
    conditions: Optional[str] = None
    symptom: str

@router.post("/")
async def generate_doctor_summary(body: DoctorSummaryRequest):
    """
    Generate a concise medical summary for a doctor visit.
    """
    prompt = (
        f"Generate a concise medical summary for a doctor. "
        f"Patient: {body.name}, Age: {body.age or 'unknown'}, "
        f"Weight: {body.weight or 'unknown'}kg, "
        f"Medical conditions: {body.conditions or 'None reported'}. "
        f"Reported symptom: \"{body.symptom}\". "
        f"Include: symptom description, relevant health context, "
        f"current medications/conditions, and a request for urgent evaluation. "
        f"Keep it under 200 words, professional medical language."
    )

    try:
        summary = ask_gemini(
            "You are a medical documentation assistant. Generate professional medical summaries.",
            [],
            prompt
        )
        return {"summary": summary}
    except Exception as e:
        print(f"[doctor-summary] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")
