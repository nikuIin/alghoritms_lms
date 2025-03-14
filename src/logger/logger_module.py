from loguru import logger
from pathlib import Path

LOGS_ROTATION = "0:00"
LOGS_RETENTION = "2 month"
LOGS_COMPRESSION = "zip"
LOGS_LEVEL = "DEBUG"
LOGS_FORMAT = "{time} {level} {message}"

LOGGER_SENSITIVE_WORDS = [
    # ... (список чувствительных слов)
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

    def __init__(self, model_name):
        # Используйте уникальное имя файла журнала для каждого объекта ModuleLoger
        self.__model_name = model_name
        unique_filename = f"logs/{model_name}.log"
        self.__logger = logger.bind(object_type=model_name)
        self.setup_logger(unique_filename)

    def setup_logger(self, filename):
        """Set up the logger with a sink that filters by module name and sensitive words."""

        def combined_filter(record):
            # Only allow logs where the 'model' matches this module and no sensitive words
            return (
                record["extra"]["object_type"] == self.__model_name
            ) and logger_filter(record)

        self.__logger.add(
            filename,
            rotation=self.rotation,
            retention=self.retention,
            compression=self.compress,
            level=self.level,
            format=self.format,
            filter=combined_filter,
        )

    def debug(self, *args, **kwargs):
        self.__logger.debug(*args, **kwargs)

    def info(self, *args, **kwargs):
        self.__logger.info(*args, **kwargs)

    def warning(self, *args, **kwargs):
        self.__logger.warning(*args, **kwargs)

    def error(self, *args, **kwargs):
        self.__logger.error(*args, **kwargs)
