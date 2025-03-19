from fastapi import APIRouter, Depends, HTTPException, status

from db.db_helper import db_helper
from sqlalchemy.ext.asyncio import AsyncSession

# Auth library
# ----------------------
# import auth settings
from core.config import AUTH_CONFIG

# for auth working
from authx import AuthX
from authx.schema import decode_token

from core.config import AUTH_CONFIG

# logger
from logger.logger_module import ModuleLoger
from repository.grade_journal_repo import GradeJournalRepo

router = APIRouter(tags=["Grade Journal"])

security = AuthX(config=AUTH_CONFIG)


@router.get("/grade_journal/")
async def get_grade_journal(
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await GradeJournalRepo.get_journal(session=session)
