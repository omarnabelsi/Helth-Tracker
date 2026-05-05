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
MODEL_NAME = "gemini-2.5-flash-lite"

# ── Full list of Lebanese dishes for the prompt ──
LEBANESE_DISHES = [
    "Baba Ghanouj", "Batata Mahchi", "Borgul bi Banadoura", "Chichbarak",
    "Falafel", "Fatayer Sabanikh", "Fattat Hommos", "Fattoush",
    "Foul Moudamas", "Hindbe bil Zet", "Hommos bi Tahini", "Kafta wa Batata",
    "Kebba bil Sayniya", "Koussa Mahchi", "Lahm bil Ajin", "Loubia bil Zet",
    "Malfouf Mahchi", "Moujadara", "Moghrabia", "Mousaka Batinjan",
    "Riz a Dajaj", "Riz bi Lahma", "Sayadia", "Shawarma Dajaj",
    "Shawarma Lahma", "Tabboula", "Warak Enab", "Yakhnat Bamia",
    "Yakhnat Fassoulia", "Yakhnat Mouloukhia", "Beid bil Awarma (Eggs)",
    "Grilled Steak", "Grilled Chicken", "Labneh", "Manoushe", "Zaatar"
]


def generate_full_plan(
    age: int,
    gender: str,
    weight: float,
    height: float,
    tdee: float,
    calorie_target: float,
    goal: str,
    weekly_loss_target: Optional[str],
    medical_conditions: Optional[str],
    activity_level: str,
    gym_type: Optional[str] = "home",
    equipment_list: Optional[list] = None
) -> dict:
    """
    Call Gemini to generate a fully personalized weekly health plan.
    Returns a dict with: weeklyMealPlan, weeklyWorkoutPlan, healthWarnings, coachTip
    """
    dishes_list = ", ".join(LEBANESE_DISHES)
    
    # Filter exercises
    filtered_exercises = [ex['name'] for ex in EXERCISES if ex['gymRequired'] == gym_type or (gym_type == 'big_gym' and ex['gymRequired'] in ['home', 'small_gym']) or (gym_type == 'small_gym' and ex['gymRequired'] == 'home')]
    filtered_exercise_list = ", ".join(filtered_exercises)
    
    equipment_str = ", ".join(equipment_list) if equipment_list else "None specified"

    # Meal calories
    breakfast_kcal = int(calorie_target * 0.25)
    lunch_kcal = int(calorie_target * 0.35)
    dinner_kcal = int(calorie_target * 0.30)
    snack_kcal = int(calorie_target * 0.10)

    prompt = f"""You are a certified nutritionist and personal trainer.
Generate a personalized weekly health plan for this user:

- Age: {age}
- Gender: {gender}
- Weight: {weight}kg
- Height: {height}cm
- Daily calorie target: EXACTLY {calorie_target} kcal
- TDEE: {tdee} kcal
- Goal: {goal}
- Weekly loss target: {weekly_loss_target or 'N/A'}
- Medical conditions: {medical_conditions or 'None reported'}
- Activity level: {activity_level}

CRITICAL NUTRITION RULE: The user's daily calorie target is EXACTLY {calorie_target} kcal. You MUST distribute ALL {calorie_target} kcal across exactly 4 meals. No more, no less. Use this distribution: Breakfast: 25% ({breakfast_kcal} kcal), Lunch: 35% ({lunch_kcal} kcal), Dinner: 30% ({dinner_kcal} kcal), Snack: 10% ({snack_kcal} kcal). Total must equal exactly {calorie_target} kcal. If a single dish doesn't fill the meal calorie slot, add multiple dishes to that meal until the total reaches the target. For example if lunch target is 810 kcal, combine: Shawarma Dajaj (500 kcal) + Fattoush (200 kcal) + Hommos bi tahini (110 kcal) = 810 kcal. NEVER leave calories unallocated. Return each meal as an array of dishes that together hit the meal's calorie target.
Use ONLY Lebanese dishes from this list: [{dishes_list}]

Generate a weekly workout plan for: gym_type: {gym_type}, available equipment: {equipment_str}, medical conditions: {medical_conditions or 'None'}. STRICT RULES: 1) Only include exercises from this approved list for their gym type: [{filtered_exercise_list}]. 2) Never include exercises marked unsafe for their conditions. 3) Upper body days ONLY use: chest/back/shoulders/biceps/triceps exercises. 4) Lower body days ONLY use: legs/glutes exercises. 5) For home workouts use zero-equipment exercises only.

Return a valid JSON object (no markdown fences, no explanation text) with exactly this structure:
{{
  "weeklyMealPlan": {{
    "Monday": [
      {{
         "meal": "Breakfast",
         "dishes": [
           {{ "name": "Dish Name", "arabicName": "الاسم بالعربي", "calories": 350, "protein": 12, "carbs": 40, "fat": 14 }}
         ]
      }},
      {{ "meal": "Lunch", "dishes": [...] }},
      {{ "meal": "Dinner", "dishes": [...] }},
      {{ "meal": "Snack", "dishes": [...] }}
    ],
    "Tuesday": [...], "Wednesday": [...], "Thursday": [...], "Friday": [...], "Saturday": [...], "Sunday": [...]
  }},
  "weeklyWorkoutPlan": [
    {{
      "day": "Monday",
      "dayType": "upper_body",
      "workoutName": "Upper Body Strength",
      "exercises": [
        {{ "name": "Exercise Name", "arabicName": "الاسم بالعربي", "sets": 3, "reps": "10-12", "muscleGroup": "chest", "equipment": "dumbbells", "notes": "Keep form strict" }}
      ]
    }}
  ],
  "healthWarnings": ["warning 1", "warning 2"],
  "coachTip": "One personalized daily tip"
}}

IMPORTANT RULES:
- Each day MUST have exactly 4 meals (Breakfast, Lunch, Dinner, Snack) under weeklyMealPlan -> Day -> list of meals.
- Return ONLY valid JSON, no markdown code fences."""

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config={"temperature": 0.7, "response_mime_type": "application/json"},
    )

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Clean up response in case Gemini wraps it in markdown fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    try:
        plan = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: try to extract JSON from the response
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            plan = json.loads(match.group())
        else:
            raise ValueError(f"Failed to parse Gemini response as JSON: {raw[:200]}...")

    return plan
