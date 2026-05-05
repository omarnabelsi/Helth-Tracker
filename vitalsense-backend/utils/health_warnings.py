"""
Scans user messages for danger keywords and generates health warnings.
"""

DANGER_KEYWORDS = [
    "chest pain", "dizziness", "shortness of breath",
    "fainting", "heart racing", "palpitations",
    "blurred vision", "numbness", "severe headache",
    "difficulty breathing",
]


def check_for_danger(message: str) -> bool:
    """Return True if the message contains any danger keyword."""
    lower = message.lower()
    return any(kw in lower for kw in DANGER_KEYWORDS)


def build_doctor_summary(user_name: str, message: str, conditions: list[str]) -> str:
    """
    Generate a short summary a user could show their doctor,
    including detected symptoms and pre-existing conditions.
    """
    detected = [kw for kw in DANGER_KEYWORDS if kw in message.lower()]
    summary = (
        f"⚠️ HEALTH ALERT for {user_name}\n"
        f"Reported symptoms: {', '.join(detected)}\n"
        f"Pre-existing conditions: {', '.join(conditions) if conditions else 'None reported'}\n"
        f"Recommendation: Please consult a medical professional immediately."
    )
    return summary
