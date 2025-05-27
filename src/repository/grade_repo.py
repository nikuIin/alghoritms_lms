from os import stat
from pathlib import Path

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from logger.logger_module import ModuleLoger
from repository.sql_queries import grade_queries
from schemas.grade_schema import GradeGet, GradeGetFull

logger = ModuleLoger(Path(__file__).stem)


class GradeRepository:
    @staticmethod
    async def insert_grade(
        assignment_id: str,
        user_login: str,
        grade: int,
        session: AsyncSession,
    ) -> bool:
        try:
            async with session:
                await session.execute(
                    grade_queries.ADD_GRADE,
                    params={
                        "assignment_id": assignment_id,
                        "user_login": user_login,
                        "grade": grade,
                    },
                )
                await session.commit()
        except SQLAlchemyError as e:
            logger.error(e)
            await session.rollback()
            return False

        return True

    @staticmethod
    async def update_grade(
        assignment_id: str,
        user_login: str,
        grade: int,
        session: AsyncSession,
    ) -> bool:
        try:
            async with session:
                await session.execute(
                    grade_queries.UPDATE_GRADE,
                    params={
                        "assignment_id": assignment_id,
                        "user_login": user_login,
                        "grade": grade,
                    },
                )
                await session.commit()
        except SQLAlchemyError as e:
            logger.error(e)
            await session.rollback()
            return False

        return True

    @staticmethod
    async def delete_grade(
        assignment_id: str,
        user_login: str,
        session: AsyncSession,
    ) -> bool:
        try:
            async with session:
                await session.execute(
                    grade_queries.DELETE_GRADE,
                    params={
                        "assignment_id": assignment_id,
                        "user_login": user_login,
                    },
                )
                await session.commit()
        except SQLAlchemyError as e:
            logger.error(e)
            return False

        return True

    @staticmethod
    async def get_grade(user_login: str, assignemnt_id: str, session: AsyncSession):
        async with session:
            result = await session.execute(
                grade_queries.SELECT_GRADE,
                params={
                    "assignment_id": assignemnt_id,
                    "user_login": user_login,
                },
            )

        return result.mappings().fetchone()

    @staticmethod
    async def get_all_grades(
        session: AsyncSession,
    ):
        async with session:
            result = await session.execute(grade_queries.SELECT_ALL_GRADES)

        grades = [GradeGetFull(**grade) for grade in result.mappings()]

        return grades

    @staticmethod
    async def get_user_grades(
        user_login: str,
        session: AsyncSession,
    ):
        async with session:
            result = await session.execute(
                grade_queries.SELECT_USER_GRADES,
                params={"user_login": user_login},
            )

        grades = [GradeGetFull(**grade) for grade in result.mappings()]

        return grades
