"""
AI Chat router — context-aware health coach powered by Gemini.
Includes health warning detection for dangerous symptoms.
Now includes a simplified /simple endpoint for direct frontend use
and a /test-gemini endpoint for debugging.
"""
import os
import traceback
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from models.schemas import ChatMessageIn, ChatMessageOut, ChatResponse
from services.supabase_client import supabase
from services.auth_service import get_current_user
from services.gemini_service import ask_gemini
from utils.health_warnings import check_for_danger, build_doctor_summary

router = APIRouter()


# ── Simple chat schema (no auth required, for frontend direct use) ──
class SimpleChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

class SimpleChatResponse(BaseModel):
    reply: str
    health_warning: Optional[str] = None
    doctor_summary: Optional[str] = None
    error: Optional[str] = None


def _build_system_prompt(user: dict, profile: dict | None, conditions: list,
                         goal: dict | None, plan: dict | None, today_meals: list) -> str:
    """Construct the Gemini system prompt with the user's full context."""
    parts = [
        "You are VitalSense AI, a knowledgeable and supportive personal health coach for a Lebanese health platform.",
        "Be concise, evidence-based, and encouraging. Always remind the user to consult a doctor for medical issues.",
        f"\nUser: {user.get('full_name', 'User')}",
    ]
    if profile:
        parts.append(
            f"Body Stats: {profile.get('weight')} kg, {profile.get('height')} cm, "
            f"age {profile.get('age')}, sex {profile.get('gender')}, "
            f"goal {profile.get('goal', 'unknown')}, "
            f"target calories: {profile.get('calorie_target')} kcal"
        )
        if profile.get('medical_conditions'):
            parts.append(f"Medical history / conditions: {profile.get('medical_conditions')}")
    
    if plan:
        parts.append("\nYour current weekly AI plan includes Lebanese dishes tailored to your needs.")
        
    if today_meals:
        total_cal = sum(m.get("calories", 0) or 0 for m in today_meals)
        parts.append(f"\nToday's ACTUAL intake so far: {total_cal} kcal from {len(today_meals)} meals.")
        if profile and profile.get("calorie_target"):
            remaining = profile.get("calorie_target") - total_cal
            parts.append(f"Remaining calorie budget for today: {remaining} kcal.")

    # Meal Time Context
    current_hour = datetime.now().hour
    meal_context = (
        "breakfast time (6am-10am)" if 6 <= current_hour < 10 else
        "lunch time (12pm-3pm)" if 12 <= current_hour < 15 else
        "dinner time (6pm-9pm)" if 18 <= current_hour < 21 else
        "snack time"
    )

    meal_rules_for_chat = f"""
Current time context: it is {meal_context}.
When suggesting foods or answering meal questions:
- At breakfast time: suggest breakfast-appropriate foods only (eggs, labneh, manakish, oats, fruits, foul, yogurt). Never suggest pizza, heavy stews, or shawarma plates for breakfast.
- At lunch time: suggest balanced full meals.
- At dinner time: suggest lighter protein-focused meals.
- At snack time: suggest small light options under 300 kcal. Never suggest full meal portions as snacks.
If user asks about a food that is wrong for the time (e.g. 'Can I have baba ghanouj for breakfast?') explain why it is not ideal and suggest better alternatives.
"""
    parts.append(meal_rules_for_chat)

    parts.append("\nOnly recommend Lebanese dishes. If the user asks about a specific food, tell them if it fits their remaining budget.")
    return "\n".join(parts)


# ── /test-gemini — debugging endpoint ──
@router.get("/test-gemini")
async def test_gemini():
    """Send a simple test message to Gemini to verify the API key works."""
    try:
        reply = ask_gemini("You are a helpful assistant.", [], "Say hello and confirm you are working.")
        return {"status": "ok", "reply": reply}
    except Exception as e:
        print(f"[test-gemini] ERROR: {traceback.format_exc()}")
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}


