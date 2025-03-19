from pydantic import BaseModel
from typing import Any


class GradeJournalBase(BaseModel):
    grade_id: int
    assignment_id: str | Any
    user_login: str


class GradeJournalGet(GradeJournalBase):
    pass


class GradeJournalCreate(GradeJournalBase):
    pass


class GradeJournalUpdate(GradeJournalBase):
    pass


class GradeJournalDelete(GradeJournalBase):
    pass
