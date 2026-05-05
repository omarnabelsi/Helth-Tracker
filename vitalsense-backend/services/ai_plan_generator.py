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
MODEL_NAME = "gemini-flash-latest"

# ── Full Lebanese Food Database with Macros for AI Precision (Per 100g) ──
LEBANESE_FOODS_DB = [
    {"name": "Baba Ghanouj", "arabic": "بابا غنوج", "cal100": 90, "p100": 2, "c100": 6, "f100": 7},
    {"name": "Batata Mahchi", "arabic": "بطاطا محشي", "cal100": 128, "p100": 4.8, "c100": 15.2, "f100": 5.6},
    {"name": "Borgul bi Banadoura", "arabic": "برغل بالبندورة", "cal100": 130, "p100": 4, "c100": 24, "f100": 2.5},
    {"name": "Chichbarak", "arabic": "شيشبرك", "cal100": 126, "p100": 6, "c100": 11.6, "f100": 6},
    {"name": "Falafel", "arabic": "فلافل", "cal100": 226, "p100": 9.3, "c100": 21.3, "f100": 12},
    {"name": "Fatayer Sabanikh", "arabic": "فطاير سبانخ", "cal100": 186, "p100": 5.3, "c100": 20, "f100": 9.3},
    {"name": "Fattat Hommos", "arabic": "فتّة حمّص", "cal100": 120, "p100": 4.5, "c100": 12, "f100": 6.2},
    {"name": "Fattoush", "arabic": "فتّوش", "cal100": 60, "p100": 1.3, "c100": 7.3, "f100": 3},
    {"name": "Foul Moudamas", "arabic": "فول مدمّس", "cal100": 112, "p100": 6.4, "c100": 15.2, "f100": 2.4},
    {"name": "Hindbe bil Zet", "arabic": "هندبة بالزيت", "cal100": 75, "p100": 2, "c100": 4, "f100": 6},
    {"name": "Hommos bi Tahini", "arabic": "حمّص بالطحينة", "cal100": 175, "p100": 6, "c100": 16, "f100": 10},
    {"name": "Kafta wa Batata", "arabic": "كفتة وبطاطا", "cal100": 128, "p100": 6.8, "c100": 8.5, "f100": 7.4},
    {"name": "Kebba bil Sayniya", "arabic": "كبّة بالصينية", "cal100": 210, "p100": 11, "c100": 14, "f100": 12},
    {"name": "Koussa Mahchi", "arabic": "كوسا محشي", "cal100": 124, "p100": 5.6, "c100": 11.2, "f100": 6.4},
    {"name": "Lahm bil Ajin", "arabic": "لحم بعجين", "cal100": 211, "p100": 10, "c100": 21, "f100": 8.8},
    {"name": "Loubia bil Zet", "arabic": "لوبيا بالزيت", "cal100": 88, "p100": 3.2, "c100": 11.2, "f100": 4},
    {"name": "Malfouf Mahchi", "arabic": "ملفوف محشي", "cal100": 120, "p100": 4.8, "c100": 12.8, "f100": 5.6},
    {"name": "Moujadara", "arabic": "مجدّرة", "cal100": 113, "p100": 4.6, "c100": 17.3, "f100": 2.6},
    {"name": "Moghrabia", "arabic": "مغربية", "cal100": 112, "p100": 5.5, "c100": 12.5, "f100": 4.5},
    {"name": "Mousaka Batinjan", "arabic": "مسقعة باذنجان", "cal100": 116, "p100": 4, "c100": 8, "f100": 8},
    {"name": "Riz a Dajaj", "arabic": "رز بالدجاج", "cal100": 137, "p100": 9.1, "c100": 14.8, "f100": 4},
    {"name": "Riz bi Lahma", "arabic": "رز باللحمة", "cal100": 148, "p100": 8, "c100": 15.7, "f100": 5.7},
    {"name": "Sayadia", "arabic": "صيادية", "cal100": 125, "p100": 8.5, "c100": 12.8, "f100": 4},
    {"name": "Shawarma Dajaj", "arabic": "شاورما دجاج", "cal100": 210, "p100": 14, "c100": 19, "f100": 8},
    {"name": "Shawarma Lahma", "arabic": "شاورما لحمة", "cal100": 240, "p100": 13, "c100": 18, "f100": 12},
    {"name": "Tabboula", "arabic": "تبّولة", "cal100": 60, "p100": 1.5, "c100": 8, "f100": 2.5},
    {"name": "Warak Enab", "arabic": "ورق عنب", "cal100": 140, "p100": 4, "c100": 16, "f100": 7},
    {"name": "Yakhnat Bamia", "arabic": "يخنة بامية", "cal100": 100, "p100": 5.7, "c100": 6.2, "f100": 5.7},
    {"name": "Yakhnat Fassoulia", "arabic": "يخنة فاصوليا", "cal100": 108, "p100": 6.2, "c100": 8.5, "f100": 5.1},
    {"name": "Yakhnat Mouloukhia", "arabic": "يخنة ملوخية", "cal100": 102, "p100": 6.8, "c100": 5.1, "f100": 6.2},
    {"name": "Beid bil Awarma", "arabic": "بيض بالقاورما", "cal100": 233, "p100": 14.6, "c100": 2.6, "f100": 18.6},
    {"name": "Grilled Steak", "arabic": "ستيك مشوي", "cal100": 225, "p100": 26, "c100": 0, "f100": 12},
    {"name": "Grilled Chicken", "arabic": "دجاج مشوي", "cal100": 190, "p100": 24, "c100": 0, "f100": 9},
    {"name": "Labneh", "arabic": "لبنة", "cal100": 120, "p100": 8, "c100": 6, "f100": 8},
    {"name": "Manoushe Zaatar", "arabic": "منقوشة زعتر", "cal100": 213, "p100": 5.3, "c100": 28, "f100": 9.3},
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

CRITICAL: For every dish you add, you MUST specify the "grams" required to reach that meal's target.
Calculation: meal_calories = (grams / 100) * cal100.

Workout Plan: gym_type {gym_type}, equipment: {equipment_str}, conditions: {medical_conditions}.
Approved Exercises: {filtered_exercise_list}.

Return valid JSON:
{{
  "weeklyMealPlan": {{
    "Monday": [
      {{ "meal": "Breakfast", "dishes": [{{ "name": "...", "arabicName": "...", "grams": 250, "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }}] }},
      ...
    ],
    ...
  }},
  "weeklyWorkoutPlan": [{{ "day": "Monday", "dayType": "Workout/Rest", "workoutName": "...", "exercises": [{{ "name": "Push-ups", "sets": 3, "reps": 12, "notes": "Form focus" }}] }}],
  "healthWarnings": ["Avoid high-impact...", "..."],
  "coachTip": "Drink water and..."
}}"""

    models_to_try = [MODEL_NAME, "gemini-pro-latest", "gemini-2.5-flash-lite"]
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
