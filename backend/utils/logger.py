import logging
import sys
import os


def setup_logger(name: str = "AgriAssistant") -> logging.Logger:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # Avoid adding duplicate handlers

    logger.setLevel(log_level)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    return logger


logger = setup_logger()
