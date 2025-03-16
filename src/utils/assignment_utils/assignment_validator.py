from core.config import VALIDATION_SETTINGS
from exceptions.AssignmentException import AssignmentPositionError
from schemas.assignment_schema import AssignmentCreate

MIN_FIELD_VALUE = VALIDATION_SETTINGS.counting_field_from


def validate_game_field(field_width: int, field_height: int):
    if isinstance(field_width, int) and isinstance(field_height, int):
        return (
            VALIDATION_SETTINGS.min_width
            <= field_width
            <= VALIDATION_SETTINGS.max_width
            and VALIDATION_SETTINGS.min_height
            <= field_height
            <= VALIDATION_SETTINGS.max_height
        )


def position_validator(assignment_in: AssignmentCreate) -> bool:
    if (assignment_in.start_x, assignment_in.start_y) == (
        assignment_in.end_x,
        assignment_in.end_y,
    ):
        raise AssignmentPositionError(
            "Start position can't be the same as end position."
        )
    elif assignment_in.start_x < MIN_FIELD_VALUE:
        raise AssignmentPositionError(
            "Start position x cannot be smaller than field width"
        )
    elif assignment_in.start_x > VALIDATION_SETTINGS.max_width:
        raise AssignmentPositionError(
            "Start position x cannot be larger than field max width"
        )
    elif assignment_in.end_x < MIN_FIELD_VALUE:
        raise AssignmentPositionError(
            "End position x cannot be smaller than field width"
        )
    elif assignment_in.end_x > VALIDATION_SETTINGS.max_width:
        raise AssignmentPositionError(
            "End position x cannot be larger than field max width"
        )

    elif assignment_in.start_y < MIN_FIELD_VALUE:
        raise AssignmentPositionError(
            "Start position y cannot be smaller than field min height"
        )
    elif assignment_in.start_y > VALIDATION_SETTINGS.max_height:
        raise AssignmentPositionError(
            "Start position y cannot be larger than field max height"
        )
    elif assignment_in.end_y < MIN_FIELD_VALUE:
        raise AssignmentPositionError(
            "End position y cannot be smaller than field min height"
        )
    elif assignment_in.end_y > VALIDATION_SETTINGS.max_height:
        raise AssignmentPositionError(
            "End position y cannot be larger than field max height"
        )

    return True
