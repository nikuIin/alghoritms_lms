# package for work with data of users in db
import sqlalchemy
from exceptions.AssignmentException import (
    AssignmentNotFoundException,
    AssignmentException,
    AssignmentGameFieldException,
)
from exceptions.CourseException import CourseNotFoundException

from exceptions.ValidationException import UUIDValidationException
from repository.assignment_repo import AssignmentRepo
from asyncpg.exceptions import ForeignKeyViolationError, DataError
from sqlalchemy.exc import IntegrityError, DatabaseError

from schemas.assignment_schema import (
    AssignmentGet,
    AssignmentCreate,
    AssignmentDelete,
    AssignmentUpdate,
)
from schemas.game_element_schema import GameElementGet, GameElementCreate
from services.course_services import CourseServices
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from typing import List

# lib for working with paths
from pathlib import Path

# logger module
from logger.logger_module import ModuleLoger
from utils.assignment_utils.assignment_validator import (
    validate_game_field,
    position_validator,
)

from utils.uuid_checker import validate_uuid

logger = ModuleLoger(Path(__file__).stem)


class AssignmentsService:

    @staticmethod
    async def get_course_assignments(
        course_uuid: str, session: AsyncSession
    ) -> List[AssignmentGet]:
        if not validate_uuid(course_uuid):
            raise UUIDValidationException()
        return await AssignmentRepo.get_course_assignments(
            course_uuid=course_uuid, session=session
        )

    @staticmethod
    async def create_assignment(
        assignment_in: AssignmentCreate, session: AsyncSession
    ) -> AssignmentGet | None:
        """
        TODO
        :param assignment_in:
        :param session:
        :return:
        """
        if not validate_uuid(assignment_in.course_id):
            raise UUIDValidationException()

        # game field validation
        if not validate_game_field(
            assignment_in.field_width, assignment_in.field_height
        ):
            raise AssignmentGameFieldException(
                "Field width or height violate standards."
            )

        if not position_validator(assignment_in):
            logger.warning(
                "Position is invalid. Check position_validator, it's works incorrectly."
            )
            raise AssignmentException("Position is invalid.")

        logger.info(
            "Start checking course assignment %s" % assignment_in.course_id
        )
        if not await CourseServices.is_course_exists(
            assignment_in.course_id, session
        ):
            raise CourseNotFoundException()

        try:
            return await AssignmentRepo.create_assignment(
                assignment_in=assignment_in, session=session
            )
        except ForeignKeyViolationError as e:
            logger.error(e)
            raise AssignmentNotFoundException()
        except IntegrityError as e:
            logger.error(e)
            raise AssignmentNotFoundException()
        except DataError as e:
            logger.error(e)
            raise UUIDValidationException()

    @staticmethod
    async def delete_assignment(
        assignment_uuid: str, session: AsyncSession
    ) -> AssignmentDelete:
        if not validate_uuid(assignment_uuid):
            raise UUIDValidationException()
        try:
            return await AssignmentRepo.delete_assignment(
                assignment_id=assignment_uuid, session=session
            )
        except ForeignKeyViolationError as e:
            logger.error(e)
            raise AssignmentNotFoundException()
        except IntegrityError as e:
            logger.error(e)
            raise AssignmentNotFoundException()
        except DataError as e:
            logger.error(e)
            raise UUIDValidationException()
        except DatabaseError:
            raise AssignmentException()

    @staticmethod
    async def update_assignment(
        assignment_uuid: str, session: AsyncSession
    ): ...

    @staticmethod
    async def total_info_about_assignment(
        assignment_uuid: str,
        session: AsyncSession,
    ) -> tuple[AssignmentGet, tuple[GameElementGet, ...] | None]:
        if not validate_uuid(assignment_uuid):
            raise UUIDValidationException()
        try:
            return await AssignmentRepo.total_info_about_assignment(
                assignment_uuid=assignment_uuid, session=session
            )
        except IntegrityError as e:
            logger.error(e)
            raise AssignmentNotFoundException()
        except DataError as e:
            logger.error(e)
            raise UUIDValidationException()
        except DatabaseError:
            raise AssignmentException()

    @staticmethod
    async def add_elements(
        element_list: list[GameElementCreate, ...],
        session: AsyncSession,
    ) -> tuple[AssignmentGet, tuple[GameElementGet, ...] | None]:
        return await AssignmentRepo.add_elements(
            element_list=element_list, session=session
        )
