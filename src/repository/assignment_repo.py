# module for work with db in asyncio mod
import uuid
from typing import Any, Coroutine

from sqlalchemy.ext.asyncio import AsyncSession

from exceptions.AssignmentException import AssignmentElementFieldError
from models.assignment_element_model import (
    AssignmentElement,
    AssignmentAction,
)
from schemas.action_schema import ActionGet
from schemas.assignment_schema import (
    AssignmentCreate,
    AssignmentGet,
    AssignmentDelete,
)

from asyncpg.exceptions import RaiseError

from sqlalchemy.exc import SQLAlchemyError, DatabaseError

# Logger module
from logger.logger_module import ModuleLoger

# SQL queries
import repository.sql_queries.assignments_queries as assignments_queries

# configuration file
from core.config import STATUS_OF_ELEMENTS_SETTINGS

# lib for working with path
from pathlib import Path

from schemas.game_element_schema import GameElementGet, GameElementCreate

# initialize logger for user repo
# __file__ -> path to file
# method stem get name of file from path without type of file

logger = ModuleLoger(Path(__file__).stem)

INSERT_ELEMENT_PATTER = "(:element_id, :assignment_id, :pos_x, :pos_y)"


class AssignmentRepo:

    @staticmethod
    async def is_assignment_exists(
        assignment_uuid: str,
        session: AsyncSession,
    ):
        async with session:
            result = await session.execute(
                assignments_queries.IS_ASSIGNMENT_EXISTS,
                params={"assignment_uuid": assignment_uuid},
            )
        return result.fetchone()

    @staticmethod
    async def get_course_assignments(
        course_uuid: str,
        session: AsyncSession,
    ) -> list[AssignmentGet] | None:
        async with session:
            result = await session.execute(
                assignments_queries.GET_COURSE_ASSIGNMENTS,
                params={"course_uuid": course_uuid},
            )
        assignments = [AssignmentGet(**row) for row in result.mappings()]
        return assignments

    @staticmethod
    async def create_assignment(
        assignment_in: AssignmentCreate,
        session: AsyncSession,
    ) -> AssignmentGet | None:
        """
        Create (or update on uuid-conflict) an assignment.

        :param assignment_in: Assignment data to create.
        :param session: Async session to database.
        """

        async with session:
            try:
                result = await session.execute(
                    assignments_queries.CREATE_ASSIGNMENT,
                    params=assignment_in.model_dump(),
                )
                assignment_uuid = (
                    result.mappings().fetchone().get("assignment_id")
                )
                logger.info(f"Created assignment {assignment_uuid}")
                await session.execute(
                    assignments_queries.CREATE_GAME_ASSIGNMENT,
                    params={
                        "assignment_id": assignment_uuid,
                        "field_width": assignment_in.field_width,
                        "field_height": assignment_in.field_height,
                        "start_x": assignment_in.start_x,
                        "start_y": assignment_in.start_y,
                        "end_x": assignment_in.end_x,
                        "end_y": assignment_in.end_y,
                    },
                )
                await session.commit()
            except SQLAlchemyError as e:
                logger.error(e)
                await session.rollback()
                raise DatabaseError()

        assignment = AssignmentGet(
            assignment_id=assignment_uuid,
            course_id=assignment_in.course_id,
            assignment_type_id=assignment_in.assignment_type_id,
            name=assignment_in.name,
            status_id=assignment_in.status_id,
            field_width=assignment_in.field_width,
            field_height=assignment_in.field_height,
            start_x=assignment_in.start_x,
            start_y=assignment_in.start_y,
            end_x=assignment_in.end_x,
            end_y=assignment_in.end_y,
        )

        return assignment

    @staticmethod
    async def update_assignment(
        assignment_in: AssignmentCreate,
        session: AsyncSession,
    ) -> AssignmentGet | None:
        """
        Create an assignment.

        :param assignment_in: Assignment data to create.
        :param session: Async session to database.
        """

        # TODO what are you sinking about update history?
        async with session:
            result = await session.execute(
                assignments_queries.CREATE_ASSIGNMENT,
                params=assignment_in.model_dump(),
            )
            await session.commit()

        result = result.fetchone()
        logger.info("The assignment was created. Params: %s" % result)

        assignment = AssignmentGet(
            course_id=result.course_id,
            assignment_id=result.assignment_id,
            name=result.name,
            assignment_type_id=result.assignment_type_id,
            status_id=result.status_id,
        )
        return assignment

    @staticmethod
    async def delete_assignment(
        assignment_id: str,
        session: AsyncSession,
    ):
        """
        Delete an assignment.

        :param assignment_id: id of the assignment to delete.
        :param session: async session to database.
        :return:
        """

        async with session:
            await session.execute(
                assignments_queries.SAFE_DELETE_ASSIGNMENT,
                params={"assignment_id": assignment_id},
            )
            await session.commit()

        return AssignmentDelete(assignment_id=assignment_id)

    @staticmethod
    async def total_info_about_assignment(
        assignment_uuid: str,
        session: AsyncSession,
    ) -> tuple[AssignmentGet, tuple[GameElementGet, ...] | None] | None:
        """
        Return total information about an assignment, including elements in the
        table in JSON format.
        :return:
        """
        async with session:
            result = await session.execute(
                assignments_queries.GET_TOTAL_INFO_ABOUT_ASSIGNMENT,
                params={"assignment_id": assignment_uuid},
            )
        data = result.mappings().fetchone()

        if data:
            logger.info("Get data: %s" % data)
            assigment = AssignmentGet(
                assignment_id=data["assignment_id"],
                course_id=data["course_id"],
                assignment_type_id=data["assignment_type_id"],
                name=data["name"],
                status_id=data["status_id"],
                field_width=data["field_width"],
                field_height=data["field_height"],
                start_x=data["start_x"],
                start_y=data["start_y"],
                end_x=data["end_x"],
                end_y=data["end_y"],
            )
            elements = None
            if data["elements"] != [None]:
                elements = [GameElementGet(**row) for row in data["elements"]]
            logger.info(
                "Get game elements of %s: %s" % (assignment_uuid, elements)
            )
            logger.info(
                "Available actions of assignment %s: %s"
                % (assignment_uuid, elements)
            )
            if assigment:
                return assigment, elements
        else:
            logger.info(
                "Request to not exists assignment with id %s" % assignment_uuid
            )
        return None

    @staticmethod
    async def add_elements(
        element_list: list[GameElementCreate, ...],
        session: AsyncSession,
    ) -> list[AssignmentElement]:
        try:
            assignment_elements = [
                AssignmentElement(
                    assignment_id=element.assignment_id,
                    element_id=element.element_id,
                    pos_x=element.pos_x,
                    pos_y=element.pos_y,
                )
                for element in element_list
            ]
            logger.info(assignment_elements)
            async with session:
                session.add(assignment_elements[0])
                # session.add_all(assignment_elements)
                await session.commit()
            logger.info(
                "Elements successfully added: %s" % assignment_elements
            )
            return assignment_elements
        except SQLAlchemyError as e:
            logger.info("Conflict with creating assigment elements: %s " % e)
            await session.rollback()
            raise AssignmentElementFieldError()

    @staticmethod
    async def get_assignment_actions(
        action_uuid: str,
        session: AsyncSession,
    ):
        async with session:
            result = await session.execute(
                assignments_queries.GET_ASSIGNMENT_ACTIONS,
                params={
                    "assignment_id": action_uuid,
                },
            )

        actions = result.mappings().fetchall()
        return actions

    @staticmethod
    async def add_actions(
        actions_id: list[int, any],
        assignment_uuid: str,
        session: AsyncSession,
    ):
        actions_assignment = [
            AssignmentAction(
                assignment_id=assignment_uuid, action_id=action_id
            )
            for action_id in actions_id
        ]
        try:
            async with session:
                session.add_all(actions_assignment)
                await session.commit()
        except SQLAlchemyError as e:
            logger.error(e)
            await session.rollback()

        logger.info(
            "Actions to assignment %s successfully added: %s"
            % (assignment_uuid, actions_assignment)
        )
