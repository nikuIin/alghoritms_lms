from pydantic import EmailStr, BaseModel, ConfigDict
from typing import Annotated
from annotated_types import MinLen, MaxLen
from core.config import ROLE_SETTING

# datetime library
from datetime import datetime


class UserBase(BaseModel):
    user_login: Annotated[str, MinLen(4), MaxLen(20)]
    email: EmailStr
    phone: Annotated[str, MinLen(10), MaxLen(18)] | None = None
    role_id: int = ROLE_SETTING.user_role_id


class UserMDBase(BaseModel):
    user_login: Annotated[str, MinLen(3), MaxLen(20)]
    first_name: str
    second_name: str
    patronymic: str | None = None
    additional_info: str | None = None
    registration_date: datetime


class UserWithMD(UserBase, UserMDBase):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserWithMD):
    password: Annotated[str, MinLen(8), MaxLen(60)]


class UserLogin(BaseModel):
    user_login: Annotated[str, MinLen(4), MaxLen(20)]
    password: Annotated[str, MinLen(8), MaxLen(60)]
    role_id: int = ROLE_SETTING.user_role_id
