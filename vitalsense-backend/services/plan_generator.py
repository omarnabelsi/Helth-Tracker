"""
Diet + Workout plan generation logic.
Uses TDEE calculation, macro splits, and condition-aware filtering.
"""
import json, math
from typing import List, Optional


# ── TDEE Calculation (Mifflin-St Jeor) ──

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
    "active": 1.725, "very_active": 1.9,
}


def calculate_tdee(weight_kg: float, height_cm: float, age: int, sex: str, activity_level: str = "moderate") -> float:
    """Mifflin-St Jeor TDEE estimation."""
    if sex == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return bmr * ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)


def adjust_calories(tdee: float, goal_type: str) -> float:
    """Apply surplus / deficit based on the goal."""
    if goal_type == "lose_fat":
        return tdee - 500
    elif goal_type == "build_muscle":
        return tdee + 300
    return tdee  # improve_health → maintenance


def split_macros(calories: float, goal_type: str) -> dict:
    """Return protein / carbs / fat grams for the daily target."""
    if goal_type == "build_muscle":
        protein_pct, carbs_pct, fat_pct = 0.30, 0.45, 0.25
    elif goal_type == "lose_fat":
        protein_pct, carbs_pct, fat_pct = 0.35, 0.35, 0.30
    else:
        protein_pct, carbs_pct, fat_pct = 0.25, 0.50, 0.25
    return {
        "protein_g": round(calories * protein_pct / 4, 1),
        "carbs_g": round(calories * carbs_pct / 4, 1),
        "fat_g": round(calories * fat_pct / 9, 1),
    }


# ── Condition-aware food pool ──

