# package for work with data of users in db
from repository.user_repo import UserRepository

from schemas.user_schema import UserWithMD, UserCreate, UserBase
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

# lib for working with paths
from pathlib import Path

# regular expressions
from re import sub

# logger module
from logger.logger_module import ModuleLoger

from utils.user_utils.hash import hash_password

# initialize logger for user services
# __file__ -> path to file
# method stem get name of file from path without type of file

logger = ModuleLoger(Path(__file__).stem)


class UserService:
    @staticmethod
    async def get_users(
        session: AsyncSession,
        user_role=None,
    ) -> list[UserWithMD] | None:
        return await UserRepository.get_users(session, role=user_role)

    @staticmethod
    async def get_user_by_login(
        session: AsyncSession,
        user_login: str,
    ) -> UserWithMD | None:
        return await UserRepository.get_user_by_login(session, user_login)

    @staticmethod
    def phone_convertor(phone: str | None) -> str | None:
        logger.debug("%s phone in" % phone)
        if not phone:
            return None
        phone = sub(r"[^0-9]", "", phone.lstrip("+"))

        if len(phone) == 11 and phone[0] == "8":
            phone = "7" + phone[1:]
        elif len(phone) == 10:
            phone = "7" + phone
        elif len(phone) != 11 or phone[0] != "7":
            return None

        logger.debug("%s phone convert" % phone)
        return phone

    @staticmethod
    async def get_user_by_phone(
        session: AsyncSession,
        phone: str,
    ) -> UserWithMD | None:
        converted_phone = UserService.phone_convertor(phone)

        if converted_phone:
            return await UserRepository.get_user_by_phone(session, converted_phone)
        else:
            return None
            # raise HTTPException(
            #     status_code=422,
            #     detail="Invalid phone number format. "
            #     "Must be a valid 10 or 11 digit number "
            #     "(after removing non-numeric characters).",
            # )

    @staticmethod
    async def get_user_by_email(
        session: AsyncSession,
        email: str,
    ) -> UserWithMD | None:
        return await UserRepository.get_user_by_email(session, email)

    @staticmethod
    async def validate_user_data(session: AsyncSession, user_in: UserWithMD):
        logger.info("%s user validate" % (user_in,))
        if await UserRepository.is_user_exists(session, login=user_in.user_login):
            raise HTTPException(
                status_code=409,
                detail=f"User with login {user_in.user_login} already exists",
            )
        if await UserRepository.is_user_exists(session, email=user_in.email):
            raise HTTPException(
                status_code=409,
                detail=f"User with email {user_in.email} already exists",
            )
        if user_in.phone and await UserRepository.is_user_exists(session, phone=user_in.phone):
            raise HTTPException(
                status_code=409,
                detail=f"User with phone {user_in.phone} already exists",
            )

    @staticmethod
    async def create_user(session: AsyncSession, user_in: UserCreate) -> UserWithMD | None:
        # convert user phone in the right format (only digits)
        user_in.phone = UserService.phone_convertor(user_in.phone)
        user_in.password = hash_password(user_in.password)
        logger.info("Start creating user: %s" % user_in)
        await UserService.validate_user_data(session, user_in)
        return await UserRepository.create_user(session, user_in)

    @staticmethod
    async def get_user_credentials(session: AsyncSession, user_login: str) -> UserCreate | None:
        credentials = await UserRepository.get_user_credentials(session, user_login)
        return credentials

    @staticmethod
    async def get_base_user_info_by_login(
        session: AsyncSession, user_login: str
    ) -> UserBase | None:
        user = await UserRepository.get_user_by_login(session, user_login)
        return user
