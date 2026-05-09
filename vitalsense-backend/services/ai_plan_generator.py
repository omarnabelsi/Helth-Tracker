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
# Using a fallback chain defined in generate_full_plan

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
    {"name": "Manoushe Zaatar", "arabic": "منقوشة زعتر", "cal100": 226, "p100": 5, "c100": 27, "f100": 10},
    {"name": "Labneh", "arabic": "لبنة", "cal100": 120, "p100": 8, "c100": 6, "f100": 7},
    {"name": "Halloumi", "arabic": "حلوم", "cal100": 280, "p100": 20, "c100": 2, "f100": 22},
    {"name": "Mixed Nuts", "arabic": "مكسرات مشكلة", "cal100": 600, "p100": 20, "c100": 20, "f100": 50},
    {"name": "Apple", "arabic": "تفاحة", "cal100": 52, "p100": 0.3, "c100": 14, "f100": 0.2},
    {"name": "Banana", "arabic": "موزة", "cal100": 89, "p100": 1.1, "c100": 23, "f100": 0.3},
    {"name": "Dates", "arabic": "تمر", "cal100": 282, "p100": 2.5, "c100": 75, "f100": 0.4},
    {"name": "Yogurt", "arabic": "لبن", "cal100": 61, "p100": 3.5, "c100": 4.7, "f100": 3.3},
    {"name": "Cucumber and Tomato", "arabic": "خيار وبندورة", "cal100": 20, "p100": 1, "c100": 4, "f100": 0.2},
    {"name": "Kachta bi Assal", "arabic": "قشطة بالعسل", "cal100": 250, "p100": 3, "c100": 30, "f100": 14},
    {"name": "Manoushe Jebne", "arabic": "منقوشة جبنة", "cal100": 280, "p100": 12, "c100": 30, "f100": 14},
    {"name": "Shakshouka", "arabic": "شكشوكة", "cal100": 110, "p100": 6, "c100": 8, "f100": 7},
    {"name": "Oats with Milk", "arabic": "شوفان بالحليب", "cal100": 105, "p100": 4, "c100": 18, "f100": 2},
    {"name": "Boiled Eggs", "arabic": "بيض مسلوق", "cal100": 155, "p100": 13, "c100": 1.1, "f100": 11},
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

CRITICAL INSTRUCTION: VARIETY IS MANDATORY. 
- DO NOT repeat the same snack more than 2 times in a whole week.
- DO NOT use "Dates" (تمر) as a filler for every snack or meal. If you use it once, do not use it again for at least 2 days.
- Each day MUST feel different. Rotate through the database: one day use Riz dishes, the next use Yakhnat, then Kafta, etc.
- A user should NOT see the same food in every single day's plan.
- You MUST fill EXACTLY 100% of the daily targets. 
NEVER leave calories or macros "remaining". If one dish isn't enough, you MUST add 2, 3, or 4 dishes to a single meal until the total hits the target.
For example, if a meal needs 800 kcal, combine several dishes from the list below.

Use ONLY these Lebanese foods (with these EXACT nutritional values):
{food_db_json}

STRICT MEAL TIME RULES — NEVER VIOLATE THESE:

BREAKFAST rules:
- Must be energizing and easy to digest (25% of daily calories).
- ONLY assign these categories as breakfast: Eggs (Beid, Shakshouka), Dairy (Labneh, Halloumi), Grains/Bread (Manoushe, Oats), Legumes (Foul Moudamas).
- NEVER assign: Heavy dinner stews (Yakhnat), Rice dishes (Riz bi Lahma, Sayadia), Fish, or excessive sweets for breakfast.
- A typical breakfast should be something like "Labneh + Bread" or "Eggs + Vegetables".
- NEVER assign: pizza, burger, shawarma plate, steak, baba ghanouj, warak enab, malfouf mahchi, koussa mahchi, yakhnat dishes, heavy rice dishes, fried heavy meals, desserts of any kind

LUNCH rules:
- Biggest meal of the day (35% of daily calories)
- ALLOWED: almost any Lebanese or world dish is fine for lunch
- Include a mix of protein + carbs + vegetables
- Can include: shawarma, riz dishes, kafta, grilled meats, fish, pasta, salads, soups, yakhnat dishes

DINNER rules:
- Medium meal (30% of daily calories)
- FOCUS on: lean protein + vegetables, moderate carbs
- ALLOWED: grilled chicken, fish, salads, soups, lighter rice, fattoush, tabbouleh, sayadia, loubia, yakhnat dishes
- AVOID: very heavy fried foods, excessive carbs only meals

SNACK rules:
- Must be SMALL and LIGHT (max 10% of daily calories, ideally 150-250 kcal).
- ONLY assign these items as snacks: Mixed Nuts, Apple, Banana, Dates, Yogurt, Cucumber and Tomato, small portion of Fatayer Sabanikh (max 100g), or a small piece of fruit.
- NEVER assign full meals (Kafta, Borgul, Shawarma, Riz, Yakhnat, Lahm bil Ajin) as a snack.
- A snack should be a single light item, not a full dish.
- Desserts like Kachta bi Assal or Baklava can be a snack but only in small portions (max 50g).

DESSERTS:
- Baklava, knafeh, maamoul, halawa, mouhallabiya etc.
- ONLY assign as: after-lunch treat OR snack (small portion)
- NEVER assign desserts as breakfast or as main dinner

Each day must have 4 meals: Breakfast (25%), Lunch (35%), Dinner (30%), Snack (10%).
Total daily sum MUST equal {calorie_target} kcal (+/- 20 kcal).

CRITICAL: For every dish you add, you MUST specify the "grams" required to reach that meal's target.
Calculation: meal_calories = (grams / 100) * cal100.

STRICT PPL WORKOUT RULES (4-Day Cycle Repeat):
1. PUSH — chest, shoulders, triceps
2. PULL — back, biceps, rear delts
3. LEGS — quads, hamstrings, glutes, calves
4. REST — recovery, walking
(Repeat cycle: if Day 5 is reached, it starts again with PUSH, etc.)
Plan sequence for 7 days (Example starting on Day 1):
Day 1: PUSH, Day 2: PULL, Day 3: LEGS, Day 4: REST, Day 5: PUSH, Day 6: PULL, Day 7: LEGS.

Available Equipment: {equipment_str}.
Medical conditions: {medical_conditions}.
Approved Exercises for this user's gym ({gym_type}): {filtered_exercise_list}.
If user has medical conditions, remove unsafe exercises and add a safety note.
For every exercise, provide "sets", "reps", "muscleGroup", and "notes".
Return valid JSON:
{{
  "weeklyMealPlan": {{ ... }},
  "weeklyWorkoutPlan": [
    {{
      "day": 1,
      "dayName": "Monday",
      "type": "push",
      "workoutName": "Push Day",
      "targetMuscles": ["chest", "shoulders", "triceps"],
      "duration": 60,
      "healthNote": "...",
      "exercises": [
        {{ "name": "...", "nameAr": "...", "sets": 4, "reps": "8-10", "muscleGroup": "chest", "notes": "..." }}
      ]
    }},
    ... (total 7 days)
  ]
}}

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

    models_to_try = [
        "models/gemini-2.0-flash",
        "models/gemini-1.5-flash",
        "models/gemini-flash-latest",
        "models/gemini-1.5-pro",
    ]
    last_error = None

    for model_id in models_to_try:
        try:
            print(f"[AI PLAN] Trying {model_id}...")
            config = {"temperature": 0.4}
            if "1.5" in model_id:
                config["response_mime_type"] = "application/json"
                
            model = genai.GenerativeModel(
                model_name=model_id,
                generation_config=config,
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
