from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

#
# configuration objects
from core.config import STATUS_OF_ELEMENTS_SETTINGS


class AssignmentBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    course_id: str | Any
    name: str
    assignment_type_id: int = 1  # TODO take value from config
    status_id: int = STATUS_OF_ELEMENTS_SETTINGS.draft


class AssignmentCreate(AssignmentBase):
    field_width: int
    field_height: int
    start_x: int
    start_y: int
    end_x: int
    end_y: int
    description: str | None = None


class AssignmentGet(AssignmentBase):
    assignment_id: Any | str


class AssignmentUpdate(AssignmentGet): ...


class AssignmentDelete(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    assignment_id: Any | str
