"""Admin user management — view accounts, change roles, activate/deactivate.
Not part of api.md; required by the Command Center's Users tab."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies import require_admin
from app.models.schemas import UserOut, UserRoleUpdate, UserStatusUpdate
from app.models.sql_models import User

router = APIRouter()


@router.get("", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """All registered accounts, newest first. Admin only."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Promote a user to admin, or demote an admin back to a regular user."""
    try:
        parsed_id = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id must be a valid UUID.")

    if parsed_id == admin.user_id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote your own account.")

    result = await db.execute(select(User).where(User.user_id == parsed_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.role = payload.role
    await db.commit()
    await db.refresh(target)
    return target


@router.patch("/{user_id}/status", response_model=UserOut)
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Activate or deactivate an account. Deactivated users are blocked at login
    and at every authenticated endpoint."""
    try:
        parsed_id = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id must be a valid UUID.")

    if parsed_id == admin.user_id and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")

    result = await db.execute(select(User).where(User.user_id == parsed_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.is_active = payload.is_active
    await db.commit()
    await db.refresh(target)
    return target
