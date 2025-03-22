from pydantic import EmailStr, BaseModel, ConfigDict
from core.config import ROLE_SETTING

# datetime library
from datetime import datetime


class UserBase(BaseModel):
    user_login: str
    email: EmailStr
    phone: str | None
    role_id: int = ROLE_SETTING.user_role_id


class UserMDBase(BaseModel):
    user_login: str
    first_name: str
    second_name: str
    patronymic: str | None = None
    additional_info: str | None = None
    registration_date: datetime


class UserWithMD(UserBase, UserMDBase):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserWithMD):
    password: str


class UserLoginOnly(BaseModel):
    user_login: str


class UserLogin(BaseModel):
    user_login: str
    password: str
    role_id: int = ROLE_SETTING.user_role_id
