from loguru import logger

LOGS_ROTATION = "0:00"
LOGS_RETENTION = "2 month"
LOGS_COMPRESSION = "zip"
LOGS_LEVEL = "DEBUG"
LOGS_FORMAT = "{time} {level} {message}"


LOGGER_SENSITIVE_WORDS = [
    "api",
    "key",
    "card",
    "password",
    "token",
    "secret",
    "ssn",  # Social Security Number
    "credit",
    "bank",
    "address",
    "email",
    "phone",
    "dob",  # Date of Birth
    "pin",
    "identity",
    "medical",
    "insurance",
    "confidential",
    "private",
    "proposal",
    "document",
    "location",
    "gps",
    "activity",
    "race",
    "ethnicity",
    "gender",
    "religion",
    "politics",
]


class ModuleLoger:
    def __init__(self, model_name: str):
        self.__model_name = model_name
        self.__logger = logger.bind(model=model_name)
        self.setup_logger()
        self.__logger.info(f"Loger of {model_name} model successfully created")

    def setup_logger(self):
        self.__logger.add(
            f"logs/{self.__model_name}.log",
            rotation=LOGS_ROTATION,
            retention=LOGS_RETENTION,
            compression=LOGS_COMPRESSION,
            level=LOGS_LEVEL,
            format=LOGS_FORMAT,
            filter=self.__logger_filter,
        )
        self.__logger.info(
            f"Loger of {self.__model_name} is succesfully configurated!"
        )

    def __logger_filter(self, message) -> bool:
        message_lower = message["message"].lower()
        return not any(
            keyword in message_lower for keyword in LOGGER_SENSITIVE_WORDS
        )

    def debug(self, message: str):
        self.__logger.debug(message)

    def info(self, message: str):
        self.__logger.info(message)

    def warning(self, message: str):
        self.__logger.warning(message)

    def error(self, message: str):
        self.__logger.error(message)
