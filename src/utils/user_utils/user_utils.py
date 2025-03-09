# bd worker
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Callable

# for saving metadata of functions
from functools import wraps

# auth files
from core.config import AUTH_CONFIG
from authx.schema import decode_token

# authentication config
from core.config import AUTH_CONFIG

from fastapi import HTTPException, Request

# logger module
from logger.logger_module import ModuleLoger

# Path worker
from pathlib import Path

# services of project
from services.user_services import UserService

from schemas.user_schema import UserBase

logger = ModuleLoger(Path(__file__).stem)


def only_teacher(request: Request):
    token = request.cookies[AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME]
    token = decode_token(token=token, key=AUTH_CONFIG.JWT_SECRET_KEY)
    role = int(token["sub"][-2:-1])

    if role != 2:
        raise HTTPException(status_code=404, detail="Forbidden.")
