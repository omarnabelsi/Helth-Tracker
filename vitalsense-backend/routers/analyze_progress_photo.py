import os
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
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        MODEL_CHAIN = [
            "gemini-2.5-flash-lite",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.5-flash",
        ]

        prompt = """Analyze this fitness progress photo of a person's physique. 
        Estimate their body fat percentage based on visual cues (e.g., muscle definition, abs visibility, vascularity).
        Provide a 2-3 word short label for 'notes' (e.g., "Visible Definition", "Leaning Out", "Bulk Phase", "Starting Out").
        Respond ONLY with valid JSON in this exact format: { "body_fat_pct": 18.5, "notes": "Visible Definition" }"""

        image_bytes = base64.b64decode(request.image_base64)
        image_part = {"mime_type": "image/jpeg", "data": image_bytes}

        response = None
        last_error = None
        for model_name in MODEL_CHAIN:
            try:
                print(f"[analyze-progress-photo] Trying {model_name}...")
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
                if "429" in str(e) or "quota" in str(e).lower():
                    continue
                else:
                    raise

        if not response:
            raise Exception(f"All Gemini models exhausted. Last error: {last_error}")

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
