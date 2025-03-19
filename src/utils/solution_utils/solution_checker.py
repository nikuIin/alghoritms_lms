from schemas.action_schema import ActionGet
from logger.logger_module import ModuleLoger
from pathlib import Path

MIN_FIELD_VALUE = [1, 1]
logger = ModuleLoger(Path(__file__).stem)


def solution_check(
    actions_list: list[ActionGet],
    game_field: tuple[int, int],
    start_position: tuple[int, int],
    end_position: tuple[int, int],
    elements: (int, int),
):
    current_position = list(start_position)
    logger.debug(elements)
    for action in actions_list:
        current_position[0] += action.x_value_changes
        current_position[1] += action.y_value_changes
        # check that ant (player) don't cross the field boundary
        if not MIN_FIELD_VALUE <= current_position <= list(game_field):
            return False
        # check that position doesn't barrier
        if tuple(current_position) in elements:
            # ant can't get through from barrier
            return False
    if current_position == list(end_position):
        # ant get to the final position
        return True
    # and doesn't get to final position after loop
    return False
