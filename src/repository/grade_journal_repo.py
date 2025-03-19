import repository.sql_queries.grade_journal_queries as grade_journal_queries
from schemas.grade_journal_schema import GradeJournalGet, GradeJournalCreate

from sqlalchemy.ext.asyncio import AsyncSession

from logger.logger_module import ModuleLoger

from pathlib import Path

logger = ModuleLoger(Path(__file__).stem)


class GradeJournalRepo:

    @staticmethod
    async def get_grade(
        assignment_id: str,
        session: AsyncSession,
    ) -> GradeJournalGet:

        async with GradeJournalGet:
            result = await session.execute(
                grade_journal_queries.GET_GRADE,
                params={
                    "assignment_id": assignment_id,
                },
            )

        return GradeJournalGet(**result.mappings().fetchone())

    @staticmethod
    async def get_journal(
        session: AsyncSession,
    ) -> list[GradeJournalGet]:
        async with session:
            result = await session.execute(
                grade_journal_queries.GET_JOURNAL,
            )

        journal = [GradeJournalGet(**grade) for grade in result.mappings()]
        logger.info("Requesting to journal: %s" % journal)
        return journal
