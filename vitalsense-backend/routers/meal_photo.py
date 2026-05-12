"""
Meal Photo Analysis router — Gemini Vision for food recognition.
POST /api/analyze-meal-photo → analyzes a meal photo and returns nutritional info.
"""
import os
import json
import re
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class MealPhotoRequest(BaseModel):
    image_base64: str
    user_id: Optional[str] = None

@router.post("/")
async def analyze_meal_photo(request: MealPhotoRequest):
    """
    Analyze a meal photo using Gemini Vision API.
    Accepts base64 image, returns recognized dishes with nutritional info.
    """
    try:
        import google.generativeai as genai
        
        GEMINI_API_KEYS = [k.strip() for k in os.getenv("GEMINI_API_KEY", "").split(",") if k.strip()]
        last_error = None
        
        for api_key in GEMINI_API_KEYS:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-2.5-flash") 
                
                prompt = """Analyze this food photo. Identify the dish(es) visible.
                For each dish provide: name in English, Arabic name if it's Lebanese cuisine,
                estimated portion size, calories, protein (g), carbs (g), fat (g).
                If it's a Lebanese dish match it to one of these: [Shawarma Dajaj, Fattoush, Hommos bi tahini, Falafel, Tabboula, Warak enab, Kafta wa batata, Moujadara, Fattat Hommos, Loubia bil zet, Koussa mahchi, Yakhnat Bamia, Yakhnat Fassoulia, Riz a dajaj, Riz bi lahma, Kebba bil sayniya, Baba ghanouj, Sayadia, Malfouf mahchi, Moghrabia].
                Respond ONLY with valid JSON: { "dishes": [{ "name": "", "arabicName": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "portionSize": "", "confidence": "high/medium/low" }], "totalCalories": 0, "mealType": "breakfast/lunch/dinner/snack" }"""

                import base64
                image_bytes = base64.b64decode(request.image_base64)
                image_part = {"mime_type": "image/jpeg", "data": image_bytes}
                response = model.generate_content([prompt, image_part])

                text = response.text
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    print(f"[meal-photo] Raw response: {text}")
                    continue # try next key if JSON failed
            except Exception as e:
                print(f"[meal-photo] Key failed: {str(e)[:100]}")
                last_error = e
                continue
        if not response:
            try:
                from services.groq_service import ask_groq_vision
                print("[meal-photo] Falling back to Groq Vision...")
                groq_text = ask_groq_vision(prompt, request.image_base64)
                
                # Create a pseudo-response object
                class PseudoResponse:
                    def __init__(self, text):
                        self.text = text
                response = PseudoResponse(groq_text)
                print("[meal-photo] Success with Groq Vision")
            except Exception as groq_err:
                print(f"[meal-photo] Groq fallback failed: {str(groq_err)}")
                raise last_error or ValueError("All Gemini & Groq keys failed for meal analysis")

        text = response.text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            print(f"[meal-photo] Raw response: {text}")
            return {"dishes": [], "totalCalories": 0, "mealType": "unknown"}

    except Exception as e:
        print(f"[analyze-meal-photo] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Meal analysis failed: {str(e)}")
