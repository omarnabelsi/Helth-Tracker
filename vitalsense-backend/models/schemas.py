"""
Pydantic request / response schemas for every endpoint.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ═══════════════════════════════════════════
#  AUTH
# ═══════════════════════════════════════════

class RegisterRequest(BaseModel):
    """Payload sent when a new user signs up."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    """Payload sent when a user logs in."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token returned after register / login."""
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """Public user representation (no password hash)."""
    id: str
    email: str
    full_name: str
    created_at: Optional[str] = None


# ═══════════════════════════════════════════
#  BODY PROFILE
# ═══════════════════════════════════════════

class BodyProfileCreate(BaseModel):
    """Fields sent alongside the selfie upload."""
    weight_kg: float = Field(..., gt=0)
    height_cm: float = Field(..., gt=0)
    age: int = Field(..., gt=0)
    sex: str = Field(..., pattern="^(male|female)$")
    body_type: Optional[str] = None          # ectomorph / mesomorph / endomorph
    body_fat_pct: Optional[float] = None
    posture_flags: Optional[List[str]] = None  # e.g. ["anterior_pelvic_tilt"]


class BodyProfileOut(BaseModel):
    """Stored body-profile record."""
    id: str
    user_id: str
    weight_kg: float
    height_cm: float
    age: int
    sex: str
    body_type: Optional[str] = None
    body_fat_pct: Optional[float] = None
    posture_flags: Optional[Any] = None
    selfie_url: Optional[str] = None
    scanned_at: Optional[str] = None


# ═══════════════════════════════════════════
#  HEALTH CONDITIONS
# ═══════════════════════════════════════════

class HealthConditionCreate(BaseModel):
    """Add a health condition."""
    condition_name: str
    severity: Optional[str] = "moderate"   # mild / moderate / severe


class HealthConditionOut(BaseModel):
    id: str
    user_id: str
    condition_name: str
    severity: Optional[str] = None
    added_at: Optional[str] = None


# ═══════════════════════════════════════════
#  GOALS
# ═══════════════════════════════════════════

class GoalCreate(BaseModel):
    """Set a new fitness / health goal."""
    goal_type: str = Field(..., pattern="^(lose_fat|build_muscle|improve_health)$")
    target_weight_kg: Optional[float] = None


class GoalOut(BaseModel):
    id: str
    user_id: str
    goal_type: str
    target_weight_kg: Optional[float] = None
    set_at: Optional[str] = None


# ═══════════════════════════════════════════
#  DIET PLANS
# ═══════════════════════════════════════════

class DietPlanGenerateRequest(BaseModel):
    """Optional overrides when generating a diet plan."""
    activity_level: str = Field(
        default="moderate",
        pattern="^(sedentary|light|moderate|active|very_active)$",
    )


class DietPlanOut(BaseModel):
    id: str
    user_id: str
    goal_id: Optional[str] = None
    weekly_meals: Any              # JSONB
    daily_calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    generated_at: Optional[str] = None


# ═══════════════════════════════════════════
#  WORKOUT PLANS
# ═══════════════════════════════════════════

class WorkoutPlanGenerateRequest(BaseModel):
    """Optional overrides when generating a workout plan."""
    intensity_level: str = Field(
        default="moderate",
        pattern="^(low|moderate|high)$",
    )


class WorkoutPlanOut(BaseModel):
    id: str
    user_id: str
    goal_id: Optional[str] = None
    weekly_exercises: Any          # JSONB
    intensity_level: Optional[str] = None
    generated_at: Optional[str] = None


# ═══════════════════════════════════════════
#  MEAL LOGS
# ═══════════════════════════════════════════

class MealLogOut(BaseModel):
    id: str
    user_id: str
    food_name: Optional[str] = None
    photo_url: Optional[str] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    logged_at: Optional[str] = None


class TodayMealSummary(BaseModel):
    """Aggregated view of today's meals."""
    meals: List[MealLogOut]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float


# ═══════════════════════════════════════════
#  PROGRESS SNAPSHOTS
# ═══════════════════════════════════════════

class ProgressSnapshotOut(BaseModel):
    id: str
    user_id: str
    weight_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None
    selfie_url: Optional[str] = None
    ai_comparison: Optional[str] = None
    taken_at: Optional[str] = None


# ═══════════════════════════════════════════
#  CHAT
# ═══════════════════════════════════════════

class ChatMessageIn(BaseModel):
    """User message sent to the AI coach."""
    message: str
    injected_context: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: str
    user_id: str
    role: str           # "user" | "assistant"
    content: str
    sent_at: Optional[str] = None


class ChatResponse(BaseModel):
    """Reply returned to the frontend."""
    reply: str
    health_warning: Optional[str] = None
    doctor_summary: Optional[str] = None
