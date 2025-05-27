# for auth working
from authx import AuthX
from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Auth library
# ----------------------
# import auth settings
from core.config import AUTH_CONFIG
from db.db_helper import db_helper

# logger
from logger.logger_module import ModuleLoger
from repository.grade_repo import GradeRepository
from schemas.grade_schema import GradeAdd, GradeDelete, GradeGet, GradeUpdate

router = APIRouter(tags=["Grade Journal"], prefix="/api")

security = AuthX(config=AUTH_CONFIG)


@router.post("/grade/")
async def set_grade(
    grade_in: GradeAdd = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
) -> bool:
    return await GradeRepository.insert_grade(
        assignment_id=grade_in.assignment_id,
        user_login=grade_in.user_login,
        grade=grade_in.grade,
        session=session,
    )


@router.put("/grade/")
async def update_grade(
    grade_in: GradeUpdate = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await GradeRepository.update_grade(
        assignment_id=grade_in.assignment_id,
        user_login=grade_in.user_login,
        grade=grade_in.grade,
        session=session,
    )


@router.delete("/grade/")
async def delete_grade(
    grade_delete: GradeDelete = Body(),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await GradeRepository.delete_grade(
        assignment_id=grade_delete.assinment_id,
        user_login=grade_delete.user_login,
        session=session,
    )


@router.get("/grade/")
async def get_grade(
    assignment_id: str,
    user_login: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await GradeRepository.get_grade(
        assignemnt_id=assignment_id, user_login=user_login, session=session
    )


@router.get("/all_grades/")
async def get_all_grades(
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return {
        "grades": await GradeRepository.get_all_grades(session=session),
    }


@router.get("/user_grades/")
async def get_user_grades(
    user_login: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return {
        "grades": await GradeRepository.get_user_grades(user_login=user_login, session=session),
    }
