from core.config import CREDENTIALS_CONFIG
from subprocess import getoutput

from logger.logger_module import ModuleLoger
from pathlib import Path

logger = ModuleLoger(Path(__file__).stem)


def hash_password(password: str) -> str:
    password = password + CREDENTIALS_CONFIG.salt
    password = getoutput(f'echo "{password}" | sha3-256sum')[:-3]
    logger.info(f"hash password: {password}")
    return password
