from pydantic import BaseModel
from os import getenv

# JWT authorization/authentication library
from authx import AuthXConfig

# time work
from datetime import timedelta


class DBSettings(BaseModel):
    url: str = (
        f"postgresql+asyncpg://{getenv('DB_USER')}:"
        + f"{getenv('DB_PASSWORD')}@{getenv('DB_HOST')}:"
        + f"{getenv('DB_PORT')}/{getenv('DB_NAME')}"
    )
    echo: bool = True


class RoleSettings(BaseModel):
    admin_role_id: int = 2
    teacher_role_id: int = 2
    user_role_id: int = 1


class StatusOfElementsSettings(BaseModel):
    published: int = 1
    draft: int = published  # for first program version


class CredentialsSettings(BaseModel):
    salt: str | None = getenv("SALT")


class ValidationSettings(BaseModel):
    uuid_min_len: int = 32
    uuid_max_len: int = 36

    counting_field_from: int = 1
    min_width: int = 5
    max_width: int = 25
    min_height: int = 5
    max_height: int = 25


class ActionsSettings(BaseModel):
    step_right_id: int = 1
    step_left_id: int = 2
    step_up_id: int = 3
    step_down_id: int = 4
    jump_right_id: int = 5
    jump_left_id: int = 6
    jump_up_id: int = 7
    jump_down_id: int = 8


ROLE_SETTING = RoleSettings()
DB_SETTINGS = DBSettings()

AUTH_CONFIG = AuthXConfig()
AUTH_CONFIG.JWT_SECRET_KEY = getenv("AUTH_SECRET_KEY")
AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME = "AccessToken"
AUTH_CONFIG.JWT_TOKEN_LOCATION = ["cookies"]
AUTH_CONFIG.JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

CREDENTIALS_CONFIG = CredentialsSettings()

STATUS_OF_ELEMENTS_SETTINGS = StatusOfElementsSettings()

VALIDATION_SETTINGS = ValidationSettings()
ACTIONS_SETTINGS = ActionsSettings()
