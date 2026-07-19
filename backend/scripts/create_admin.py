"""
Create (or promote) an admin account.

The rest of the app hashes passwords with a placeholder scheme — see
app/api/routes/auth.py's signup handler: `password_hash = f"hashed_{password}"`.
This script uses the exact same scheme so the account can log in normally
through POST /api/v1/auth/login afterwards. (There's also a legacy
`dummy_hash_{role}` shortcut used only by the two seeded test accounts —
this script does not use that path.)

Usage
-----
    python scripts/create_admin.py --email admin@aero.com --password change-me

    # If the email already exists as a regular user, promote it instead of
    # failing:
    python scripts/create_admin.py --email jamal@jshub.dev --password change-me --promote

    # Omit --password to be prompted for one (hidden input, not echoed):
    python scripts/create_admin.py --email admin@aero.com

Run from the backend/ directory (or anywhere with backend/ on PYTHONPATH),
with the same .env / DATABASE_URL the API server uses.
"""
import argparse
import asyncio
import getpass
import sys
import uuid

from sqlalchemy import select

from app.db.postgres import db_session, dispose_engine
from app.models.sql_models import User


def hash_password(password: str) -> str:
    """Matches app/api/routes/auth.py signup's placeholder hashing scheme."""
    return f"hashed_{password}"


async def create_or_promote_admin(email: str, password: str, promote: bool) -> None:
    async with db_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()

        if existing:
            if not promote:
                print(
                    f"A user with email '{email}' already exists (role={existing.role}). "
                    "Re-run with --promote to make this account an admin instead of creating a new one.",
                    file=sys.stderr,
                )
                raise SystemExit(1)

            existing.role = "admin"
            existing.is_active = True
            existing.password_hash = hash_password(password)
            await session.commit()
            print(f"Promoted existing user '{email}' to admin and reset their password.")
            return

        admin = User(
            user_id=uuid.uuid4(),
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Created admin account '{email}'.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or promote an admin account for AERO ADMS.")
    parser.add_argument("--email", required=True, help="Admin account email.")
    parser.add_argument(
        "--password",
        default=None,
        help="Admin account password. If omitted, you'll be prompted (input hidden).",
    )
    parser.add_argument(
        "--promote",
        action="store_true",
        help="If the email already exists, promote it to admin instead of failing.",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    password = args.password or getpass.getpass("Admin password: ")
    if not password:
        print("Password cannot be empty.", file=sys.stderr)
        raise SystemExit(1)

    try:
        await create_or_promote_admin(args.email, password, args.promote)
    finally:
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
