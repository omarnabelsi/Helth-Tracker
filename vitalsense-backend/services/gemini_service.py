"""
Google Gemini API integration for AI chat and progress comparison.
Uses the google-generativeai SDK with automatic model fallback.
"""
import os
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

# Ordered fallback chain — models with available quota first
MODEL_CHAIN = [
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
]


def ask_gemini(system_prompt: str, conversation_history: list[dict], user_message: str) -> str:
    """
    Send a message to Gemini, automatically falling back through the model chain
    if a model's quota is exhausted. No long retries — fail fast and try the next model.
    """
    last_error = None
    for model_name in MODEL_CHAIN:
        try:
            print(f"[gemini] Trying {model_name}...")
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt,
            )

            # Build history for the SDK format
            sdk_history = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                sdk_history.append({"role": role, "parts": [msg["content"]]})

            chat = model.start_chat(history=sdk_history)
            response = chat.send_message(user_message)
            print(f"[gemini] Success with {model_name}")
            return response.text

        except Exception as e:
            last_error = e
            err_str = str(e)
            print(f"[gemini] {model_name} failed: {err_str[:100]}")
            if "429" in err_str or "quota" in err_str.lower():
                continue  # try next model in the chain
            else:
                raise  # non-quota error, don't try other models

    raise Exception(f"All Gemini models exhausted. Please wait a few minutes and try again. Last error: {last_error}")


def generate_progress_comparison(previous: dict | None, current: dict) -> str:
    """
    Ask Gemini to compare two progress snapshots and produce
    a short, motivational analysis.
    """
    if previous is None:
        prompt = (
            f"This is the user's first progress snapshot. "
            f"Weight: {current.get('weight_kg')} kg, "
            f"Body fat: {current.get('body_fat_pct')}%. "
            f"Write a short, encouraging baseline summary (3-4 sentences)."
        )
    else:
        prompt = (
            f"Compare the user's progress:\n"
            f"Previous — weight: {previous.get('weight_kg')} kg, body fat: {previous.get('body_fat_pct')}%\n"
            f"Current  — weight: {current.get('weight_kg')} kg, body fat: {current.get('body_fat_pct')}%\n"
            f"Write a short motivational analysis (3-4 sentences) noting improvements or areas to focus on."
        )

    return ask_gemini("You are a helpful fitness coach.", [], prompt)
