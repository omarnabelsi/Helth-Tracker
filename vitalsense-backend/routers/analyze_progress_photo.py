import os
import google.generativeai as genai
import json
import re
import traceback
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class PhotoRequest(BaseModel):
    image_base64: str

@router.post("")
async def analyze_photo(request: PhotoRequest):
    try:
        GEMINI_API_KEYS = [k.strip() for k in os.getenv("GEMINI_API_KEY", "").split(",") if k.strip()]
        MODEL_CHAIN = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-3.1-flash-lite",
        ]

        prompt = """Analyze this fitness progress photo of a person's physique. 
        Estimate their body fat percentage based on visual cues (e.g., muscle definition, abs visibility, vascularity).
        Provide a 2-3 word short label for 'notes' (e.g., "Visible Definition", "Leaning Out", "Bulk Phase", "Starting Out").
        Respond ONLY with valid JSON in this exact format: { "body_fat_pct": 18.5, "notes": "Visible Definition" }"""

        image_bytes = base64.b64decode(request.image_base64)
        image_part = {"mime_type": "image/jpeg", "data": image_bytes}

        response = None
        last_error = None
        
        # Try all keys
        for api_key in GEMINI_API_KEYS:
            genai.configure(api_key=api_key)
            # Try all models for this key
            for model_name in MODEL_CHAIN:
                try:
                    print(f"[analyze-progress-photo] Trying {model_name} with key ...{api_key[-4:]}...")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(
                        [prompt, image_part],
                        generation_config={"temperature": 0.0}
                    )
                    print(f"[analyze-progress-photo] Success with {model_name}")
                    break
                except Exception as e:
                    print(f"[analyze-progress-photo] {model_name} failed: {str(e)[:100]}")
                    last_error = e
                    continue
            if response:
                break

        if not response:
            try:
                from services.groq_service import ask_groq_vision
                print("[analyze-progress-photo] Falling back to Groq Vision...")
                groq_text = ask_groq_vision(prompt, request.image_base64)
                
                # Create a pseudo-response object to reuse existing logic
                class PseudoResponse:
                    def __init__(self, text):
                        self.text = text
                response = PseudoResponse(groq_text)
                print("[analyze-progress-photo] Success with Groq Vision")
            except Exception as groq_err:
                print(f"[analyze-progress-photo] Groq fallback failed: {str(groq_err)}")
                raise Exception(f"All AI models exhausted (Gemini & Groq). Last error: {last_error}")

        text = response.text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            print(f"[analyze-progress-photo] Could not parse JSON. Raw text: {text}")
            return {"body_fat_pct": None, "notes": "Snapshot"}

    except Exception as e:
        print(f"[analyze-progress-photo] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
