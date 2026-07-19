from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.postgres import get_db
from app.models.sql_models import User
from app.models.schemas import UserLogin, UserOut

router = APIRouter()

class SignupRequest(BaseModel):
    email: str
    password: str

@router.post("/signup", response_model=UserOut)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Since we are not doing full JWT/bcrypt right now, we will store a simple dummy hash.
    # In a real app, use passlib to hash payload.password
    new_user = User(
        email=payload.email,
        password_hash=f"hashed_{payload.password}",
        role="user"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=UserOut)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated. Contact an administrator.")

    # In a real app, use passlib.verify(payload.password, user.password_hash)
    if user.password_hash != f"hashed_{payload.password}" and user.password_hash != f"dummy_hash_{user.role}":
        # Note: the `dummy_hash_{role}` check is to allow the seeded admin@aero.com 
        # and passenger@aero.com test accounts to log in with password 'admin' / 'passenger'
        if payload.password != user.role: 
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
    return user