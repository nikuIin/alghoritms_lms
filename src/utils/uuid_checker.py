from re import match

from core.config import VALIDATION_SETTINGS


def validate_uuid(uuid_input: str) -> bool:
    """
    Validate is UUID len between 32 and 36 characters.
    Then check is uuid contains only hex symbols.
    :param uuid_input: input uuid
    :return: boolean, is uuid if valid form
    """
    if not (
        VALIDATION_SETTINGS.uuid_min_len
        <= len(uuid_input)
        <= VALIDATION_SETTINGS.uuid_max_len
    ):
        return False

    return match(r"^[0-9a-f-]+$", uuid_input) is not None
