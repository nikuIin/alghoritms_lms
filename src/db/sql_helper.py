from sqlalchemy import text
from logger.logger_module import ModuleLoger
from pathlib import Path

logger = ModuleLoger(Path(__file__).stem)


def insert_helper(query: text, insert_values: list | tuple) -> text:
    for insert_value in insert_values:
        query += (
            '('
            + ', '.join([str(element) for element in insert_value])
            + '),\n'
        )

    # delete last comma and \n
    query = query[:-2]
    logger.info(f"Inserting {query}")
    return query
