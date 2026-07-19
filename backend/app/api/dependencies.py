import uuid
from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.postgres import get_db
from app.models.sql_models import User

async def get_current_user(
    x_user_id: str = Header(..., description="The UUID of the authenticated user"),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        user_uuid = uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid X-User-Id format")
        
    result = await db.execute(select(User).where(User.user_id == user_uuid))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
