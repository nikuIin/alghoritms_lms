from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.db_helper import db_helper
from logger.logger_module import ModuleLoger

# Логгер
logger = ModuleLoger(Path(__file__).stem)

# Инициализация роутера
router = APIRouter(tags=["Grade"])

# --- Схемы Pydantic ---


class GradeGet(BaseModel):
    grade: int = Field(ge=2, le=5)
    assignment_id: Any
    user_login: str
    created_at: datetime
    updated_at: datetime
    assignment_name: str | None  # Название задания


class GradeUpdate(BaseModel):
    grade: int = Field(ge=2, le=5)


# --- Репозиторий ---


class UserRepo:
    @staticmethod
    async def get_user_role(session: AsyncSession, user_login: str) -> int:
        """
        Получить role_id пользователя по user_login.
        """
        query = """
            SELECT role_id
            FROM "user"
            WHERE user_login = :user_login;
        """
        try:
            result = await session.execute(
                text(query),
                {"user_login": user_login},
            )
            user = result.mappings().first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user["role_id"]
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching user role: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch user role")


class GradeRepo:
    @staticmethod
    async def get_grades(session: AsyncSession, user_login: str, role_id: int) -> list[dict]:
        """
        Получить оценки: все для учителей, только свои для учеников.
        """
        query = """
            SELECT g.grade, g.assignment_id, g.user_login, g.created_at, g.updated_at,
                   (SELECT name FROM assignment WHERE assignment_id = g.assignment_id) as assignment_name
            FROM grade g
            WHERE :user_login='teacher' OR g.user_login = :user_login
            ORDER BY g.updated_at DESC;
        """
        try:
            params = {"user_login": user_login if role_id == 1 else "teacher"}
            result = await session.execute(text(query), params)
            return result.mappings().all()
        except Exception as e:
            logger.error(f"Error fetching grades: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch grades")

    @staticmethod
    async def update_grade(
        session: AsyncSession, assignment_id: str, user_login: str, grade_in: GradeUpdate
    ):
        """
        Обновить оценку.
        """
        query = """
            UPDATE grade
            SET grade = :grade, updated_at = :updated_at
            WHERE assignment_id = :assignment_id AND user_login = :user_login
            RETURNING grade, assignment_id, user_login, created_at, updated_at;
        """
        try:
            result = await session.execute(
                text(query),
                {
                    "grade": grade_in.grade,
                    "updated_at": datetime.utcnow(),
                    "assignment_id": assignment_id,
                    "user_login": user_login,
                },
            )
            await session.commit()
            row = result.mappings().first()
            if not row:
                raise HTTPException(status_code=404, detail="Grade not found")
            return row
        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating grade: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update grade")


# --- Эндпоинты ---


@router.get("/grades/", response_model=list[GradeGet])
async def get_grades(
    user_login: str = Query(...),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Получить список оценок: все для учителей, свои для учеников.
    """
    try:
        role_id = await UserRepo.get_user_role(session, user_login)
        grades = await GradeRepo.get_grades(
            session=session,
            user_login=user_login if role_id == 1 else None,
            role_id=role_id,
        )
        return [
            {**grade, "assignment_name": grade["assignment_name"] or "Неизвестное задание"}
            for grade in grades
        ]
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_grades: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/grade/")
async def update_grade(
    assignment_id: str = Query(...),
    user_login: str = Query(...),  # Логин студента, чья оценка обновляется
    teacher_login: str = Query(...),  # Логин учителя
    grade_in: GradeUpdate = Body(...),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Обновить оценку (только для учителей).
    """
    try:
        role_id = await UserRepo.get_user_role(session, teacher_login)
        if role_id != 2:
            raise HTTPException(status_code=403, detail="Only teachers are allowed")

        result = await GradeRepo.update_grade(
            session=session,
            assignment_id=assignment_id,
            user_login=user_login,
            grade_in=grade_in,
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in update_grade: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
