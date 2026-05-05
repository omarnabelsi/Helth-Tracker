from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.gemini_service import ask_gemini
from services.auth_service import get_current_user

router = APIRouter()

class ProgressReportRequest(BaseModel):
    user_id: str
    weight_logs: List[dict]
    profile: Optional[dict] = None

@router.post("/")
async def generate_progress_report(body: ProgressReportRequest):
    """
    Generate a motivational progress summary for the user based on their weight logs.
    """
    if not body.weight_logs:
        return {"report": "No weight logs found. Log your weight regularly to see AI insights!"}

    # Extract some basic stats
    starting_weight = body.weight_logs[0].get("weight_kg", 0)
    current_weight = body.weight_logs[-1].get("weight_kg", 0)
    goal_weight = body.profile.get("target_weight_kg", "unknown") if body.profile else "unknown"
    
    # Calculate weeks active (rough estimate)
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(body.weight_logs[0]["logged_at"].replace("Z", "+00:00"))
        end_date = datetime.fromisoformat(body.weight_logs[-1]["logged_at"].replace("Z", "+00:00"))
        weeks_active = max(1, (end_date - start_date).days // 7)
    except:
        weeks_active = 1

    prompt = (
        f"Generate a motivational progress summary for this user: "
        f"starting weight {starting_weight}kg, current weight {current_weight}kg, "
        f"goal {goal_weight}kg, weeks active {weeks_active}. "
        f"Keep it under 100 words, personal and encouraging."
    )

    try:
        report = ask_gemini("You are VitalSense AI, a supportive health coach.", [], prompt)
        return {"report": report}
    except Exception as e:
        print(f"[progress-report] Gemini error: {e}")
        return {"report": "You're doing great! Keep staying consistent with your plan to reach your goals."}
