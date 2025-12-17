"""
Centralized error handling for API
"""

import logging
from typing import Optional
from datetime import datetime
from fastapi import HTTPException, status
from utils.response_models import ErrorResponse

logger = logging.getLogger(__name__)

class QuantAPIError(Exception):
    """Base exception for Quant API"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ModuleError(QuantAPIError):
    """Error from quant module"""
    pass

class ConfigurationError(QuantAPIError):
    """Configuration error"""
    pass

def handle_exception(error: Exception, module_name: Optional[str] = None) -> HTTPException:
    """
    Handle exceptions and convert to HTTPException
    
    Args:
        error: The exception to handle
        module_name: Name of the module that raised the error
        
    Returns:
        HTTPException with appropriate status code and message
    """
    error_msg = str(error)
    module_context = f" [{module_name}]" if module_name else ""
    
    # Log the error
    logger.error(f"Error{module_context}: {error_msg}", exc_info=True)
    
    # Determine status code
    if isinstance(error, QuantAPIError):
        status_code = error.status_code
    elif isinstance(error, ValueError):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(error, KeyError):
        status_code = status.HTTP_404_NOT_FOUND
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    # Create error message
    if module_name:
        message = f"Error in {module_name}: {error_msg}"
    else:
        message = f"Internal server error: {error_msg}"
    
    return HTTPException(
        status_code=status_code,
        detail={
            "error": error.__class__.__name__,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

def create_error_response(error: Exception, module_name: Optional[str] = None) -> ErrorResponse:
    """
    Create standardized error response
    
    Args:
        error: The exception
        module_name: Name of the module
        
    Returns:
        ErrorResponse model
    """
    return ErrorResponse(
        error=error.__class__.__name__,
        message=str(error),
        timestamp=datetime.utcnow().isoformat() + "Z",
        details={"module": module_name} if module_name else None
    )

