import os
import requests
from dotenv import load_dotenv

load_dotenv()

def check_supabase_connection():
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    print(f"--- Supabase Connection Check ---")
    print(f"URL: {url}")
    
    if not url:
        print("[!] ERROR: SUPABASE_URL is missing.")
        return

    # 1. Test Auth (Health check)
    print("\n[1] Testing Auth Service (GoTrue)...")
    try:
        auth_url = f"{url.rstrip('/')}/auth/v1/health"
        response = requests.get(auth_url)
        if response.status_code == 200:
            print("[+] Auth Service: UP")
        else:
            print(f"[-] Auth Service: DOWN (Status: {response.status_code})")
    except Exception as e:
        print(f"[-] Auth Service: ERROR ({str(e)})")

    # 2. Test Database with Service Key
    print("\n[2] Testing Database with Service Key...")
    if not service_key:
        print("[-] Skipping: SUPABASE_SERVICE_KEY not found in .env")
    else:
        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}"
        }
        try:
            # Try to query the 'users' table (as per prompt, it should exist)
            db_url = f"{url.rstrip('/')}/rest/v1/users?select=*"
            response = requests.get(db_url, headers=headers)
            
            if response.status_code == 200:
                print("[+] Database Access: SUCCESS")
                data = response.json()
                print(f"    Found {len(data)} user(s) in the 'users' table.")
            else:
                print(f"[-] Database Access: FAILED (Status: {response.status_code})")
                print(f"    Detail: {response.text}")
        except Exception as e:
            print(f"[-] Database Access: ERROR ({str(e)})")

    # 3. Test Storage
    print("\n[3] Testing Storage Service...")
    try:
        storage_url = f"{url.rstrip('/')}/storage/v1/health"
        response = requests.get(storage_url)
        if response.status_code == 200:
            print("[+] Storage Service: UP")
        else:
            # Some projects might not have a public health endpoint for storage, 
            # but usually it returns something.
            print(f"[-] Storage Service: UNKNOWN (Status: {response.status_code})")
    except Exception as e:
        print(f"[-] Storage Service: ERROR ({str(e)})")

if __name__ == "__main__":
    check_supabase_connection()
