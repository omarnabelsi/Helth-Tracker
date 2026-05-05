"""
Auth router — register, login, and get current user.
"""
from fastapi import APIRouter, HTTPException, status
from models.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from services.supabase_client import supabase
from services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user,
)
from fastapi import Depends

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """Create a new user, hash the password, and return a JWT."""
    # Check if email already taken
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Insert user
    hashed = hash_password(body.password)
    result = supabase.table("users").insert({
        "email": body.email,
        "password_hash": hashed,
        "full_name": body.full_name,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = result.data[0]
    token = create_access_token({"sub": user["id"]})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Verify credentials and return a JWT."""
    result = supabase.table("users").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"]})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserOut(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user.get("created_at"),
    )
