import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test_search():
    query = "pizza"
    usda_key = os.getenv("USDA_API_KEY")
    print(f"Testing USDA with key: {usda_key[:5]}...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.nal.usda.gov/fdc/v1/foods/search",
                params={
                    "api_key": usda_key,
                    "query": query,
                    "dataType": "Survey (FNDDS), SR Legacy, Foundation",
                    "pageSize": 8
                }
            )
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_search())
