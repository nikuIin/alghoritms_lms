# bd worker
from csv import excel

from sqlalchemy.ext.asyncio import AsyncSession

from typing import Callable

# for saving metadata of functions
from functools import wraps

# auth files
from core.config import AUTH_CONFIG
from authx.schema import decode_token

# authentication config
from core.config import AUTH_CONFIG, ROLE_SETTING

from fastapi import HTTPException, Request

# logger module
from logger.logger_module import ModuleLoger

# Path worker
from pathlib import Path

# services of project
from services.user_services import UserService

from schemas.user_schema import UserBase

logger = ModuleLoger(Path(__file__).stem)


async def only_teacher(request: Request):
    try:
        token = request.cookies[AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME]
        token = decode_token(token=token, key=AUTH_CONFIG.JWT_SECRET_KEY)
        role = int(token["sub"][-2:-1])
        if role != ROLE_SETTING.teacher_role_id:
            logger.info("User %s ask access to teacher method." % token["sub"])
            raise HTTPException(
                status_code=403, detail="Forbidden. Only for teacher."
            )
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=403, detail="Forbidden. Only for teacher."
        )
