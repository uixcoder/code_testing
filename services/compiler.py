"""
Compiler Service
Handles compilation of source code in various programming languages.
"""

import os
import subprocess
import uuid
import logging
from pathlib import Path
from config import EXECUTION_TIMEOUT, MAX_MEMORY_MB, MAX_CPU_LIMIT

logger = logging.getLogger(__name__)

class CompilerService:
    """Service for compiling source code in various programming languages"""
    
    def __init__(self, temp_dir="temp"):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(exist_ok=True)
        # Set proper permissions on the temp directory
        try:
            os.chmod(self.temp_dir, 0o755)
        except Exception as e:
            logger.warning(f"Failed to set temp directory permissions: {e}")
    
    def compile_code(self, code, language):
        """
        Compile code in the specified language
        
        Args:
            code (str): Source code to compile
            language (str): Programming language (c, cpp, python, java)
            
        Returns:
            tuple: (success, executable_path, message)
        """
        if language == "python":
            return self._handle_python(code)
        elif language == "c":
            return self._compile_c(code)
        elif language == "cpp":
            return self._compile_cpp(code)
        elif language == "java":
            return self._compile_java(code)
        else:
            logger.error(f"Unsupported language: {language}")
            return False, None, "Unsupported programming language"
    
    def _handle_python(self, code):
        """Save Python code to a file (no compilation needed)"""
        try:
            # Create a source file with unique ID
            source_file = self._create_source_file(code, ".py")
            
            # No compilation needed for Python
            return True, source_file, "Python script saved successfully"
            
        except Exception as e:
            logger.error(f"Error handling Python code: {str(e)}")
            return False, None, f"Error handling Python code: {str(e)}"
    
    def _compile_c(self, code):
        """Compile C code using Docker"""
        try:
            # Create a source file
            source_file = self._create_source_file(code, ".c")
            source_path = os.path.abspath(source_file)
            
            # Define output executable name
            executable = source_path.replace(".c", "")
            
            # Define relative paths for Docker volumes
            source_dir = os.path.dirname(source_path)
            source_name = os.path.basename(source_path)
            executable_name = os.path.basename(executable)
            
            # Create Docker command with resource limits
            cmd = [
                "docker", "run", "--rm",
                "--memory", f"{MAX_MEMORY_MB}m",  # Memory limit
                "--cpus", f"{MAX_CPU_LIMIT}",     # CPU limit
                "--network", "none",              # Disable network access for security
                "-v", f"{source_dir}:/src:rw",
                "-u", "root",  # Run as root to bypass permission issues
                "c-compiler:latest",
                "bash", "-c", f"gcc -o /src/{executable_name} /src/{source_name} && chmod 755 /src/{executable_name}"
            ]
            
            logger.debug(f"Running command: {' '.join(cmd)}")
            
            # Run the command with timeout
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=EXECUTION_TIMEOUT  # Use timeout from config
            )
            
            # Check for errors
            stderr = result.stderr.decode('utf-8').strip()
            if result.returncode != 0:
                logger.error(f"C compilation failed: {stderr}")
                return False, None, f"Compilation error: {stderr}"
            
            # Make sure the executable is created
            if os.path.exists(executable):
                return True, executable, "Compilation successful"
            else:
                logger.error(f"Executable not found after compilation: {executable}")
                return False, None, "Executable not found after compilation"
        
        except subprocess.TimeoutExpired:
            logger.error("C compilation timed out")
            return False, None, f"Compilation timed out after {EXECUTION_TIMEOUT} seconds"
        except Exception as e:
            logger.error(f"Error compiling C code: {str(e)}")
            return False, None, f"Error compiling C code: {str(e)}"
    
    def _compile_cpp(self, code):
        """Compile C++ code using Docker"""
        try:
            # Create a source file
            source_file = self._create_source_file(code, ".cpp")
            source_path = os.path.abspath(source_file)
            
            # Define output executable name
            executable = source_path.replace(".cpp", "")
            
            # Define relative paths for Docker volumes
            source_dir = os.path.dirname(source_path)
            source_name = os.path.basename(source_path)
            executable_name = os.path.basename(executable)
            
            # Create Docker command with resource limits
            cmd = [
                "docker", "run", "--rm",
                "--memory", f"{MAX_MEMORY_MB}m",  # Memory limit
                "--cpus", f"{MAX_CPU_LIMIT}",     # CPU limit
                "--network", "none",              # Disable network access for security
                "-v", f"{source_dir}:/src:rw",
                "-u", "root",  # Run as root to bypass permission issues
                "cpp-compiler:latest",
                "bash", "-c", f"g++ -o /src/{executable_name} /src/{source_name} && chmod 755 /src/{executable_name}"
            ]
            
            logger.debug(f"Running command: {' '.join(cmd)}")
            
            # Run the command with timeout
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=EXECUTION_TIMEOUT  # Use timeout from config
            )
            
            # Check for errors
            stderr = result.stderr.decode('utf-8').strip()
            if result.returncode != 0:
                logger.error(f"C++ compilation failed: {stderr}")
                return False, None, f"Compilation error: {stderr}"
            
            # Make sure the executable is created
            if os.path.exists(executable):
                return True, executable, "Compilation successful"
            else:
                logger.error(f"Executable not found after compilation: {executable}")
                return False, None, "Executable not found after compilation"
        
        except subprocess.TimeoutExpired:
            logger.error("C++ compilation timed out")
            return False, None, f"Compilation timed out after {EXECUTION_TIMEOUT} seconds"
        except Exception as e:
            logger.error(f"Error compiling C++ code: {str(e)}")
            return False, None, f"Error compiling C++ code: {str(e)}"
    
    def _compile_java(self, code):
        """Compile Java code using Docker"""
        try:
            # Create source file (must be named Solution.java for Java)
            source_file = self._create_source_file(code, ".java", "Solution")
            source_dir = os.path.dirname(os.path.abspath(source_file))
            
            # Create Docker command with resource limits
            cmd = [
                "docker", "run", "--rm",
                "--memory", f"{MAX_MEMORY_MB}m",  # Memory limit
                "--cpus", f"{MAX_CPU_LIMIT}",     # CPU limit
                "--network", "none",              # Disable network access for security
                "-v", f"{source_dir}:/src:rw",
                "-u", "root",  # Run as root to bypass permission issues
                "java-compiler:latest",
                "bash", "-c", "cd /src && javac Solution.java && chmod 755 /src/*.class"
            ]
            
            logger.debug(f"Running command: {' '.join(cmd)}")
            
            # Run the command with timeout
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=EXECUTION_TIMEOUT  # Use timeout from config
            )
            
            # Check for errors
            stderr = result.stderr.decode('utf-8').strip()
            if result.returncode != 0:
                logger.error(f"Java compilation failed: {stderr}")
                return False, None, f"Compilation error: {stderr}"
            
            # Check if class file exists
            class_file = os.path.join(source_dir, "Solution.class")
            if os.path.exists(class_file):
                # For Java, return the directory containing the class file
                return True, source_dir, "Compilation successful"
            else:
                logger.error(f"Class file not found after compilation: {class_file}")
                return False, None, "Class file not found after compilation"
        
        except subprocess.TimeoutExpired:
            logger.error("Java compilation timed out")
            return False, None, f"Compilation timed out after {EXECUTION_TIMEOUT} seconds"
        except Exception as e:
            logger.error(f"Error compiling Java code: {str(e)}")
            return False, None, f"Error compiling Java code: {str(e)}"
    
    def _create_source_file(self, code, extension, filename=None):
        """
        Create a source file with the given code
        
        Args:
            code (str): Source code to write
            extension (str): File extension (e.g. '.c', '.cpp', '.py')
            filename (str, optional): Base filename (without extension)
            
        Returns:
            str: Path to the created file
        """
        # Generate unique filename if not provided
        if filename is None:
            filename = f"solution_{uuid.uuid4().hex.lower()}"
            
        # Create file
        file_path = os.path.join(self.temp_dir, filename + extension)
        
        with open(file_path, 'w') as f:
            f.write(code)
            
        # Set file permissions to be readable by everyone (important for Docker)
        try:
            os.chmod(file_path, 0o644)
            logger.debug(f"Set permissions on {file_path} to 0644")
        except Exception as e:
            logger.warning(f"Failed to set file permissions: {e}")
            
        return file_path