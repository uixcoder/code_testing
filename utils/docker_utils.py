"""
Docker utilities
Helper functions for Docker operations
"""

import docker
import os
import tempfile
import hashlib
from datetime import datetime
import uuid
from typing import Dict, Any, Tuple, Optional, List

class DockerManager:
    """Class for managing Docker operations"""
    
    def __init__(self, config=None):
        """
        Initialize Docker manager with configuration
        
        Args:
            config: Configuration dictionary with Docker settings
        """
        self.config = config or {}
        self.client = docker.from_env()
        
        # Default resource limits if not specified in config
        self.default_limits = {
            'memory': self.config.get('DOCKER_MEMORY_LIMIT', '256m'),
            'cpu_count': float(self.config.get('DOCKER_CPU_LIMIT', 1.0)),
            'timeout': int(self.config.get('DOCKER_TIMEOUT', 30))
        }
        
        # Image settings from config or defaults
        self.images = self.config.get('DOCKER_IMAGES', {
            'c': 'gcc:latest',
            'cpp': 'gcc:latest',
            'python': 'python:3.9-slim',
            'java': 'openjdk:11'
        })
    
    def ensure_image_exists(self, image_name: str) -> None:
        """
        Ensure that a Docker image exists, pulling it if necessary
        
        Args:
            image_name: Name of the Docker image
        """
        try:
            self.client.images.get(image_name)
        except docker.errors.ImageNotFound:
            print(f"Pulling Docker image: {image_name}")
            self.client.images.pull(image_name)
    
    def run_container(self, image_name: str, command: str, volume_map: Dict[str, Dict], 
                     working_dir: str, timeout: Optional[int] = None) -> Tuple[int, str, str]:
        """
        Run a command in a Docker container
        
        Args:
            image_name: Docker image name
            command: Command to run
            volume_map: Volume mappings
            working_dir: Working directory inside container
            timeout: Timeout in seconds
            
        Returns:
            Tuple of (exit_code, stdout, stderr)
        """
        # Ensure image exists
        self.ensure_image_exists(image_name)
        
        # Use default timeout if not specified
        if timeout is None:
            timeout = self.default_limits['timeout']
        
        # Run container
        try:
            container = self.client.containers.run(
                image_name,
                command=command,
                volumes=volume_map,
                working_dir=working_dir,
                mem_limit=self.default_limits['memory'],
                nano_cpus=int(self.default_limits['cpu_count'] * 1e9),
                user=self.config.get('SANDBOX_USER', ''),  # Run as non-privileged user if specified
                detach=True
            )
            
            try:
                # Wait for result with timeout
                result = container.wait(timeout=timeout)
                exit_code = result['StatusCode']
                
                stdout = container.logs(stdout=True, stderr=False).decode('utf-8')
                stderr = container.logs(stdout=False, stderr=True).decode('utf-8')
                
                return exit_code, stdout, stderr
                
            finally:
                # Always remove container
                try:
                    container.remove(force=True)
                except:
                    pass
                    
        except docker.errors.APIError as e:
            return -1, '', f"Docker API error: {str(e)}"
        except Exception as e:
            return -1, '', f"Error running container: {str(e)}"
    
    def get_image_for_language(self, language: str) -> str:
        """
        Get the appropriate Docker image for a language
        
        Args:
            language: Programming language
            
        Returns:
            Docker image name
        """
        return self.images.get(language, self.images.get('c', 'gcc:latest'))


def generate_unique_dir(task_id: int = None) -> str:
    """
    Generate unique directory name for temporary files
    
    Args:
        task_id: Optional task ID to include in the directory name
    
    Returns:
        Path to unique directory
    """
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    
    if task_id is None:
        task_id = uuid.uuid4().hex[:8]
        
    random_hash = hashlib.md5(f"{task_id}-{timestamp}".encode()).hexdigest()[:8]
    base_dir = os.path.join(os.getcwd(), 'temp')
    
    # Ensure base directory exists
    os.makedirs(base_dir, exist_ok=True)
    
    # Create unique subdirectory
    unique_dir = os.path.join(base_dir, f"task-{task_id}-{timestamp}-{random_hash}")
    os.makedirs(unique_dir, exist_ok=True)
    
    return unique_dir


def cleanup_dir(directory: str) -> bool:
    """
    Clean up a temporary directory
    
    Args:
        directory: Directory to remove
    
    Returns:
        True if successful, False otherwise
    """
    try:
        import shutil
        if os.path.exists(directory):
            shutil.rmtree(directory)
        return True
    except Exception as e:
        print(f"Error cleaning up directory {directory}: {str(e)}")
        return False