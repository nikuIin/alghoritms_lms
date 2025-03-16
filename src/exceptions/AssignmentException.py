class AssignmentException(Exception):
    pass


class AssignmentNotFoundException(AssignmentException):
    pass


class AssignmentGameFieldException(AssignmentException):
    pass


class AssignmentPositionError(AssignmentException):
    pass


class AssignmentElementFieldError(AssignmentException):
    pass
