from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

import repository.sql_queries.solution_queries as solution_queries
from repository.user_repo import logger
from schemas.action_schema import ActionGet
from schemas.solution_schema import SolutionCreate, SolutionGet, SolutionUpdate


class SolutionRepo:
    @staticmethod
    async def create(session: AsyncSession, solution_in: SolutionCreate) -> SolutionGet:
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
        logger.warning(result)
        solution = SolutionGet(
            user_login=result["user_login"],
            assignment_id=result["assignment_id"],
            answer=result["answer"],
            solution_id=result["solution_status_id"],
        )
        logger.info("Created new solution: %s" % solution)

        return solution

    @staticmethod
    async def get_by_assignment(session: AsyncSession, assignment_id: str) -> SolutionGet:
        """
        return last solution by assignment_id
        :param session:
        :param assignment_id:
        :return:
        """

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
    async def get_by_id(session: AsyncSession, solution_id: str) -> SolutionGet:
        async with session:
            result = await session.execute(
                solution_queries.GET_SOLUTION_BY_ID,
                params={
                    "solution_id": solution_id,
                },
            )

        return SolutionGet(**result.mappings().fetchone())

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
                        "answer": solution_in.answer,
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

    @staticmethod
    async def get_solution_for_review(
        session: AsyncSession,
    ):
        async with session:
            result = await session.execute(
                text("select user_login, assignment_id from solution where check_at is null")
            )
        result = result.mappings().fetchall()
        return result

    @staticmethod
    async def get_action(
        action_id: int,
        session: AsyncSession,
    ):
        async with session:
            result = await session.execute(
                solution_queries.GET_ACTION,
                params={
                    "action_id": action_id,
                },
            )

        return ActionGet(**result.mappings().fetchone())
