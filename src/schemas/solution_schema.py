from pydantic import EmailStr, BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class SolutionBase(BaseModel):
    solution_status_id: int = 1


class SolutionGet(BaseModel):
    assignment_id: str | Any
    user_login: str
    answer: list[int]
    solution_id: str | Any
    feedback: str | None = None
    is_correct: bool | None = None


class SolutionCreate(SolutionBase):
    answer: list[int]
    assignment_id: str | Any
    user_login: str


class SolutionUpdate(SolutionBase):
    check_at: datetime = datetime.now()
    is_correct: bool | None = None
    feedback: str | None = None
