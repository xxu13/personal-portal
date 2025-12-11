"""
Logging configuration for the application.
Provides structured logging with file rotation and request tracking.
"""
import logging
import os
import sys
import time
import uuid
from logging.handlers import RotatingFileHandler
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings, BACKEND_DIR


# Create logs directory if it doesn't exist
LOG_DIR = settings.LOG_DIR
os.makedirs(LOG_DIR, exist_ok=True)


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output."""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        # Add color to level name for console output
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.RESET}"
        
        result = super().format(record)
        
        # Reset levelname for other handlers
        record.levelname = levelname
        return result


def setup_logging() -> None:
    """
    Configure logging for the application.
    Sets up console and file handlers with rotation.
    """
    # Get log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Create formatters
    console_formatter = ColoredFormatter(
        fmt=settings.LOG_FORMAT,
        datefmt=settings.LOG_DATE_FORMAT,
    )
    file_formatter = logging.Formatter(
        fmt=settings.LOG_FORMAT,
        datefmt=settings.LOG_DATE_FORMAT,
    )
    access_formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(client_ip)s | %(method)s %(path)s %(status_code)s %(duration).2fms",
        datefmt=settings.LOG_DATE_FORMAT,
    )
    
    # Console handler (with colors)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)
    
    # Main log file handler (rotating)
    app_file_handler = RotatingFileHandler(
        filename=os.path.join(LOG_DIR, "app.log"),
        maxBytes=settings.LOG_MAX_SIZE,
        backupCount=settings.LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    app_file_handler.setFormatter(file_formatter)
    app_file_handler.setLevel(log_level)
    
    # Error log file handler (rotating, ERROR and above only)
    error_file_handler = RotatingFileHandler(
        filename=os.path.join(LOG_DIR, "error.log"),
        maxBytes=settings.LOG_MAX_SIZE,
        backupCount=settings.LOG_BACKUP_COUNT * 2,  # Keep more error logs
        encoding="utf-8",
    )
    error_file_handler.setFormatter(file_formatter)
    error_file_handler.setLevel(logging.ERROR)
    
    # Access log file handler (rotating)
    access_file_handler = RotatingFileHandler(
        filename=os.path.join(LOG_DIR, "access.log"),
        maxBytes=settings.LOG_ACCESS_MAX_SIZE,
        backupCount=settings.LOG_ACCESS_BACKUP_COUNT,
        encoding="utf-8",
    )
    access_file_handler.setFormatter(access_formatter)
    access_file_handler.setLevel(logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()
    
    # Add handlers to root logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(app_file_handler)
    root_logger.addHandler(error_file_handler)
    
    # Configure application logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(log_level)
    app_logger.propagate = True
    
    # Configure access logger (separate)
    access_logger = logging.getLogger("access")
    access_logger.setLevel(logging.INFO)
    access_logger.propagate = False
    access_logger.handlers.clear()
    access_logger.addHandler(console_handler)
    access_logger.addHandler(access_file_handler)
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine.Engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    app_logger.info(f"Logging initialized - Level: {settings.LOG_LEVEL}, Dir: {LOG_DIR}")


def get_logger(name: str = "app") -> logging.Logger:
    """
    Get a logger instance.
    
    Args:
        name: Logger name, will be prefixed with 'app.' if not already
        
    Returns:
        Logger instance
    """
    if not name.startswith("app.") and name != "app" and name != "access":
        name = f"app.{name}"
    return logging.getLogger(name)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log HTTP requests and responses.
    Records client IP, method, path, status code, and duration.
    """
    
    # Paths to exclude from logging
    EXCLUDE_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/favicon.ico"}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip excluded paths
        if request.url.path in self.EXCLUDE_PATHS:
            return await call_next(request)
        
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Record start time
        start_time = time.time()
        
        # Process request
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            # Log error
            logger = get_logger("middleware")
            logger.error(f"[{request_id}] Request failed: {str(e)}")
            raise
        finally:
            # Calculate duration
            duration = (time.time() - start_time) * 1000  # ms
            
            # Log access
            access_logger = logging.getLogger("access")
            
            # Create log record with extra fields
            extra = {
                "client_ip": client_ip,
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "duration": duration,
            }
            
            # Determine log level based on status code
            if status_code >= 500:
                level = logging.ERROR
            elif status_code >= 400:
                level = logging.WARNING
            else:
                level = logging.INFO
            
            access_logger.log(level, "", extra=extra)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response


# Convenience function for logging exceptions
def log_exception(logger: logging.Logger, message: str, exc: Exception) -> None:
    """
    Log an exception with full traceback.
    
    Args:
        logger: Logger instance
        message: Error message
        exc: Exception instance
    """
    logger.exception(f"{message}: {str(exc)}")

