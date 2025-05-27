from typing import Any

from pydantic import BaseModel, ConfigDict


class GradeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    grade: int
    assignment_id: str | Any
    user_login: str


class GradeAdd(GradeBase): ...


class GradeGet(BaseModel):
    assignment_id: str | Any
    user_login: str


class GetCreate(GradeBase):
    pass


class GradeGetFull(GradeGet):
    grade: int
    assignment_name: str
    course_id: str | Any


class GradeUpdate(GradeBase):
    pass


class GradeDelete(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    assinment_id: str | Any
    user_login: str
