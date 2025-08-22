"""
Code Runner Service
Handles execution of code in Docker containers for different programming languages.
"""

import os
import subprocess
import tempfile
from pathlib import Path
import logging
from .compiler import CompilerService
from config import EXECUTION_TIMEOUT, MAX_MEMORY_MB, MAX_CPU_LIMIT, MAX_OUTPUT_SIZE, SANDBOX_USER

logger = logging.getLogger(__name__)

class CodeRunner:
    """Runs compiled code with provided input and captures output."""
    
    def __init__(self, temp_dir="temp"):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(exist_ok=True)
        self.compiler = CompilerService(temp_dir)
    
    def run_tests(self, code, language, tests, max_grade=10):
        """
        Compile and run code against all tests
        
        Args:
            code: Source code to test
            language: Programming language
            tests: Dictionary with test specifications
            max_grade: Maximum possible grade
            
        Returns:
            dict: Results including build status, test results and grade
        """
        logger.debug(f"Running tests for {language} code")
        
        # Create result structure
        result = {
            'build_status': 'failed',
            'build_message': '',
            'tests': tests.copy(),
            'grade': 0
        }
        
        # Compile the code
        success, executable_path, message = self.compiler.compile_code(code, language)
        result['build_status'] = 'success' if success else 'failed'
        result['build_message'] = message
        
        # If compilation failed, return early
        if not success:
            logger.error(f"Compilation failed: {message}")
            return result
        
        # Run each test
        total_grade = 0
        
        for i in range(1, tests['count'] + 1):
            test_id = str(i)
            if test_id not in tests:
                logger.warning(f"Test {test_id} not found in tests dictionary")
                continue
            
            test = tests[test_id]
            
            # Get test input/output
            test_input = test.get('input', '')
            expected_output = test.get('output', '')
            test_weight = test.get('value', 0)
            
            # Log test execution
            logger.debug(f"Running test {test_id} with input: '{test_input}', expecting: '{expected_output}'")
            
            # Use the timeout from config
            success, actual_output, error = self.run_code(executable_path, language, test_input, timeout=EXECUTION_TIMEOUT)
            
            # Update test results
            result['tests'][test_id]['run_output'] = actual_output
            result['tests'][test_id]['status'] = 'success' if success and actual_output.strip() == expected_output.strip() else 'failed'
            
            # Add error message if any
            if error:
                result['tests'][test_id]['error'] = error
            
            # Add to grade if test passed
            test_passed = result['tests'][test_id]['status'] == 'success'
            if test_passed:
                test_score = (test_weight * max_grade) / 100
                total_grade += test_score
                logger.debug(f"Test {test_id} passed. Score: {test_score} points")
            else:
                logger.debug(f"Test {test_id} failed. Expected '{expected_output}', got '{actual_output}'")
        
        # Set final grade
        result['grade'] = round(total_grade, 2)
        logger.info(f"Final grade: {result['grade']} out of {max_grade}")
        
        return result
    
    def run_code(self, executable_path, language, input_data, timeout=None):
        """
        Run compiled code with the given input using the language-specific container.
        
        Args:
            executable_path: Path to the compiled executable or code file
            language: Programming language (c, cpp, python, java)
            input_data: Input data to provide to the program
            timeout: Maximum execution time in seconds
            
        Returns:
            tuple: (success, output, error_message)
        """
        # Use the timeout from config if not provided
        if timeout is None:
            timeout = EXECUTION_TIMEOUT
            
        try:
            # Create a temporary file for input
            input_file = self._create_input_file(input_data)
            
            # Get absolute paths
            executable_path = os.path.abspath(executable_path)
            input_file = os.path.abspath(input_file)
            
            # Make sure the input file is readable by everyone
            try:
                os.chmod(input_file, 0o644)
            except Exception as e:
                logger.warning(f"Failed to set input file permissions: {e}")
            
            # Configure container and command based on language
            if language == "c":
                container_name = "c-compiler:latest"
                exec_name = os.path.basename(executable_path)
                exec_dir = os.path.dirname(executable_path)
                run_cmd = f"bash -c 'cat /input/{os.path.basename(input_file)} | /exec/{exec_name}'"
            elif language == "cpp":
                container_name = "cpp-compiler:latest"
                exec_name = os.path.basename(executable_path)
                exec_dir = os.path.dirname(executable_path)
                run_cmd = f"bash -c 'cat /input/{os.path.basename(input_file)} | /exec/{exec_name}'"
            elif language == "python":
                container_name = "python-compiler:latest"
                exec_name = os.path.basename(executable_path)
                exec_dir = os.path.dirname(executable_path)
                run_cmd = f"bash -c 'python3 /exec/{exec_name} < /input/{os.path.basename(input_file)}'"
            elif language == "java":
                container_name = "java-compiler:latest"
                exec_dir = executable_path
                run_cmd = f"bash -c 'cd /exec && cat /input/{os.path.basename(input_file)} | java Solution'"
            else:
                logger.error(f"Unsupported language: {language}")
                return False, "", f"Unsupported language: {language}"
            
            # Create Docker command with resource limits and sandbox user
            cmd = [
                "docker", "run", "--rm",
                "--memory", f"{MAX_MEMORY_MB}m",  # Memory limit
                "--cpus", f"{MAX_CPU_LIMIT}",     # CPU limit
                "--network", "none",              # Disable network access for security
                "-u", SANDBOX_USER,               # Use the sandbox user from config
                "-v", f"{exec_dir}:/exec:ro",
                "-v", f"{os.path.dirname(input_file)}:/input:ro",
                container_name,
                "bash", "-c", run_cmd
            ]
            
            logger.debug(f"Running command: {' '.join(cmd)}")
            
            # Run the command with timeout
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout
            )
            
            # Get output with size limit
            stdout = result.stdout.decode('utf-8', errors='replace')
            stderr = result.stderr.decode('utf-8', errors='replace')
            
            # Limit output size
            if len(stdout) > MAX_OUTPUT_SIZE:
                stdout = stdout[:MAX_OUTPUT_SIZE] + "\n...(output truncated due to size limit)"
            
            logger.debug(f"STDOUT: {stdout[:200]}{'...' if len(stdout) > 200 else ''}")
            if stderr:
                logger.debug(f"STDERR: {stderr[:200]}{'...' if len(stderr) > 200 else ''}")
            
            if result.returncode != 0:
                logger.error(f"Execution failed with return code {result.returncode}")
                if stderr:
                    logger.error(f"STDERR: {stderr}")
                return False, stdout, f"Execution error: {stderr}"
            
            # Clean up
            try:
                os.unlink(input_file)
            except Exception as e:
                logger.warning(f"Failed to remove input file: {e}")
            
            return True, stdout, None
        
        except subprocess.TimeoutExpired:
            logger.error(f"Execution timed out after {timeout} seconds")
            return False, "", f"Execution timed out after {timeout} seconds"
        except Exception as e:
            logger.error(f"Error running code: {str(e)}")
            return False, "", f"Error running code: {str(e)}"
    
    def _create_input_file(self, input_data):
        """Create a temporary file with the input data."""
        fd, path = tempfile.mkstemp(dir=self.temp_dir)
        with os.fdopen(fd, 'w') as f:
            f.write(input_data)
        return path