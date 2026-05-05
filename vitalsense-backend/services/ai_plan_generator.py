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

    # Macro targets (30% P, 40% C, 30% F)
    target_p = int((calorie_target * 0.3) / 4)
    target_c = int((calorie_target * 0.4) / 4)
    target_f = int((calorie_target * 0.3) / 9)

    prompt = f"""You are a certified nutritionist and personal trainer.
Generate a personalized weekly health plan for this user:

- Age: {age}
- Gender: {gender}
- Weight: {weight}kg
- Height: {height}cm
- Daily calorie target: EXACTLY {calorie_target} kcal
- Target Macros: Protein: {target_p}g, Carbs: {target_c}g, Fat: {target_f}g
- Goal: {goal}
- Medical conditions: {medical_conditions or 'None reported'}

CRITICAL NUTRITION RULE: The user's daily calorie target is EXACTLY {calorie_target} kcal. 
The daily macro targets are Protein: {target_p}g, Carbs: {target_c}g, Fat: {target_f}g.
You MUST distribute ALL calories and macros across exactly 4 meals. 
The total of all meals for each day MUST reach 100% of the targets (error margin +/- 2%).
NEVER leave calories or macros unallocated. Return each meal as an array of dishes that together hit the targets.

Calorie distribution: Breakfast: 25% ({breakfast_kcal} kcal), Lunch: 35% ({lunch_kcal} kcal), Dinner: 30% ({dinner_kcal} kcal), Snack: 10% ({snack_kcal} kcal). 
Use ONLY Lebanese dishes from this list: [{dishes_list}]

Generate a weekly workout plan for: gym_type: {gym_type}, available equipment: {equipment_str}, medical conditions: {medical_conditions or 'None'}. 
STRICT RULES: 
1) Only include exercises from this approved list for their gym type: [{filtered_exercise_list}]. 
2) Never include exercises marked unsafe for their conditions. 
3) Upper body days ONLY use: chest/back/shoulders/biceps/triceps exercises. 
4) Lower body days ONLY use: legs/glutes exercises. 

Return a valid JSON object with exactly this structure:
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
    ...
  }},
  "weeklyWorkoutPlan": [...],
  "healthWarnings": [...],
  "coachTip": "..."
}}

IMPORTANT: Ensure that for EVERY DAY, the sum of calories/macros in the 4 meals equals EXACTLY the target ({calorie_target} kcal, {target_p}g P, {target_c}g C, {target_f}g F)."""

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
