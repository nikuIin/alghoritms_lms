from fastapi import APIRouter, HTTPException, Body, Response, Depends, Request

# schemas of user
from schemas.user_schema import UserWithMD, UserCreate, UserLogin, UserBase


from db.db_helper import db_helper
from sqlalchemy.ext.asyncio import AsyncSession
from services.user_services import UserService
from core.config import ROLE_SETTING

# types
from pydantic import EmailStr

# Auth library
# ----------------------
# import auth settings
from core.config import AUTH_CONFIG

# for auth working
from authx import AuthX
from authx.schema import decode_token

# logger
from logger.logger_module import ModuleLoger

# path worker
from pathlib import Path

# user login check
from utils.user_utils.user_security import authentication
from utils.user_utils.user_utils import only_teacher

# __file__ -> path to file
# method stem get name of file from path without type of file
logger = ModuleLoger(Path(__file__).stem)


router = APIRouter(tags=["user"])

RESERVED_WORDS = ["users", "teachers", "admins"]

# auth work
security = AuthX(config=AUTH_CONFIG)


# Routes:
@router.get(
    "/all/",
    response_model=list[UserWithMD],
)
async def get_all_users(
    request: Request,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get all list of users"""
    await only_teacher(request)
    users = await UserService.get_users(session)
    if not users:
        raise HTTPException(status_code=404, detail="Users not found")

    return users


@router.get(
    "/students/",
    response_model=list[UserWithMD],
)
async def get_all_students(
    request: Request,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    await only_teacher(request)
    """Get all list of students"""
    students = await UserService.get_users(
        session,
        ROLE_SETTING.user_role_id,
    )
    if not students:
        raise HTTPException(status_code=404, detail="Students not found")

    return students


@router.get("/teachers/", response_model=list[UserWithMD])
async def get_all_teachers(
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """Get all list of teachers"""
    teachers = await UserService.get_users(
        session, ROLE_SETTING.teacher_role_id
    )
    if not teachers:
        raise HTTPException(status_code=404, detail="Teachers not found")

    return teachers


@router.get(
    "/user/",
    response_model=UserWithMD,
    responses={
        404: {"description": "User not found"},
    },
)
async def get_user(
    phone: str | None = None,
    email: str | None = None,
    session: AsyncSession = Depends(db_helper.session_dependency),
) -> UserWithMD | None:
    """
    Get user by query parameters (email or phone)

    If phone and email exists, search will be by phone firstly.
    If no data by phone search, then will be searched by email.

    400 error if phone and email are not exists.

    :param phone: User phone number
    :param email: User email
    :param session: DB session
    :return: 404 with no data or user model
    """
    user = None
    if phone and email:
        user = await UserService.get_user_by_phone(session, phone)
        logger.debug(f"Find user by phone {phone}: {user}")
        if not user:
            user = await UserService.get_user_by_email(session, email)
            logger.debug(f"Find user by email {email}: {user}")
    elif email:
        user = await UserService.get_user_by_email(session, email)
        logger.debug(f"Find user by email {email}: {user}")
    elif phone:
        user = await UserService.get_user_by_phone(session, phone)
        logger.debug(f"Find user by phone {phone}: {user}")
    else:
        raise HTTPException(status_code=400, detail="No phone or email")
    # if not user:
    #     raise HTTPException(
    #         status_code=404,
    #         detail=f"User with data {phone, email} not found",
    #     )
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
        # response.set_cookie(AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME, token)
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
async def whoami(request: Request):
    await only_teacher(
        request
    )  # TODO: figure out how create decorator for fast-api route
    token = request.cookies[AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME]
    token = decode_token(token=token, key=AUTH_CONFIG.JWT_SECRET_KEY)
    role = int(token["sub"][-2:-1])
    return role


@router.get("/user/{login}/", response_model=UserWithMD, status_code=200)
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
    request: Request,
    user_in: UserCreate = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    await only_teacher(request)
    """
    Create new user
    :param user_in: json data of new user
    :param session: session to db
    :return: data of new user or error message
    """
    return await UserService.create_user(session, user_in)
