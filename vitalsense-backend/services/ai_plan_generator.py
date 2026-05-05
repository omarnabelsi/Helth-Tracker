"""
AI-powered plan generation using Google Gemini.
Generates a personalized weekly meal plan + workout plan
adapted to the user's medical conditions, using ONLY Lebanese dishes.
"""
import os
import json
import google.generativeai as genai
from typing import Optional
from services.exercise_db import EXERCISES

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-1.5-pro"

# ── Full Lebanese Food Database with Macros for AI Precision ──
LEBANESE_FOODS_DB = [
    {"name": "Baba Ghanouj", "arabic": "بابا غنوج", "cal": 180, "p": 4, "c": 12, "f": 14},
    {"name": "Batata Mahchi", "arabic": "بطاطا محشي", "cal": 320, "p": 12, "c": 38, "f": 14},
    {"name": "Borgul bi Banadoura", "arabic": "برغل بالبندورة", "cal": 260, "p": 8, "c": 48, "f": 5},
    {"name": "Chichbarak", "arabic": "شيشبرك", "cal": 380, "p": 18, "c": 35, "f": 18},
    {"name": "Falafel", "arabic": "فلافل", "cal": 340, "p": 14, "c": 32, "f": 18},
    {"name": "Fatayer Sabanikh", "arabic": "فطاير سبانخ", "cal": 280, "p": 8, "c": 30, "f": 14},
    {"name": "Fattat Hommos", "arabic": "فتّة حمّص", "cal": 420, "p": 16, "c": 42, "f": 22},
    {"name": "Fattoush", "arabic": "فتّوش", "cal": 180, "p": 4, "c": 22, "f": 9},
    {"name": "Foul Moudamas", "arabic": "فول مدمّس", "cal": 280, "p": 16, "c": 38, "f": 6},
    {"name": "Hindbe bil Zet", "arabic": "هندبة بالزيت", "cal": 150, "p": 4, "c": 8, "f": 12},
    {"name": "Hommos bi Tahini", "arabic": "حمّص بالطحينة", "cal": 350, "p": 12, "c": 32, "f": 20},
    {"name": "Kafta wa Batata", "arabic": "كفتة وبطاطا", "cal": 450, "p": 24, "c": 30, "f": 26},
    {"name": "Kebba bil Sayniya", "arabic": "كبّة بالصينية", "cal": 420, "p": 22, "c": 28, "f": 24},
    {"name": "Koussa Mahchi", "arabic": "كوسا محشي", "cal": 310, "p": 14, "c": 28, "f": 16},
    {"name": "Lahm bil Ajin", "arabic": "لحم بعجين", "cal": 380, "p": 18, "c": 38, "f": 16},
    {"name": "Loubia bil Zet", "arabic": "لوبيا بالزيت", "cal": 220, "p": 8, "c": 28, "f": 10},
    {"name": "Malfouf Mahchi", "arabic": "ملفوف محشي", "cal": 300, "p": 12, "c": 32, "f": 14},
    {"name": "Moujadara", "arabic": "مجدّرة", "cal": 340, "p": 14, "c": 52, "f": 8},
    {"name": "Moghrabia", "arabic": "مغربية", "cal": 450, "p": 22, "c": 50, "f": 18},
    {"name": "Mousaka Batinjan", "arabic": "مسقعة باذنجان", "cal": 350, "p": 12, "c": 24, "f": 24},
    {"name": "Riz a Dajaj", "arabic": "رز بالدجاج", "cal": 480, "p": 32, "c": 52, "f": 14},
    {"name": "Riz bi Lahma", "arabic": "رز باللحمة", "cal": 520, "p": 28, "c": 55, "f": 20},
    {"name": "Sayadia", "arabic": "صيادية", "cal": 440, "p": 30, "c": 45, "f": 14},
    {"name": "Shawarma Dajaj", "arabic": "شاورما دجاج", "cal": 420, "p": 28, "c": 38, "f": 16},
    {"name": "Shawarma Lahma", "arabic": "شاورما لحمة", "cal": 480, "p": 26, "c": 36, "f": 24},
    {"name": "Tabboula", "arabic": "تبّولة", "cal": 120, "p": 3, "c": 16, "f": 5},
    {"name": "Warak Enab", "arabic": "ورق عنب", "cal": 280, "p": 8, "c": 32, "f": 14},
    {"name": "Yakhnat Bamia", "arabic": "يخنة بامية", "cal": 350, "p": 20, "c": 22, "f": 20},
    {"name": "Yakhnat Fassoulia", "arabic": "يخنة فاصوليا", "cal": 380, "p": 22, "c": 30, "f": 18},
    {"name": "Yakhnat Mouloukhia", "arabic": "يخنة ملوخية", "cal": 360, "p": 24, "c": 18, "f": 22},
    {"name": "Beid bil Awarma (Eggs)", "arabic": "بيض بالقاورما", "cal": 350, "p": 22, "c": 4, "f": 28},
    {"name": "Grilled Steak", "arabic": "ستيك مشوي", "cal": 450, "p": 52, "c": 0, "f": 24},
    {"name": "Grilled Chicken", "arabic": "دجاج مشوي", "cal": 380, "p": 48, "c": 0, "f": 18},
    {"name": "Labneh", "arabic": "لبنة", "cal": 120, "p": 8, "c": 6, "f": 8},
    {"name": "Manoushe Zaatar", "arabic": "منقوشة زعتر", "cal": 320, "p": 8, "c": 42, "f": 14},
    {"name": "Baklava Mixed", "arabic": "بقلاوة مشكّلة", "cal": 350, "p": 6, "c": 42, "f": 18},
    {"name": "Halawa", "arabic": "حلاوة", "cal": 310, "p": 8, "c": 28, "f": 20},
    {"name": "Mouhallabiya", "arabic": "مهلّبيّة", "cal": 200, "p": 6, "c": 30, "f": 6},
    {"name": "Riz bil Halib", "arabic": "رز بالحليب", "cal": 220, "p": 6, "c": 36, "f": 6},
]

