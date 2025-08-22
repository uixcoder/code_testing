"""
Response formatting utilities
Standardizes API responses for consistency
"""

from typing import Dict, Any


def format_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format the API response to ensure consistency
    
    Args:
        data: Raw response data
        
    Returns:
        Formatted response data
    """
    # Ensure all required fields are present
    result = {
        'success': True,
        'build_status': data.get('build_status', 'error'),
        'build_message': data.get('build_message', ''),
        'tests': data.get('tests', {'count': 0}),
        'grade': data.get('grade', 0)
    }
    
    # Add any additional fields that might be present
    for key, value in data.items():
        if key not in result:
            result[key] = value
    
    return result


def format_error(error_message: str, status_code: int = 400) -> Dict[str, Any]:
    """
    Format an error response
    
    Args:
        error_message: Error message
        status_code: HTTP status code
        
    Returns:
        Formatted error response
    """
    return {
        'success': False,
        'error': error_message,
        'status_code': status_code
    }


def format_test_results(test_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format test results to ensure consistency
    
    Args:
        test_results: Raw test results
        
    Returns:
        Formatted test results
    """
    formatted_tests = {
        'count': test_results.get('count', 0)
    }
    
    for key, test in test_results.items():
        if key != 'count' and isinstance(test, dict):
            formatted_tests[key] = {
                'id': test.get('id', int(key)),
                'status': test.get('status', 'error'),
                'value': test.get('value', 0),
                'input': test.get('input', ''),
                'output': test.get('output', ''),
                'run_output': test.get('run_output', ''),
                'explanation': test.get('explanation', '')
            }
    
    return formatted_tests