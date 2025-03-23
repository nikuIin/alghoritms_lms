# http code statuses
import asyncio
from timeit import timeit

from fastapi import HTTPException

# module for work with db in asyncio mod
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.user_schema import UserWithMD, UserCreate, UserBase
from sqlalchemy.exc import SQLAlchemyError

# datetime worker
from datetime import datetime

# Typing library
from pydantic import EmailStr

# Logger module
from logger.logger_module import ModuleLoger

# SQL queries
from repository.sql_queries.user_queries import (
    GET_USERS_LOGINS,
    SELECT_ALL_USERS_INFO,
    SELECT_TEACHERS,
    SELECT_ADMINS,
    SELECT_USERS,
    GET_BASE_USER_INFO_BY_LOGIN,
    GET_USER_BY_LOGIN,
    GET_USER_BY_EMAIL,
    GET_USER_BY_PHONE,
    GET_USER_CREDENTIALS,
    INSERT_USER,
    INSERT_MD_USER,
)

# configuration file
from core.config import ROLE_SETTING

# lib for working with path
from pathlib import Path

# initialize logger for user repo
# __file__ -> path to file
# method stem get name of file from path without type of file
logger = ModuleLoger(Path(__file__).stem)


def create_user_list(data) -> list[UserWithMD]:
    return [UserWithMD(**element) for element in data]


def create_user_list2(data) -> list[UserWithMD]:
    user_list = []
    for element in data:
        user_list.append(UserWithMD(**element))

    return user_list


class UserRepository:

    @staticmethod
    async def is_user_exists(
        session: AsyncSession,
        login: str | None = None,
        email: EmailStr | None = None,
        phone: str | None = None,
    ) -> bool:
        if not any([login, email, phone]):
            raise HTTPException(
                status_code=422,
                detail="You must provide login, email or phone",
            )

        try:
            async with session:
                if login:
                    result = await session.execute(
                        GET_USER_BY_LOGIN, {"user_login": login}
                    )
                elif email:
                    result = await session.execute(
                        GET_USER_BY_EMAIL, {"user_email": email}
                    )
                else:
                    result = await session.execute(
                        GET_USER_BY_PHONE, {"user_phone": phone}
                    )

                if result.mappings().fetchone():
                    logger.info(
                        "User found by %s (%s)"
                        % ([login, email, phone], result.mappings().fetchone())
                    )
                    return True
                else:
                    logger.info(
                        "User not found (%s)" % result.mappings().fetchone()
                    )
                    return False

        except SQLAlchemyError as e:
            logger.error("SQLAlchemyError: %s" % e)
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    async def get_users_logins(
        session: AsyncSession,
    ) -> list[str]:

        async with session:
            result = await session.execute(GET_USERS_LOGINS)

        return [row.user_login for row in result.mappings().fetchall()]

    @staticmethod
    async def get_base_info_by_login(
        session: AsyncSession, user_login: str
    ) -> UserBase | None:
        try:
            async with session:
                result = await session.execute(
                    GET_BASE_USER_INFO_BY_LOGIN, {"user_login": user_login}
                )
                user = result.mappings()
                if user:
                    return user
                return None

        except SQLAlchemyError as e:
            logger.error("SQLAlchemyError: %s" % e)
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    async def get_users(
        session: AsyncSession, role=None
    ) -> list[UserWithMD] | None:
        """Get users by roles. Join table user and md_user by login"""
        if role == ROLE_SETTING.teacher_role_id:
            select_query = SELECT_TEACHERS
        elif role == ROLE_SETTING.admin_role_id:
            select_query = SELECT_ADMINS
        elif role == ROLE_SETTING.user_role_id:
            select_query = SELECT_USERS
        else:
            select_query = SELECT_ALL_USERS_INFO
        try:
            async with session:
                result = await session.execute(select_query)
                logger.info(type(result))
                users = [UserWithMD(**row) for row in result.mappings()]
                logger.debug("Get list of users: %s" % users)

                if users:
                    return users
                return None
        except SQLAlchemyError as e:
            logger.error("SQLAlchemyError: %s" % e)
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    async def get_user_by_login(
        session: AsyncSession,
        user_login: str,
    ) -> UserWithMD | None:
        """Get user by login"""
        async with session:
            result = await session.execute(
                GET_USER_BY_LOGIN, {"user_login": user_login}
            )
            result = result.mappings().fetchone()
            user_md = UserWithMD(**result) if result else None
            return user_md

    @staticmethod
    async def get_user_by_email(
        session: AsyncSession,
        user_email: str,
    ) -> UserWithMD | None:
        """Get user by login"""
        try:
            async with session:
                result = await session.execute(
                    GET_USER_BY_EMAIL, {"user_email": user_email}
                )
                result = result.mappings().fetchone()
                user_md = UserWithMD(**result) if result else None
                return user_md
        except SQLAlchemyError as e:
            # TODO: log exception
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    async def get_user_by_phone(
        session: AsyncSession,
        user_phone: str,
    ) -> UserWithMD | None:
        """Get user by login"""
        try:
            async with session:
                result = await session.execute(
                    GET_USER_BY_PHONE, {"user_phone": user_phone}
                )
                result = result.mappings().fetchone()
                user_md = UserWithMD(**result) if result else None
                return user_md
        except SQLAlchemyError as e:
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    async def create_user(
        session: AsyncSession, user_in: UserCreate
    ) -> UserWithMD | None:
        """Add user to database (in tables user and md_user)"""
        try:
            async with session:
                await session.execute(
                    INSERT_USER,
                    {
                        "user_login": user_in.user_login,
                        "email": user_in.email,
                        "phone": user_in.phone,
                        "password": user_in.password,
                        "role_id": user_in.role_id,
                    },
                )
                await session.execute(
                    INSERT_MD_USER,
                    {
                        "user_login": user_in.user_login,
                        "first_name": user_in.first_name,
                        "second_name": user_in.second_name,
                        "patronymic": user_in.patronymic,
                        "additional_info": user_in.additional_info,
                    },
                )
                user_md = UserWithMD(
                    user_login=user_in.user_login,
                    first_name=user_in.first_name,
                    second_name=user_in.second_name,
                    patronymic=user_in.patronymic,
                    additional_info=user_in.additional_info,
                    role_id=user_in.role_id,
                    email=user_in.email,
                    phone=user_in.phone,
                    registration_date=datetime.now(),
                )
                await session.commit()
                return user_md

        except SQLAlchemyError as e:
            logger.error(e)
            await session.rollback()
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    async def get_user_credentials(
        session: AsyncSession, user_login: str
    ) -> UserCreate | None:
        try:
            async with session:
                result = await session.execute(
                    GET_USER_CREDENTIALS, {"user_login": user_login}
                )
                credentials = result.mappings().fetchone()
                return credentials if credentials else None
        except SQLAlchemyError as e:
            logger.error(e)
            raise HTTPException(status_code=500, detail="Database error")
