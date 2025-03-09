from fastapi import APIRouter, HTTPException, Body, Response, Depends, Request

# schemas of user
from schemas.user_schema import (
    UserWithMD,
    UserCreate,
    UserLogin,
)

from db.db_helper import db_helper
from sqlalchemy.ext.asyncio import AsyncSession
from services.user_services import UserService
from core.config import ROLE_SETTING

# Auth library
# ----------------------
# import auth settings
from core.config import AUTH_CONFIG

# for auth working
from authx import AuthX
from authx.exceptions import JWTDecodeError

# logger
from logger.logger_module import ModuleLoger

# path worker
from pathlib import Path

# user login check
from utils.user_utils.user_security import authentication
from utils.user_utils.hash import hash_password

# __file__ -> path to file
# method stem get name of file from path without type of file
logger = ModuleLoger(Path(__file__).stem)

router = APIRouter(prefix="/user", tags=["user"])

RESERVED_WORDS = ["users", "teachers", "admins"]

# auth work
security = AuthX(config=AUTH_CONFIG)


@router.get(
    "/all/",
    response_model=list[UserWithMD],
)
async def get_all_users(
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get all list of users"""
    users = await UserService.get_users(session)
    if not users:
        raise HTTPException(status_code=404, detail="Users not found")

    return users


@router.get("/users/", response_model=list[UserWithMD])
async def get_all_users(
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get all list of users"""
    try:
        users = await UserService.get_users(
            session,
            ROLE_SETTING.user_role_id,
        )
        if not users:
            raise HTTPException(status_code=404, detail="Users not found")

        return users
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/teachers/", response_model=list[UserWithMD])
async def get_all_teachers(
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get all list of teachers"""
    try:
        teachers = await UserService.get_users(
            session, ROLE_SETTING.teacher_role_id
        )
        if not teachers:
            raise HTTPException(status_code=404, detail="Teachers not found")

        return teachers
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/by-phone/", response_model=UserWithMD)
async def get_user_by_phone(
    phone: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get user by query parameters (email or phone)"""
    user = None
    if phone:
        user = await UserService.get_user_by_phone(session, phone)
    elif email and not phone:
        user = await UserService.get_user_by_email(session, email)
    else:
        raise HTTPException(status_code=400, detail="No phone or email")
    if not user:
        raise HTTPException(
            status_code=404, detail=f"User with phone {phone} not found"
        )
    return user


@router.get("/by-email/", response_model=UserWithMD)
async def get_user_by_email(
    email: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get user by email"""
    user = await UserService.get_user_by_email(session, email)
    if not user:
        raise HTTPException(
            status_code=404, detail=f"User with email {email} not found"
        )
    return user


# realize authorization/authentication
@router.post("/login/")
async def user_auth(
    response: Response,
    credentials: UserLogin = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    if await authentication(
        session, credentials.user_login, credentials.password
    ):
        logger.info(f"User %s login successful" % credentials.user_login)
        token = security.create_access_token(
            uid=str([credentials.user_login, credentials.role_id]),
        )
        response.set_cookie(AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME, token)
        return {"access_token": token}

    response.delete_cookie("AccessToken")
    response.status_code = 403
    return {"status": "Incorrect username or password"}


@router.get(
    "/protected/",
    dependencies=[
        Depends(security.access_token_required),
    ],
)
def protected(request: Request):
    """
    Some protected
    :param request:
    :return:
    """
    return request.cookies["AccessToken"]


@router.get("/get/{login}", response_model=UserWithMD, status_code=200)
async def get_user_by_login(
    login: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get user by login"""
    """
    ATTENTION: 
    add constraint in frontend: check that login not in reserved words
    """
    # if login in RESERVED_WORDS:
    #     raise HTTPException(
    #         status_code=400,
    #         detail=f'The login: {login} is reserved'
    #     )
    try:
        user = await UserService.get_user_by_login(session, login)
    except Exception as e:
        # TODO: log exception
        raise HTTPException(status_code=500, detail="Internal server error")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post(
    "/create/{login}/",
    response_model=UserWithMD,
)
async def create_user(
    user_in: UserCreate = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Create new user
    :param user_in: json data of new user
    :param session: session to db
    :return: data of new user or error message
    """
    return await UserService.create_user(session, user_in)
