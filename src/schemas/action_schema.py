from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ActionSchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    action_name: str
    x_value_changed: int
    y_value_changed: int


class ActionGet(BaseModel):
    action_id: int
    action_name: str
    x_value_changed: int
    y_value_changed: int
