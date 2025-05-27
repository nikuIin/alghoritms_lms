from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.db_helper import db_helper
from logger.logger_module import ModuleLoger

# Логгер
logger = ModuleLoger(Path(__file__).stem)

# Инициализация роутера
router = APIRouter(tags=["User"])

# --- Схемы Pydantic ---


class UserGet(BaseModel):
    user_login: str
    email: str | None
    phone: str | None
    role_id: int = Field(ge=1, le=2)
    first_name: str | None
    second_name: str | None
    patronymic: str | None
    additional_info: str | None
    registration_date: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    email: EmailStr | None
    phone: str | None
    role_id: int = Field(ge=1, le=2)
    first_name: str | None
    second_name: str | None
    patronymic: str | None
    additional_info: str | None


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

    @staticmethod
    async def get_users(session: AsyncSession) -> list[dict]:
        """
        Получить список всех пользователей с данными из user и md_user.
        """
        query = """
            SELECT
                u.user_login, u.email, u.phone, u.role_id,
                m.first_name, m.second_name, m.patronymic, m.additional_info,
                m.registration_date, m.updated_at
            FROM "user" u
            LEFT JOIN md_user m ON u.user_login = m.user_login
            ORDER BY m.updated_at DESC;
        """
        try:
            result = await session.execute(text(query))
            return result.mappings().all()
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch users")

    @staticmethod
    async def update_user(session: AsyncSession, user_login: str, user_in: UserUpdate):
        """
        Обновить данные пользователя в user и md_user.
        """
        try:
            # Обновление таблицы user
            user_query = """
                UPDATE "user"
                SET email = :email, phone = :phone, role_id = :role_id
                WHERE user_login = :user_login
                RETURNING user_login, email, phone, role_id;
            """
            user_result = await session.execute(
                text(user_query),
                {
                    "user_login": user_login,
                    "email": user_in.email,
                    "phone": user_in.phone,
                    "role_id": user_in.role_id,
                },
            )
            user_row = user_result.mappings().first()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")

            # Обновление таблицы md_user
            md_query = """
                UPDATE md_user
                SET
                    first_name = :first_name,
                    second_name = :second_name,
                    patronymic = :patronymic,
                    additional_info = :additional_info,
                    updated_at = :updated_at
                WHERE user_login = :user_login
                RETURNING user_login, first_name, second_name, patronymic, additional_info, registration_date, updated_at;
            """
            md_result = await session.execute(
                text(md_query),
                {
                    "user_login": user_login,
                    "first_name": user_in.first_name,
                    "second_name": user_in.second_name,
                    "patronymic": user_in.patronymic,
                    "additional_info": user_in.additional_info,
                    "updated_at": datetime.utcnow(),
                },
            )
            md_row = md_result.mappings().first()
            if not md_row:
                raise HTTPException(status_code=404, detail="User metadata not found")

            await session.commit()
            return {
                **user_row,
                **md_row,
            }
        except HTTPException:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating user: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update user")


# --- Эндпоинты ---


@router.get("/users/", response_model=list[UserGet])
async def get_users(
    teacher_login: str = Query(...),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Получить список всех пользователей (только для учителей).
    """
    try:
        role_id = await UserRepo.get_user_role(session, teacher_login)
        if role_id != 2:
            raise HTTPException(status_code=403, detail="Only teachers are allowed")

        users = await UserRepo.get_users(session)
        return users
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/user/")
async def update_user(
    user_login: str = Query(...),  # Логин редактируемого пользователя
    teacher_login: str = Query(...),  # Логин учителя
    user_in: UserUpdate = Body(...),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Обновить данные пользователя (только для учителей).
    """
    try:
        role_id = await UserRepo.get_user_role(session, teacher_login)
        if role_id != 2:
            raise HTTPException(status_code=403, detail="Only teachers are allowed")

        result = await UserRepo.update_user(
            session=session,
            user_login=user_login,
            user_in=user_in,
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in update_user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user")
