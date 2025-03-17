from core.config import ACTIONS_SETTINGS
from models.assignment_element_model import Action
from schemas.assignment_schema import AssignmentGet
from schemas.game_element_schema import GameElementGet
from schemas.solution_schema import SolutionGet

MIN_FIELD_VALUE = [1, 1]


def solution_check(
    actions_list: list[Action],
    game_field: tuple[int, int],
    start_position: tuple[int, int],
    end_position: tuple[int, int],
    elements: (int, int),
):
    current_position = list(start_position)

    for action in actions_list:
        current_position[0] += action.x_value_changes
        current_position[1] += action.y_value_changes

        # check that ant (player) don't cross the field boundary
        if not MIN_FIELD_VALUE <= current_position <= list(game_field):
            return False

        # check that position doesn't barrier
        if current_position in elements:
            # ant can't get through from barrier
            return False

    if current_position == list(end_position):
        # ant get to the final position
        return True

    # and doesn't get to final position after loop
    return False
