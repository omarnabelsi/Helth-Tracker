import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def test_connection():
    url = os.getenv("SUPABASE_URL")
    # Try multiple common names for the key
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    
    print(f"Checking connection to: {url}")
    
    if not url or "your-project-id" in url:
        print("[ERROR] SUPABASE_URL is still a placeholder in .env")
        return

    if not key or "eyJ" not in key[:10]: # Basic check for JWT-like string
        print("[ERROR] SUPABASE_KEY/ANON_KEY is missing or invalid in .env")
        return

    try:
        supabase: Client = create_client(url, key)
        # Try a simple health check or fetch users count (assuming 'users' table exists as per prompt)
        response = supabase.table("users").select("id", count="exact").limit(1).execute()
        print("[SUCCESS] Successfully connected to Supabase!")
        print(f"Found {response.count} users in the database.")
    except Exception as e:
        print(f"[ERROR] Connection failed: {str(e)}")

if __name__ == "__main__":
    test_connection()
