from typing import Any

from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone

# configuration objects
from core.config import STATUS_OF_ELEMENTS_SETTINGS

# Schemas of courses. In courses will be assignments
# (in second version of program will be modules/lesson/assignments).


class CourseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    course_id: Any
    name: str


class CourseGet(CourseBase):
    owner: str
    status_id: int = STATUS_OF_ELEMENTS_SETTINGS.draft
    description: str | None = None


class CourseCreate(CourseGet):
    created_at: datetime = datetime.now(tz=timezone.utc)
    updated_at: datetime = datetime.now(tz=timezone.utc)
