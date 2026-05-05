import os
import requests
from dotenv import load_dotenv

load_dotenv()

def check_buckets():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        return

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    try:
        res = requests.get(f"{url.rstrip('/')}/storage/v1/bucket", headers=headers)
        if res.status_code == 200:
            buckets = [b['name'] for b in res.json()]
            print(f"BUCKETS_FOUND: {','.join(buckets)}")
        else:
            print(f"ERROR_STATUS: {res.status_code}")
    except Exception as e:
        print(f"EXCEPTION: {str(e)}")

if __name__ == "__main__":
    check_buckets()