FOOD_POOL = [
    {"name": "Grilled chicken breast", "cal": 220, "p": 35, "c": 0, "f": 8, "tags": []},
    {"name": "Hummus with pita", "cal": 350, "p": 12, "c": 40, "f": 16, "tags": ["high_sodium"]},
    {"name": "Fattoush salad", "cal": 180, "p": 4, "c": 22, "f": 9, "tags": []},
    {"name": "Labneh with olive oil", "cal": 200, "p": 10, "c": 6, "f": 15, "tags": []},
    {"name": "Manakish zaatar", "cal": 320, "p": 8, "c": 42, "f": 14, "tags": ["high_gi"]},
    {"name": "Tabbouleh", "cal": 120, "p": 3, "c": 16, "f": 5, "tags": ["anti_inflammatory"]},
    {"name": "Lentil soup", "cal": 250, "p": 14, "c": 35, "f": 5, "tags": ["anti_inflammatory"]},
    {"name": "Grilled kafta", "cal": 300, "p": 22, "c": 5, "f": 20, "tags": []},
    {"name": "Rice with chicken shawarma", "cal": 480, "p": 30, "c": 55, "f": 14, "tags": ["high_gi"]},
    {"name": "Foul moudammas", "cal": 280, "p": 16, "c": 38, "f": 6, "tags": []},
    {"name": "Greek yogurt with honey", "cal": 180, "p": 14, "c": 20, "f": 4, "tags": ["high_gi"]},
    {"name": "Baked salmon fillet", "cal": 350, "p": 34, "c": 0, "f": 22, "tags": ["anti_inflammatory"]},
    {"name": "Quinoa salad", "cal": 280, "p": 10, "c": 40, "f": 8, "tags": ["anti_inflammatory"]},
    {"name": "Egg white omelette", "cal": 150, "p": 20, "c": 2, "f": 6, "tags": []},
    {"name": "Grilled vegetables", "cal": 120, "p": 3, "c": 18, "f": 5, "tags": ["anti_inflammatory"]},
    {"name": "Mixed nuts (30 g)", "cal": 180, "p": 5, "c": 6, "f": 16, "tags": []},
    {"name": "Avocado toast", "cal": 300, "p": 8, "c": 30, "f": 18, "tags": []},
    {"name": "Chicken shawarma wrap", "cal": 420, "p": 28, "c": 38, "f": 16, "tags": []},
    {"name": "Baked sweet potato", "cal": 160, "p": 3, "c": 37, "f": 0, "tags": []},
    {"name": "Protein smoothie", "cal": 250, "p": 25, "c": 28, "f": 5, "tags": []},
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _excluded_tags(conditions: List[str]) -> set:
    """Map health conditions to food tags that should be excluded."""
    mapping = {
        "heart disease": {"high_sodium"},
        "hypertension": {"high_sodium"},
        "diabetes": {"high_gi"},
        "joint problems": set(),
    }
    excluded = set()
    for c in conditions:
        excluded |= mapping.get(c.lower(), set())
    return excluded


def generate_diet_plan(
    weight_kg: float, height_cm: float, age: int, sex: str,
    goal_type: str, conditions: List[str],
    activity_level: str = "moderate",
) -> dict:
    """Build a 7-day meal plan and macro targets."""
    tdee = calculate_tdee(weight_kg, height_cm, age, sex, activity_level)
    daily_cal = round(adjust_calories(tdee, goal_type))
    macros = split_macros(daily_cal, goal_type)
    excluded = _excluded_tags(conditions)

    # Filter food pool
    pool = [f for f in FOOD_POOL if not (set(f["tags"]) & excluded)]

    weekly: dict = {}
    for day in DAYS:
        meals = {"breakfast": pool[hash(day + "b") % len(pool)]["name"],
                 "snack_am": pool[hash(day + "sa") % len(pool)]["name"],
                 "lunch": pool[hash(day + "l") % len(pool)]["name"],
                 "snack_pm": pool[hash(day + "sp") % len(pool)]["name"],
                 "dinner": pool[hash(day + "d") % len(pool)]["name"]}
        weekly[day] = meals

    return {
        "daily_calories": daily_cal,
        **macros,
        "weekly_meals": weekly,
    }


# ── Workout plan generation ──

EXERCISES = {
    "compound_lifts": [
        {"name": "Barbell squat", "sets": 4, "reps": "8-10", "duration": "10 min", "notes": "Focus on depth"},
        {"name": "Bench press", "sets": 4, "reps": "8-10", "duration": "10 min", "notes": "Control negative"},
        {"name": "Deadlift", "sets": 4, "reps": "6-8", "duration": "12 min", "notes": "Keep back neutral"},
        {"name": "Overhead press", "sets": 3, "reps": "10", "duration": "8 min", "notes": ""},
        {"name": "Barbell row", "sets": 4, "reps": "8-10", "duration": "10 min", "notes": ""},
    ],
    "cardio_resistance": [
        {"name": "Treadmill intervals", "sets": 1, "reps": "N/A", "duration": "20 min", "notes": "30s sprint / 60s walk"},
        {"name": "Dumbbell circuit", "sets": 3, "reps": "12-15", "duration": "15 min", "notes": "Minimal rest"},
        {"name": "Jump rope", "sets": 3, "reps": "N/A", "duration": "5 min", "notes": ""},
        {"name": "Kettlebell swings", "sets": 3, "reps": "15", "duration": "8 min", "notes": ""},
    ],
    "hiit": [
        {"name": "Burpees", "sets": 4, "reps": "12", "duration": "5 min", "notes": ""},
        {"name": "Mountain climbers", "sets": 4, "reps": "20", "duration": "5 min", "notes": ""},
        {"name": "Box jumps", "sets": 3, "reps": "10", "duration": "5 min", "notes": ""},
    ],
    "low_impact": [
        {"name": "Seated leg press", "sets": 3, "reps": "12", "duration": "8 min", "notes": "No knee lockout"},
        {"name": "Resistance band rows", "sets": 3, "reps": "15", "duration": "6 min", "notes": ""},
        {"name": "Seated shoulder press", "sets": 3, "reps": "12", "duration": "6 min", "notes": ""},
        {"name": "Wall sit", "sets": 3, "reps": "N/A", "duration": "1 min hold", "notes": ""},
        {"name": "Seated cable fly", "sets": 3, "reps": "12", "duration": "6 min", "notes": ""},
    ],
    "post_meal_walk": [
        {"name": "Brisk walk", "sets": 1, "reps": "N/A", "duration": "15 min", "notes": "After each main meal"},
    ],
    "rest": [
        {"name": "Rest / active recovery", "sets": 0, "reps": "N/A", "duration": "—", "notes": "Light stretching ok"},
    ],
}


def generate_workout_plan(
    body_type: Optional[str], goal_type: str,
    conditions: List[str], intensity_level: str = "moderate",
) -> dict:
    """Build a 7-day exercise plan respecting conditions."""
    cond_lower = [c.lower() for c in conditions]
    has_heart = any(c in ("heart disease", "hypertension") for c in cond_lower)
    has_joints = "joint problems" in cond_lower
    has_diabetes = "diabetes" in cond_lower

    # Force low intensity for heart patients
    if has_heart:
        intensity_level = "low"

    # Choose exercise buckets
    if has_joints:
        main_pool = EXERCISES["low_impact"]
    elif has_heart:
        main_pool = EXERCISES["low_impact"]
    elif goal_type == "build_muscle":
        main_pool = EXERCISES["compound_lifts"]
    elif goal_type == "lose_fat":
        main_pool = EXERCISES["cardio_resistance"]
        if intensity_level == "high" and not has_heart:
            main_pool = main_pool + EXERCISES["hiit"]
    else:
        main_pool = EXERCISES["cardio_resistance"]

    weekly: dict = {}
    for i, day in enumerate(DAYS):
        if i % 3 == 2:
            weekly[day] = EXERCISES["rest"]
        else:
            day_exercises = [main_pool[j % len(main_pool)] for j in range(i * 2, i * 2 + 4)]
            if has_diabetes:
                day_exercises += EXERCISES["post_meal_walk"]
            weekly[day] = day_exercises

    return {"weekly_exercises": weekly, "intensity_level": intensity_level}
