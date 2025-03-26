# package for work with data of users in db
from exceptions.UserException import UserNotFound
from exceptions.ValidationException import UUIDValidationException
from repository.course_repo import CourseRepository
from repository.user_repo import UserRepository

from schemas.course_schema import CourseGet, CourseCreate
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from typing import List

from utils.uuid_checker import validate_uuid

# lib for working with paths
from pathlib import Path

from services.user_services import UserService

# logger module
from logger.logger_module import ModuleLoger

# initialize logger for user repo
# __file__ -> path to file
# method stem get name of file from path without type of file

logger = ModuleLoger(Path(__file__).stem)


class CourseServices:
    @staticmethod
    async def get_all_courses(
        session: AsyncSession,
    ) -> List[CourseGet]:
        return await CourseRepository.get_all_course(session)

    @staticmethod
    async def get_course_by_id(course_id: str, session: AsyncSession) -> CourseGet | None:
        """
        Retrieves a course by its ID.
        Prepends "md" to the course ID.
        Raises HTTPException 404 if the course is not found.
        """
        if not validate_uuid(course_id):
            raise UUIDValidationException()
        course = await CourseRepository.get_course(session=session, course_id=course_id)
        if not course:
            # return None
            raise HTTPException(
                status_code=404,
                detail=f"Course with id: {course_id} not found",
            )

        course.course_id = str(course.course_id)
        return course

    @staticmethod
    async def is_course_exists(
        course_uuid: str,
        session: AsyncSession,
    ):
        return await CourseRepository.is_course_exists(course_id=course_uuid, session=session)

    @staticmethod
    async def get_user_courses(
        user_login: str,
        session: AsyncSession,
    ):
        return await CourseRepository.get_user_courses(
            user_login=user_login,
            session=session,
        )

    @staticmethod
    async def get_courses_by_owner(owner: str, session: AsyncSession) -> List[CourseGet]:
        """
        Retrieves all courses owned by a specific user.
        Returns an empty list if no courses are found.
        """
        courses = await CourseRepository.get_courses_by_owner(owner=owner, session=session)
        return courses

    @staticmethod
    async def get_users_on_course(course_id: str, session: AsyncSession) -> List[dict]:
        """
        Retrieves all users enrolled in a specific course.
        Returns an empty list if no users are found.
        """
        users = await CourseRepository.get_users_on_course(course_id=course_id, session=session)
        return users

    @staticmethod
    async def create_course(course: CourseCreate, session: AsyncSession) -> None:
        """Creates a new course."""
        if not await UserRepository.is_user_exists(login=course.owner, session=session):
            raise UserNotFound
        await CourseRepository.create_course(course=course, session=session)

    @staticmethod
    async def add_user_to_course(course_id: str, user_login: str, session: AsyncSession) -> None:
        """Adds a user to a course."""
        try:
            await CourseRepository.add_user_to_course(
                course_id=course_id, user_login=user_login, session=session
            )
        except Exception as e:
            logger.error(f"Error adding user to course: {e}")
            raise HTTPException(status_code=400, detail="Course or user does not exist")
