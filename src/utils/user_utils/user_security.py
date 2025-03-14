import hashlib
from subprocess import getoutput

from schemas.user_schema import UserCreate, UserWithMD
from services.user_services import UserService

from logger.logger_module import ModuleLoger

from sqlalchemy.ext.asyncio import AsyncSession

from pathlib import Path

from core.config import CREDENTIALS_CONFIG
from utils.user_utils.hash import hash_password


async def authentication(
    session: AsyncSession, login_in: str, password_in: str
) -> bool:
    user_credentials = await UserService.get_user_credentials(
        session, login_in
    )
    password_in = hash_password(password_in)
    if not user_credentials or (user_credentials.user_login != login_in):
        return False

    if password_in == user_credentials.password:
        return True
    else:
        return False


async def registration(session: AsyncSession, user_in: UserCreate):
    await UserService.validate_user_data(session, user_in)
