import os
import json
import re
import httpx
import google.generativeai as genai
from fastapi import APIRouter, Depends, Query
from services.auth_service import get_current_user
from utils.lebanese_data import LEBANESE_FOODS

router = APIRouter()

def search_local_db(query: str):
    query = query.lower()
    matches = []
    for food in LEBANESE_FOODS:
        if query in food["name"].lower() or query in food["arabicName"]:
            matches.append({
                "id": food["id"],
                "name": food["name"],
                "arabicName": food["arabicName"],
                "calories": food["calories"],
                "protein": food["protein"],
                "carbs": food["carbs"],
                "fat": food["fat"],
                "serving": food["serving"],
                "category": food["category"],
                "source": "local"
            })
    return matches[:10]

@router.get("/search-food")
async def search_food(query: str = Query(...), current_user: dict = Depends(get_current_user)):
    # Layer 1: Check Lebanese local DB first
    lebanese_match = search_local_db(query)
    if lebanese_match:
        return {"source": "local", "results": lebanese_match}

    # Layer 2: USDA FoodData Central
    usda_key = os.getenv("USDA_API_KEY")
    if usda_key and usda_key != "your_key":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.nal.usda.gov/fdc/v1/foods/search",
                    params={
                        "api_key": usda_key,
                        "query": query,
                        "dataType": "Survey (FNDDS), SR Legacy, Foundation",
                        "pageSize": 8
                    }
                )
                data = response.json()
                foods = data.get("foods", [])

                if foods:
                    results = []
                    for food in foods:
                        # Extract nutrients from the nutrient array
                        nutrients = { n["nutrientName"]: n["value"] for n in food.get("foodNutrients", []) }

                        # USDA nutrients can have different names depending on the dataset
                        calories = round(
                            nutrients.get("Energy", 0) or
                            nutrients.get("Energy (Atwater General Factors)", 0)
                        )
                        protein = round(nutrients.get("Protein", 0), 1)
                        carbs = round(nutrients.get("Carbohydrate, by difference", 0), 1)
                        fat = round(nutrients.get("Total lipid (fat)", 0), 1)

                        if calories == 0:
                            continue  # skip items with no calorie data

                        results.append({
                            "id": food.get("fdcId"),
                            "name": food.get("description", "").title(),
                            "arabicName": "",
                            "calories": calories,
                            "protein": protein,
                            "carbs": carbs,
                            "fat": fat,
                            "serving": "100g",
                            "category": food.get("foodCategory", "Generic"),
                            "source": "usda"
                        })

                    if results:
                        return {"source": "usda", "results": results}
        except Exception as e:
            print(f"USDA error: {e}")

    # Layer 3: Gemini fallback
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = f"""Give nutrition info per 100g for the dish: "{query}".
            Return ONLY a valid JSON array, no explanation, no markdown:
            [{{"name": "dish name", "calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "serving": "100g", "source": "ai_estimate"}}]
            Include 1 to 3 common variations if they exist."""
            
            response = model.generate_content(prompt)
            match = re.search(r'\[.*\]', response.text, re.DOTALL)
            if match:
                results = json.loads(match.group())
                # Add source and defaults to results
                for r in results:
                    r["source"] = "ai_estimate"
                    r["arabicName"] = ""
                return {"source": "gemini", "results": results}
        except Exception as e:
            print(f"Gemini fallback error: {e}")

    return {"source": "none", "results": []}

@router.post("/translate-food")
async def translate_food(request: dict, current_user: dict = Depends(get_current_user)):
    name = request.get("name")
    if not name:
        return {"arabicName": ""}
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = f"What is the Arabic name for {name}? Return only the Arabic name."
            response = model.generate_content(prompt)
            return {"arabicName": response.text.strip()}
        except Exception as e:
            print(f"Translation error: {e}")
    return {"arabicName": ""}
