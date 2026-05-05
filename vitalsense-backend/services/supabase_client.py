"""
Singleton Supabase client used by the entire application.
All database and storage operations go through this module.
"""

import os
from supabase import create_client, Client

# Read credentials from environment
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
# Use Service Key for backend operations to bypass RLS if needed
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY") or ""

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or ANON_KEY) must be set in .env")

# Create the single client instance shared across the app
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
