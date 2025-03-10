from loguru import logger

LOGS_ROTATION = "0:00"
LOGS_RETENTION = "2 month"
LOGS_COMPRESSION = "zip"
LOGS_LEVEL = "ERROR"
LOGS_FORMAT = "{time} {level} {message}"

LOGGER_SENSITIVE_WORDS = [
    # "api",
    # "key",
    # "card",
    # "password",
    # "token",
    # "secret",
    # "ssn",  # Social Security Number
    # "credit",
    # "bank",
    # "address",
    # "email",
    # "phone",
    # "dob",  # Date of Birth
    # "pin",
    # "identity",
    # "medical",
    # "insurance",
    # "confidential",
    # "private",
    # "proposal",
    # "document",
    # "location",
    # "gps",
    # "activity",
    # "race",
    # "ethnicity",
    # "gender",
    # "religion",
    # "politics",
]


def logger_filter(message) -> bool:
    message_lower = message["message"].lower()
    return not any(
        keyword in message_lower for keyword in LOGGER_SENSITIVE_WORDS
    )


class ModuleLoger:
    rotation = LOGS_ROTATION
    retention = LOGS_RETENTION
    compress = LOGS_COMPRESSION
    level = LOGS_LEVEL
    format = LOGS_FORMAT

    def __init__(self, model_name: str):
        self.__model_name = model_name
        self.__logger = logger.bind(model=model_name)
        self.setup_logger()

    def setup_logger(self):
        self.__logger.add(
            f"logs/{self.__model_name}.log",
            rotation=ModuleLoger.rotation,
            retention=ModuleLoger.retention,
            compression=ModuleLoger.compress,
            level=ModuleLoger.level,
            format=ModuleLoger.format,
            filter=logger_filter,
        )

    def debug(self, *args, **kwargs):
        self.__logger.debug(*args, **kwargs)

    def info(self, *args, **kwargs):
        self.__logger.info(*args, **kwargs)

    def warning(self, *args, **kwargs):
        self.__logger.warning(*args, **kwargs)

    def error(self, *args, **kwargs):
        self.__logger.error(*args, **kwargs)
