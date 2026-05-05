import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

load_dotenv()

def test_insert_user():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase: Client = create_client(url, key)
    
    test_id = str(uuid.uuid4())
    print(f"Attempting to insert test user with ID: {test_id}")
    
    try:
        data = {
            "id": test_id,
            "email": f"test_{test_id[:8]}@example.com",
            "full_name": "Test User"
        }
        response = supabase.table("users").insert(data).execute()
        print("[SUCCESS] Inserted test user successfully.")
        
        # Now clean up
        supabase.table("users").delete().eq("id", test_id).execute()
        print("[INFO] Cleaned up test user.")
        
    except Exception as e:
        print(f"[ERROR] Insert failed: {str(e)}")

if __name__ == "__main__":
    test_insert_user()
