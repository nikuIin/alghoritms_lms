from fastapi import APIRouter, HTTPException, Body, Response, Request, Depends
from typing import List, Any, Coroutine

from repository.course_repo import CourseRepository

# schemas of course
from schemas.course_schema import CourseGet, CourseCreate

from db.db_helper import db_helper
from schemas.user_schema import UserCreate

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import DataError as SQLDataError, SQLAlchemyError

# !!! from services.course import UserService
from core.config import ROLE_SETTING

# exceptions
from exceptions.UserException import UserNotFound
from exceptions.ValidationException import UUIDValidationException

# Auth library
# ----------------------
# import auth settings
from core.config import AUTH_CONFIG

# for auth working
from authx import AuthX

# ----------------------

from services.course_services import CourseServices

# logger
from logger.logger_module import ModuleLoger

# path worker
from pathlib import Path

from starlette.responses import Response

# utils that check permissions
from utils.user_utils.user_utils import only_teacher

router = APIRouter(tags=["course"])
security = AuthX(config=AUTH_CONFIG)

logger = ModuleLoger(Path(__file__).stem)


@router.get("/course/{course_uuid}/", response_model=CourseGet)
async def get_course(
    course_uuid: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
) -> CourseGet:
    """
    Retrieves a course by its UUID.
    """
    try:
        course = await CourseServices.get_course_by_id(
            session=session, course_id=course_uuid
        )
        return course

    except UUIDValidationException:
        raise HTTPException(
            status_code=400,
            detail="UUID of course validation error. "
            "UUID should be 32..36 length and UUID must contains "
            "only hex symbols.",
        )

    except HTTPException as e:
        raise e  # Re-raise the HTTPException
    except SQLAlchemyError as e:
        logger.error(
            f"Error occurred while getting course by uuid: {course_uuid} — {e}"
        )
        raise HTTPException(status_code=500, detail="Database Server Error")


@router.get("/courses/owner/{owner_login}", response_model=List[CourseGet])
async def get_courses_by_owner(
    owner_login: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
) -> list[CourseGet]:
    """
    Retrieves all courses owned by a specific user.
    """
    try:
        courses = await CourseServices.get_courses_by_owner(
            owner=owner_login, session=session
        )
        if courses:
            return courses
        raise HTTPException(status_code=404, detail="Not Found")
    except SQLAlchemyError as e:
        logger.error(
            f"Error occurred while getting courses by owner: "
            f"{owner_login} - {e}"
        )
        raise HTTPException(status_code=500, detail="Database Server Error")


@router.get("/courses/")
async def get_courses(
    response: Response,
    session: AsyncSession = Depends(db_helper.session_dependency),
) -> List[CourseGet]:
    try:
        courses = await CourseServices.get_all_courses(session=session)
    except SQLAlchemyError as e:
        logger.error()
        raise HTTPException(status_code=500, detail="Database Server Error")

    if courses:
        return courses

    raise HTTPException(status_code=404, detail="Not Found")


@router.get(
    "/courses-user/{user_login}/",
)
async def get_user_courses(
    user_login: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    courses = await CourseServices.get_user_courses(
        user_login=user_login, session=session
    )
    if courses:
        return courses

    raise HTTPException(
        status_code=404,
        detail=f"Courses of user {user_login} not found",
    )


@router.post("/courses/", status_code=201)
async def create_course(
    response: Response,
    course: CourseCreate = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Creates a new course.  Only teachers can access this endpoint.
    """
    try:
        await CourseServices.create_course(course=course, session=session)
        response.status_code = 201
        return {"detail": "Course created successfully"}
    except HTTPException as e:
        raise e  # Re-raise the HTTPException

    except UUIDValidationException:
        raise HTTPException(
            status_code=400,
            detail="UUID validation error. UUID should be 32..36 length",
        )

    except UserNotFound:
        response.status_code = 400
        return {"detail": "User not found"}
    except SQLAlchemyError as e:
        logger.error(
            f"Error occurred while creating course: {course.name} - {e}"
        )
        raise HTTPException(status_code=500, detail="Database Server Error")


@router.post("/courses/register_user/", status_code=204)
async def add_user_to_course(
    request: Request,
    course_uuid: str = Body(),
    user_login: str = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
) -> Response:
    """
    Adds a user to a course.
    """
    await only_teacher(request)
    try:
        await CourseServices.add_user_to_course(
            course_id=course_uuid, user_login=user_login, session=session
        )
        return Response(status_code=204)
    except UUIDValidationException:
        raise HTTPException(
            status_code=400,
            detail="UUID of course validation error. "
            "UUID should be 32..36 length and UUID must contains"
            " only hex symbols.",
        )
    except SQLAlchemyError as e:
        logger.error(
            f"Error occurred while adding user {user_login} to course {course_uuid} - {e}"
        )
        raise HTTPException(status_code=500, detail="Database Server Error")


@router.post("/register_users/", status_code=204)
async def add_users_to_course(
    request: Request,
    users: list[str] = Body(),
    course_uuid: str = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    await only_teacher(request)
    try:
        await CourseRepository.add_users_to_course(
            course_id=course_uuid,
            user_logins=users,
            session=session,
        )
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database Server Error")


@router.get("/users_from_course/{course_id}/")
async def get_users_from_course(
    course_id: str,
    request: Request,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    await only_teacher(request)
    return await CourseRepository.get_users_from_course(
        course_id=course_id,
        session=session,
    )
