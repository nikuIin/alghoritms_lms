from re import A
from typing_extensions import Any
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
import uuid
from core.config import AUTH_CONFIG
from authx import AuthX
from utils.user_utils.user_utils import only_teacher
from db.db_helper import db_helper
from logger.logger_module import ModuleLoger
from pathlib import Path


# Логгер
logger = ModuleLoger(Path(__file__).stem)

# Инициализация роутера и авторизации
security = AuthX(config=AUTH_CONFIG)
router = APIRouter(tags=["Solution"])

# --- Схемы Pydantic ---


class SolutionCreate(BaseModel):
    user_login: str
    assignment_id: str
    solution_status_id: int = 1
    answer: List[int]
    attempt_number: int = 1


class SolutionGet(BaseModel):
    user_login: str
    assignment_id: Any
    solution_status_id: int
    answer: List[int]
    attempt_number: int
    is_correct: bool | None
    feedback: str | None
    start_at: datetime
    sent_at: datetime | None
    check_at: datetime | None


class SolutionUpdate(BaseModel):
    solution_status_id: int = 2
    feedback: str | None = None
    is_correct: bool
    answer: List[int]


class GradeCreate(BaseModel):
    grade: int = Field(ge=2, le=5)
    user_login: str
    assignment_id: str


class SolutionForCheck(BaseModel):
    assignment_id: str
    user_login: str


# --- Репозиторий ---


class SolutionRepo:
    @staticmethod
    async def create(session: AsyncSession, solution_in: SolutionCreate):
        query = """
            INSERT INTO solution (user_login, assignment_id, solution_status_id, answer, attempt_number, start_at)
            VALUES (:user_login, :assignment_id, :solution_status_id, :answer, :attempt_number, :start_at)
            on conflict(user_login, assignment_id) do update set answer = :answer, check_at = null
            RETURNING user_login, assignment_id;
        """
        try:
            result = await session.execute(
                text(query),
                {
                    "user_login": solution_in.user_login,
                    "assignment_id": solution_in.assignment_id,
                    "solution_status_id": solution_in.solution_status_id,
                    "answer": solution_in.answer,
                    "attempt_number": solution_in.attempt_number,
                    "start_at": datetime.utcnow(),
                },
            )
            await session.commit()
            return result.mappings().first()
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating solution: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create solution")

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
    async def get_solutions_for_check(session: AsyncSession) -> List[SolutionForCheck]:
        query = """
            SELECT user_login, assignment_id
            FROM solution
            WHERE solution_status_id = 1;
        """
        try:
            result = await session.execute(text(query))
            return [SolutionForCheck(**row) for row in result.mappings().all()]
        except Exception as e:
            logger.error(f"Error fetching solutions for check: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch solutions for check")

    @staticmethod
    async def get_by_assignment_and_user(
        session: AsyncSession, assignment_id: str, user_login: str
    ) -> SolutionGet | None:
        query = """
            SELECT *
            FROM solution
            WHERE assignment_id = :assignment_id AND user_login = :user_login;
        """
        try:
            result = await session.execute(
                text(query),
                {"assignment_id": assignment_id, "user_login": user_login},
            )
            row = result.mappings().first()
            if not row:
                return None
            return SolutionGet(**row)
        except Exception as e:
            logger.error(f"Error fetching solution: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch solution")

    @staticmethod
    async def update_solution(
        session: AsyncSession, assignment_id: str, user_login: str, solution_in: SolutionUpdate
    ):
        query = """
            UPDATE solution
            SET solution_status_id = :solution_status_id,
                feedback = :feedback,
                is_correct = :is_correct,
                answer = :answer,
                check_at = :check_at
            WHERE assignment_id = :assignment_id AND user_login = :user_login
            RETURNING user_login, assignment_id;
        """
        try:
            result = await session.execute(
                text(query),
                {
                    "solution_status_id": solution_in.solution_status_id,
                    "feedback": solution_in.feedback,
                    "is_correct": solution_in.is_correct,
                    "answer": solution_in.answer,
                    "check_at": datetime.utcnow(),
                    "assignment_id": assignment_id,
                    "user_login": user_login,
                },
            )
            await session.commit()
            row = result.mappings().first()
            if not row:
                raise HTTPException(status_code=404, detail="Solution not found")
            return row
        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating solution: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update solution")

    @staticmethod
    async def create_grade(session: AsyncSession, grade_in: GradeCreate):
        query = """
            INSERT INTO grade (grade, user_login, assignment_id)
            VALUES (:grade, :user_login, :assignment_id)
            on conflict (assignment_id, user_login) do update set grade = :grade
            RETURNING grade, user_login, assignment_id;
        """
        try:
            result = await session.execute(
                text(query),
                {
                    "grade": grade_in.grade,
                    "user_login": grade_in.user_login,
                    "assignment_id": grade_in.assignment_id,
                },
            )
            await session.commit()
            return result.mappings().first()
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating grade: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create grade")


# --- Эндпоинты ---


@router.get("/solution_for_review")
async def get_solution_for_review(session: AsyncSession = Depends(db_helper.session_dependency)):
    return await SolutionRepo.get_solution_for_review(session=session)


@router.post("/create_solution/")
async def create_solution(
    solution_in: SolutionCreate,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Create a new solution.
    """
    try:
        result = await SolutionRepo.create(session=session, solution_in=solution_in)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_solution: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/solutions_for_check/", response_model=List[SolutionForCheck])
async def get_solutions_for_check(
    session: AsyncSession = Depends(db_helper.session_dependency),
    user=Depends(only_teacher),
):
    """
    Get list of solutions pending review (solution_status_id = 1).
    """
    try:
        solutions = await SolutionRepo.get_solutions_for_check(session=session)
        return solutions
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_solutions_for_check: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/solution/", response_model=SolutionGet | None)
async def get_solution(
    assignment_id: str = Query(...),
    login: str = Query(..., alias="login"),
    session: AsyncSession = Depends(db_helper.session_dependency),
    user=Depends(only_teacher),
):
    """
    Get specific solution by assignment_id and user_login.
    """
    try:
        solution = await SolutionRepo.get_by_assignment_and_user(
            session=session, assignment_id=assignment_id, user_login=login
        )
        if not solution:
            raise HTTPException(status_code=404, detail="Solution not found")
        return solution
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_solution: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/update_solution/")
async def update_solution(
    assignment_id: str = Query(...),
    user_login: str = Query(...),
    solution_in: SolutionUpdate = Body(...),
    session: AsyncSession = Depends(db_helper.session_dependency),
    user=Depends(only_teacher),
):
    """
    Update solution with feedback, is_correct, and status.
    """
    try:
        result = await SolutionRepo.update_solution(
            session=session,
            assignment_id=assignment_id,
            user_login=user_login,
            solution_in=solution_in,
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in update_solution: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/grade/")
async def create_grade(
    grade_in: GradeCreate,
    session: AsyncSession = Depends(db_helper.session_dependency),
    user=Depends(only_teacher),
):
    """
    Create a grade for a solution.
    """
    try:
        result = await SolutionRepo.create_grade(session=session, grade_in=grade_in)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_grade: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/grade/")
async def get_grade(
    assignment_id: str,
    login: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    result = await session.execute(
        text(
            "select grade from grade where assignment_id = :assignment_id and user_login = :login"
        ),
        {"assignment_id": assignment_id, "login": login},
    )
    return result.scalars().first()
