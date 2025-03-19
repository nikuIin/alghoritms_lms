from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ActionSchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    action_name: str
    x_value_changes: int
    y_value_changes: int


class ActionGet(ActionSchemaBase):
    action_id: int
