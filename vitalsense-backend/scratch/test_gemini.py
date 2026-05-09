import os
import asyncio
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def test_gemini():
    query = "pizza"
    gemini_key = os.getenv("GEMINI_API_KEY")
    print(f"Testing Gemini with key: {gemini_key[:5]}...")
    
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Give nutrition info per 100g for the dish: "{query}".
        Return ONLY a valid JSON array, no explanation, no markdown:
        [{{"name": "dish name", "calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "serving": "100g", "source": "ai_estimate"}}]
        Include 1 to 3 common variations if they exist."""
        
        response = model.generate_content(prompt)
        print(f"Response text: {response.text}")
        match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if match:
            results = json.loads(match.group())
            print(f"Parsed results: {results}")
        else:
            print("No JSON found in response")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
