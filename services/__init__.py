"""
Services module for the Code Testing Platform.
Contains code execution, compilation, and AI test generation services.
"""

# Import key services for easier access at package level
from .code_runner import CodeRunner
from .compiler import CompilerService
from .ai_generator import TestGenerator

__all__ = ['CodeRunner', 'CompilerService', 'TestGenerator']