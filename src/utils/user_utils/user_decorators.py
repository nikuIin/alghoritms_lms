# library for work with authorisation by jwt
from authx.exceptions import JWTDecodeError

from typing import Callable

# for saving metadata of functions
from functools import wraps

from fastapi import HTTPException, Request

# logger module
from logger.logger_module import ModuleLoger

# Path worker
from pathlib import Path

logger = ModuleLoger(Path(__file__).stem)