# ── /simple — simplified endpoint for frontend (uses profiles table) ──
@router.post("/simple", response_model=SimpleChatResponse)
async def simple_chat(body: SimpleChatRequest):
    """
    Simplified chat endpoint: takes a message (which may contain injected context),
    calls Gemini directly, no auth required. Used by the frontend Chat page.
    """
    try:
        # Build a system prompt from the user's profile if user_id provided
        system_prompt = (
            "You are VitalSense AI, a personal health coach for a Lebanese health platform.\n"
            "Be concise, evidence-based, and encouraging.\n"
            "Only recommend Lebanese dishes when discussing food.\n"
            "Always remind users to consult a doctor for medical issues.\n"
            f"Current context: it is {datetime.now().strftime('%H:%M')}. Sugggest foods appropriate for this time."
        )

        if body.user_id:
            # Try to load profile from the profiles table
            prof_res = supabase.table("profiles").select("*").eq("user_id", body.user_id).limit(1).execute()
            if prof_res.data:
                p = prof_res.data[0]
                system_prompt = (
                    f"You are a personal health coach for this user:\n"
                    f"Name: {p.get('name', 'User')}, Age: {p.get('age')}, Gender: {p.get('gender')},\n"
                    f"Weight: {p.get('weight')}kg, Height: {p.get('height')}cm,\n"
                    f"Goal: {p.get('goal')}, Daily calories: {p.get('calorie_target')} kcal,\n"
                    f"Medical conditions: {p.get('medical_conditions') or 'None reported'}.\n"
                    f"Activity level: {p.get('activity_level')}.\n"
                    f"Answer all questions based on their specific profile.\n"
                    f"Only recommend Lebanese dishes from their meal plan.\n"
                    f"Be concise, evidence-based, and encouraging."
                )

        reply = ask_gemini(system_prompt, [], body.message)

        # Health warning check
        health_warning = None
        doctor_summary = None
        if check_for_danger(body.message):
            health_warning = "⚠️ Your message mentions symptoms that may require immediate medical attention."
            doctor_summary = "Please consult a medical professional immediately."

        return SimpleChatResponse(reply=reply, health_warning=health_warning, doctor_summary=doctor_summary)

    except Exception as e:
        print(f"[simple-chat] Gemini error: {traceback.format_exc()}")
        return SimpleChatResponse(
            reply="",
            error=f"AI service error: {str(e)}"
        )


# ── Original authenticated endpoint ──
@router.post("/", response_model=ChatResponse)
async def send_message(body: ChatMessageIn, current_user: dict = Depends(get_current_user)):
    """
    Receive a user message → build context → call Gemini →
    save both messages → check for health warnings → return reply.
    """
    user_id = current_user["id"]

    # ── Gather user context ──
    prof_res = supabase.table("profiles").select("*").eq("user_id", user_id).limit(1).execute()
    profile = prof_res.data[0] if prof_res.data else None

    conds = supabase.table("health_conditions").select("*").eq("user_id", user_id).execute()
    conditions = conds.data or []

    pl_res = supabase.table("plans").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    plan = pl_res.data[0] if pl_res.data else None
    plan_data = plan.get("plan_data", {}) if plan else {}

    today_str = date.today().isoformat()
    ml = (
        supabase.table("meal_logs").select("*")
        .eq("user_id", user_id)
        .gte("logged_at", f"{today_str}T00:00:00")
        .lte("logged_at", f"{today_str}T23:59:59")
        .execute()
    )
    today_meals_logged = ml.data or []

    # Calculate actual calories consumed today
    consumed_cal = sum(m.get("calories", 0) or 0 for m in today_meals_logged)
    
    # Build System Prompt
    if body.injected_context:
        # Incorporate real-time data into the injected context
        target = profile.get("calorie_target") if profile else 2000
        stats_addon = (
            f"\n\nACTUAL REAL-TIME DATA:\n"
            f"Today's actual consumed calories (from logs): {consumed_cal} kcal.\n"
            f"Daily target: {target} kcal. Remaining: {target - consumed_cal} kcal."
        )
        system_prompt = body.injected_context + stats_addon
    else:
        system_prompt = _build_system_prompt(current_user, profile, conditions, None, plan_data, today_meals_logged)

    # ── Fetch conversation history (Last 24h only) ──
    cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
    
    history_res = (
        supabase.table("chat_messages").select("*")
        .eq("user_id", user_id)
        .gte("sent_at", cutoff)
        .order("sent_at", desc=False).execute()
    )
    history = []
    for msg in (history_res.data or []):
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "content": msg["content"]})

    # ── Call Gemini ──
    try:
        reply = ask_gemini(system_prompt, history, body.message)
    except Exception as e:
        print(f"[chat] Gemini error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    # ── Save both messages ──
    try:
        supabase.table("chat_messages").insert({"user_id": user_id, "role": "user", "content": body.message}).execute()
        supabase.table("chat_messages").insert({"user_id": user_id, "role": "assistant", "content": reply}).execute()
    except Exception as e:
        print(f"[chat] Database save error (non-blocking): {e}")

    # ── Health warning check ──
    health_warning = None
    doctor_summary = None
    if check_for_danger(body.message):
        cond_names = [c["condition_name"] for c in conditions]
        health_warning = "⚠️ Your message mentions symptoms that may require immediate medical attention."
        doctor_summary = build_doctor_summary(current_user.get("full_name", "User"), body.message, cond_names)

    return ChatResponse(reply=reply, health_warning=health_warning, doctor_summary=doctor_summary)


@router.get("/history", response_model=List[ChatMessageOut])
async def get_history(current_user: dict = Depends(get_current_user)):
    """Return the conversation history for the user from the last 24 hours."""
    cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
    result = (
        supabase.table("chat_messages").select("*")
        .eq("user_id", current_user["id"])
        .gte("sent_at", cutoff)
        .order("sent_at", desc=False).execute()
    )
    return result.data or []
