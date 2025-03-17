from exceptions.AssignmentException import (
    AssignmentNotFoundException,
    AssignmentException,
    AssignmentGameFieldException,
    AssignmentPositionError,
    AssignmentElementFieldError,
)
from exceptions.CourseException import CourseNotFoundException
from exceptions.ValidationException import UUIDValidationException
from fastapi import APIRouter, HTTPException, Depends, Request, Body
from typing import List

from repository.assignment_repo import AssignmentRepo
from repository.user_repo import UserRepository
from schemas.action_schema import ActionGet

# schemas of course
from schemas.assignment_schema import (
    AssignmentGet,
    AssignmentCreate,
)

from db.db_helper import db_helper
from schemas.game_element_schema import GameElementGet, GameElementCreate
from schemas.solution_schema import SolutionCreate, SolutionUpdate
from services.assignments_sevices import AssignmentsService

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError


# Auth library
# ----------------------
# import auth settings
from core.config import AUTH_CONFIG

# for auth working
from authx import AuthX

# ----------------------

# logger
from logger.logger_module import ModuleLoger

# path worker
from pathlib import Path

from starlette.responses import Response

from services.user_services import UserService

from repository.solution_repo import SolutionRepo

# utils that check permissions
from utils.user_utils.user_utils import only_teacher


logger = ModuleLoger(Path(__file__).stem)

security = AuthX(config=AUTH_CONFIG)
router = APIRouter(tags=["Solution"])


@router.post("/create_solution/")
async def create_solution(
    solution_in: SolutionCreate,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await SolutionRepo.create(session=session, solution_in=solution_in)


@router.get("/get_solution/{assignment_id}")
async def get_solution(
    assignment_id: str,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Get last solution of assignment by assignment_id.
    :param assignment_id: Assignment id for which is solution looking at
    :param session: Session to connect to DB
    :return: Return solution of assignment looking for
    """

    return await SolutionRepo.get_by_assignment(
        assignment_id=assignment_id, session=session
    )


@router.patch("/update_solution/")
async def update_solution(
    solution_id: str,
    solution_in: SolutionUpdate = Body(...),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Update solution by solution id. Set optionals fields:
        - feedback — teacher answer
        - is_correct — is solution correct on teacher opinion (is solution answer agile)


    :param solution_id: Solution id for update
    :param solution_in: New data of solution
    :param session:
    :return:
    """
    return await SolutionRepo.update_solution(
        solution_id=solution_id,
        solution_in=solution_in,
        session=session,
    )