def generate_full_plan(
    age: int, gender: str, weight: float, height: float, tdee: float,
    calorie_target: float, goal: str, weekly_loss_target: Optional[str],
    medical_conditions: Optional[str], activity_level: str,
    gym_type: Optional[str] = "home", equipment_list: Optional[list] = None
) -> dict:
    # Filter exercises
    filtered_exercises = [ex['name'] for ex in EXERCISES if ex['gymRequired'] == gym_type or (gym_type == 'big_gym' and ex['gymRequired'] in ['home', 'small_gym']) or (gym_type == 'small_gym' and ex['gymRequired'] == 'home')]
    filtered_exercise_list = ", ".join(filtered_exercises)
    equipment_str = ", ".join(equipment_list) if equipment_list else "None specified"

    # Macro targets (30% P, 40% C, 30% F)
    target_p = int((calorie_target * 0.3) / 4)
    target_c = int((calorie_target * 0.4) / 4)
    target_f = int((calorie_target * 0.3) / 9)

    food_db_json = json.dumps(LEBANESE_FOODS_DB)

    prompt = f"""You are a professional nutritionist. Generate a weekly plan (Mon-Sun).
User Profile: Age {age}, {gender}, {weight}kg, {height}cm. 
DAILY TARGETS: {calorie_target} kcal, Protein: {target_p}g, Carbs: {target_c}g, Fat: {target_f}g.

CRITICAL INSTRUCTION: You MUST fill EXACTLY 100% of the daily targets. 
NEVER leave calories or macros "remaining". If one dish isn't enough, you MUST add 2, 3, or 4 dishes to a single meal until the total hits the target.
For example, if a meal needs 800 kcal, combine several dishes from the list below.

Use ONLY these Lebanese foods (with these EXACT nutritional values):
{food_db_json}

Each day must have 4 meals: Breakfast (25%), Lunch (35%), Dinner (30%), Snack (10%).
Total daily sum MUST equal {calorie_target} kcal (+/- 20 kcal).

Workout Plan: gym_type {gym_type}, equipment: {equipment_str}, conditions: {medical_conditions}.
Approved Exercises: {filtered_exercise_list}.

Return valid JSON:
{{
  "weeklyMealPlan": {{
    "Monday": [
      {{ "meal": "Breakfast", "dishes": [{{ "name": "...", "arabicName": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }}] }},
      ...
    ],
    ...
  }},
  "weeklyWorkoutPlan": [{{ "day": "Monday", "dayType": "...", "workoutName": "...", "exercises": [...] }}],
  "healthWarnings": [],
  "coachTip": "..."
}}"""

    models_to_try = [MODEL_NAME, "gemini-1.5-flash"]
    last_error = None

    for model_id in models_to_try:
        try:
            model = genai.GenerativeModel(
                model_name=model_id,
                generation_config={"temperature": 0.4, "response_mime_type": "application/json"},
            )
            response = model.generate_content(prompt)
            raw = response.text.strip()
            
            # More robust JSON extraction
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0]
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0]
            
            raw = raw.strip()
            # If empty, skip
            if not raw: continue
            
            return json.loads(raw)
        except Exception as e:
            print(f"Error with model {model_id}: {str(e)}")
            last_error = e
            continue

    raise last_error or ValueError("Failed to generate diet after multiple attempts.")
