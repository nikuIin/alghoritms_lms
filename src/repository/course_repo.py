# module for work with db in asyncio mod
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text


from db.sql_helper import insert_helper
from schemas.course_schema import CourseBase, CourseGet, CourseCreate

# Logger module
from logger.logger_module import ModuleLoger

# SQL queries
import repository.sql_queries.course_queries as course_queries

# configuration file
from core.config import STATUS_OF_ELEMENTS_SETTINGS

# lib for working with path
from pathlib import Path

from schemas.user_schema import UserLoginOnly

# initialize logger for user repo
# __file__ -> path to file
# method stem get name of file from path without type of file
logger = ModuleLoger(Path(__file__).stem)


class CourseRepository:

    @staticmethod
    async def is_course_exists(session: AsyncSession, course_id: str) -> bool:
        async with session:
            result = await session.execute(
                course_queries.IS_COURSE_EXISTS, {"course_id": course_id}
            )

        if course := result.fetchone():
            logger.info(course)
            return True
        return False

    @staticmethod
    async def get_all_course(session: AsyncSession) -> list[CourseGet]:
        async with session:
            result = await session.execute(course_queries.GET_COURSES)

        courses = [
            CourseGet(
                course_id=str(row.course_id),
                name=row.name,
                owner=row.owner,
                status_id=row.status_id,
                description=row.description,
            )
            for row in result.mappings()
        ]
        return courses

    @staticmethod
    async def get_course(
        course_id: str, session: AsyncSession
    ) -> CourseGet | None:
        """Get courses by id."""
        async with session:
            result = await session.execute(
                course_queries.GET_COURSE_BY_ID,
                params={"course_id": course_id},
            )
        course = CourseGet(**result.mappings().fetchone())
        logger.info("The course: %s have been requests" % course)

        return course if course else None

    @staticmethod
    async def get_courses_by_owner(
        owner: str, session: AsyncSession
    ) -> list[CourseGet]:
        """Get all courses owned by a specific owner."""
        async with session:
            result = await session.execute(
                course_queries.GET_COURSES_BY_OWNER,
                params={"owner": owner},
            )
        courses = [CourseGet(**row) for row in result.mappings().fetchall()]
        logger.info(
            "Courses owned by %s have been requested: %s" % (owner, courses)
        )

        return courses

    @staticmethod
    async def get_user_courses(
        user_login: str,
        session: AsyncSession,
    ) -> list[CourseGet]:
        async with session:
            result = await session.execute(
                course_queries.GET_USER_COURSES,
                params={
                    "user_login": user_login,
                },
            )
        course_list = [
            CourseGet(**row) for row in result.mappings().fetchall()
        ]
        return course_list

    @staticmethod
    async def get_users_on_course(
        course_id: str, session: AsyncSession
    ) -> list[dict]:
        """Get all users enrolled in a specific course."""
        async with session:
            result = await session.execute(
                course_queries.GET_USERS_ON_COURSE,
                params={"course_id": course_id},
            )
        users = [
            {"course_id": row["course_id"], "user_login": row["user_login"]}
            for row in result.mappings().fetchall()
        ]
        logger.info(
            "Users for course %s have been requested: %s" % (course_id, users)
        )

        return users

    @staticmethod
    async def create_course(
        course: CourseCreate, session: AsyncSession
    ) -> None:
        """Create a new course."""
        async with session:
            await session.execute(
                course_queries.CREATE_COURSE,
                params={
                    "name": course.name,
                    "owner": course.owner,
                    "status_id": STATUS_OF_ELEMENTS_SETTINGS.draft,
                    "description": course.description or "",
                },
            )
            await session.commit()
        logger.info("Course %s created by %s" % (course.name, course.owner))

    @staticmethod
    async def add_users_to_course(
        course_id: str,
        user_logins: list[str],
        session: AsyncSession,
    ):
        logins_to_course = [
            ("'" + course_id + "'", "'" + user_login + "'")
            for user_login in user_logins
        ]
        insert_query = insert_helper(
            course_queries.ADD_USERS_TO_COURSE,
            logins_to_course,
        )
        insert_query += ' on conflict (course_id, user_login) do nothing'
        try:
            async with session:
                await session.execute(text(insert_query))
                await session.commit()

        except SQLAlchemyError as e:
            logger.info(e)
            raise SQLAlchemyError()

        logger.info('Users added successfully to course %s' % course_id)

    @staticmethod
    async def get_users_from_course(
        course_id: str,
        session: AsyncSession,
    ) -> list[str]:
        logger.debug(course_id)
        async with session:
            result = await session.execute(
                course_queries.SELECT_COURSE_USERS,
                params={"course_id": course_id},
            )

        return [row.user_login for row in result.mappings().fetchall()]

    @staticmethod
    async def add_user_to_course(
        course_id: str, user_login: str, session: AsyncSession
    ) -> None:
        """Add a user to a course."""
        async with session:
            await session.execute(
                course_queries.ADD_USER_TO_COURSE,
                params={"course_id": course_id, "user_login": user_login},
            )
            await session.commit()
        logger.info("User %s added to course %s" % (user_login, course_id))
