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


class CredentialsSettings(BaseModel):
    salt: str = getenv("SALT")


ROLE_SETTING = RoleSettings()
DB_SETTINGS = DBSettings()

AUTH_CONFIG = AuthXConfig()
AUTH_CONFIG.JWT_SECRET_KEY = getenv("AUTH_SECRET_KEY")
AUTH_CONFIG.JWT_ACCESS_COOKIE_NAME = "AccessToken"
AUTH_CONFIG.JWT_TOKEN_LOCATION = ["cookies"]
AUTH_CONFIG.JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

CREDENTIALS_CONFIG = CredentialsSettings()
