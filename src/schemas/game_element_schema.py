"""
Schema of game elements, e.g. pit or wall
"""

from pydantic import BaseModel, ConfigDict
from typing import Any


class GameElementBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    element_id: int


class GameElementGet(GameElementBase):
    name: str
    element_type_id: int = 1
    pos_x: int
    pos_y: int


class GameElementCreate(GameElementGet):
    assignment_id: Any | str


class GameElementUpdate(GameElementGet):
    pass


class GameElementDelete(GameElementBase):
    pass
