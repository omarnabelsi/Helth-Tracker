"""
Google Gemini API integration for AI chat and progress comparison.
Uses the google-generativeai SDK with automatic model fallback.
"""
import os
import google.generativeai as genai

from services.groq_service import ask_groq

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

# Ordered fallback chain — models with available quota first
MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]


def ask_gemini(system_prompt: str, conversation_history: list[dict], user_message: str) -> str:
    """
    Send a message to Gemini, automatically falling back through the model chain
    if a model's quota is exhausted. 
    If ALL Gemini models fail, it falls back to Groq (Llama 3).
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
                # If it's a model not found or other non-quota error, still try the next one 
                # because some models might be deprecated
                continue

    # If all Gemini models failed, try Groq
    try:
        print("[gemini] Falling back to Groq...")
        return ask_groq(system_prompt, conversation_history, user_message)
    except Exception as groq_err:
        print(f"[gemini] Groq fallback also failed: {str(groq_err)}")
        raise Exception(f"All AI models exhausted (Gemini & Groq). Please wait. Last Gemini error: {last_error}")


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
