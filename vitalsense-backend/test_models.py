import google.generativeai as genai
genai.configure(api_key='AIzaSyApAUFGUL8vHjjvIlndD4vMnL6VxxLl3Oo')

models_to_test = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.0-flash-001',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
]

for name in models_to_test:
    try:
        m = genai.GenerativeModel(name)
        r = m.generate_content("Say hello in one word")
        print(f"OK: {name} -> {r.text.strip()[:30]}")
    except Exception as e:
        err = str(e)[:100]
        print(f"FAIL: {name} -> {err}")
