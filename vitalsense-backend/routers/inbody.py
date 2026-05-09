import os
import json
import re
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.supabase_client import supabase

router = APIRouter()

class InBodyData(BaseModel):
    weight: float
    height: float
    age: int
    gender: str
    body_fat_pct: float
    muscle_mass_kg: float
    visceral_fat: int
    bmr: int
    water_pct: float

@router.post("/analyze")
async def analyze_inbody(data: InBodyData, current_user: dict = Depends(get_current_user)):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=500, detail="AI provider not configured")

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Analyze the following InBody body composition test results for a {data.age}-year-old {data.gender}:
        - Weight: {data.weight}kg
        - Height: {data.height}cm
        - Body Fat: {data.body_fat_pct}%
        - Skeletal Muscle Mass: {data.muscle_mass_kg}kg
        - Visceral Fat Level: {data.visceral_fat}
        - BMR: {data.bmr} kcal
        - Body Water: {data.water_pct}%

        Based on these results:
        1. Provide a professional analysis of their current body composition.
        2. Give 3-5 specific actionable advice to improve their results.
        3. Suggest a new daily calorie target and macro split (Protein/Carbs/Fat in grams).
        4. Identify any health risks (e.g., high visceral fat).

        Return ONLY a valid JSON object with these fields:
        {{
            "analysis": "Detailed text analysis",
            "advice": ["advice 1", "advice 2", ...],
            "recommended_targets": {{
                "calories": 0,
                "protein_g": 0,
                "carbs_g": 0,
                "fat_g": 0
            }},
            "score": 0, // A body composition score out of 100
            "focus_area": "e.g. Muscle Building, Fat Loss, Recomposition"
        }}
        """
        
        response = model.generate_content(prompt)
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if not match:
            # Fallback mock if AI fails
            analysis_data = {
                "analysis": "Body composition indicates a need for balanced nutrition and consistent training.",
                "advice": ["Increase protein intake", "Prioritize sleep", "Regular resistance training"],
                "recommended_targets": {"calories": 2000, "protein_g": 150, "carbs_g": 200, "fat_g": 60},
                "score": 70,
                "focus_area": "General Health"
            }
        else:
            analysis_data = json.loads(match.group())

        # Store the test in Supabase
        supabase.table("inbody_logs").insert({
            "user_id": current_user["id"],
            "weight": data.weight,
            "body_fat_pct": data.body_fat_pct,
            "muscle_mass_kg": data.muscle_mass_kg,
            "visceral_fat": data.visceral_fat,
            "bmr": data.bmr,
            "water_pct": data.water_pct,
            "analysis_result": analysis_data
        }).execute()

        # Update user profile with new targets if requested (handled in frontend usually)
        return analysis_data

    except Exception as e:
        print(f"InBody analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze InBody test")

@router.get("/history")
async def get_inbody_history(current_user: dict = Depends(get_current_user)):
    result = supabase.table("inbody_logs").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    return result.data
