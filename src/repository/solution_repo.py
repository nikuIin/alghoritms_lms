from sqlalchemy.ext.asyncio import AsyncSession

from repository.user_repo import logger
from schemas.solution_schema import SolutionGet, SolutionUpdate, SolutionCreate
import repository.sql_queries.solution_queries as solution_queries

from sqlalchemy.exc import SQLAlchemyError


class SolutionRepo:

    @staticmethod
    async def create(
        session: AsyncSession, solution_in: SolutionCreate
    ) -> SolutionGet:

        async with session:
            try:
                result = await session.execute(
                    solution_queries.CREATE_SOLUTION,
                    params={
                        "user_login": solution_in.user_login,
                        "assignment_id": solution_in.assignment_id,
                        "answer": solution_in.answer,
                        "solution_status": solution_in.solution_status_id,
                    },
                )
                await session.commit()

            except SQLAlchemyError as e:
                await session.rollback()
                logger.error(e)
                raise SQLAlchemyError(e)

        result = result.mappings().fetchone()

        solution = SolutionGet(**result)
        logger.info("Created new solution: %s" % solution)

        return solution

    @staticmethod
    async def get_by_assignment(
        session: AsyncSession, assignment_id: str
    ) -> SolutionGet:

        async with session:
            result = await session.execute(
                solution_queries.GET_SOLUTION,
                params={
                    "assignment_id": assignment_id,
                },
            )

        solution = SolutionGet(**result.mappings().fetchone())
        logger.info("Created new solution: %s" % solution)
        return solution

    @staticmethod
    async def update_solution(
        solution_id: str,
        solution_in: SolutionUpdate,
        session: AsyncSession,
    ) -> SolutionGet:
        try:
            async with session:
                result = await session.execute(
                    solution_queries.UPDATE_SOLUTION,
                    params={
                        "solution_id": solution_id,
                        "feedback": solution_in.feedback,
                        "is_correct": solution_in.is_correct,
                        "solution_status_id": solution_in.solution_status_id,
                        "check_at": solution_in.check_at,
                    },
                )
                await session.commit()

        except SQLAlchemyError as e:
            await session.rollback()
            logger.error(e)

        result = result.mappings().fetchone()
        logger.debug(result)
        solution = SolutionGet(**result)
        logger.info("Updated solution (new data): %s" % solution)
        return solution
