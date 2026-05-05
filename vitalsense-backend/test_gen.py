import requests
import json

url = "http://localhost:8000/api/generate-plan/"
payload = {
    "user_id": "834c38d1-d242-4f36-a36c-95b8d29759d5",
    "age": 25,
    "gender": "male",
    "weight": 80,
    "height": 180,
    "tdee": 2500,
    "calorie_target": 2314,
    "goal": "improve_health"
}

try:
    print("Sending request...")
    response = requests.post(url, json=payload, timeout=60)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
