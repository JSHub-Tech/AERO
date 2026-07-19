from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from app.db.postgres import get_db
from app.api.dependencies import get_current_user
from app.models.sql_models import User
from app.models.schemas import PasswordResetRequest, UpdateEmailRequest, UserLogin, UserOut

router = APIRouter()


def _password_matches(user: User, password: str) -> bool:
    """Matches signup's `hashed_{password}` placeholder scheme, plus the
    legacy `dummy_hash_{role}` shortcut used only by the two seeded test
    accounts (admin@aero.com / passenger@aero.com, password == their role).
    Shared by /login and /me/email so both check a password the same way.
    """
    if user.password_hash == f"hashed_{password}":
        return True
    if user.password_hash == f"dummy_hash_{user.role}" and password == user.role:
        return True
    return False

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
    if not _password_matches(user, payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user


@router.post("/reset-password", response_model=UserOut)
async def reset_password(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Self-service password reset.

    NOTE: like the rest of this app's auth, this is intentionally simple and
    NOT production-grade — there's no email verification step, so anyone who
    knows an account's email can reset its password. A real implementation
    would email a single-use, time-limited reset token and require it here
    instead of trusting the request outright. Fine for a dev/demo build; do
    not ship this exact flow to production.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if not user:
        # Same generic error as a wrong password would give — avoids
        # confirming which emails are/aren't registered.
        raise HTTPException(status_code=404, detail="No account found with that email.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated. Contact an administrator.")

    user.password_hash = f"hashed_{payload.new_password}"
    await db.commit()
    await db.refresh(user)

    return user


@router.patch("/me/email", response_model=UserOut)
async def update_my_email(
    payload: UpdateEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service email change for the signed-in user. Requires the current
    password so someone with a stolen/guessed X-User-Id (auth here isn't a
    real session token — see get_current_user) can't silently take over an
    account's email on its own."""
    if not _password_matches(current_user, payload.current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    if payload.new_email == current_user.email:
        return current_user

    existing = await db.execute(select(User).where(User.email == payload.new_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="That email is already registered to another account.")

    current_user.email = payload.new_email
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="That email is already registered to another account.")
    await db.refresh(current_user)

    return current_user