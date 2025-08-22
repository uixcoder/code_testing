# Code Testing Platform - Setup Guide

This guide will help you set up and run the Code Testing Platform application.

## Prerequisites

- Python 3.8 or higher
- Docker installed and running
- Git (for cloning the repository)

## 1. Set Up Python Environment

```bash
# Navigate to the repo directory
cd code_testing

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Linux/Mac
# or
# .venv\Scripts\activate  # On Windows

# Install required packages
pip install -r requirements.txt
```

## 2. Configure Environment Variables

Create a `.env` file in the Refactored directory:

```bash
# Create .env file with your API key
echo "GOOGLE_GEMINI_API_KEY=your_api_key_here" > .env
echo "FLASK_DEBUG=True" >> .env
echo "DEBUG=True" >> .env
```

> **Note:** You'll need a valid Google Gemini API key for AI-powered test generation.

## 3. Build Docker Images

Build all necessary Docker images for code compilation and execution:

```bash
# Build C compiler image
cd docker/c_compiler
docker build -t c-compiler:latest .

# Build C++ compiler image
cd ../cpp_compiler
docker build -t cpp-compiler:latest .

# Build Python compiler image
cd ../python_compiler
docker build -t python-compiler:latest .

# Build Java compiler image
cd ../java_compiler
docker build -t java-compiler:latest .

# Return to project root
cd ../..
```

## 4. Create Temporary Directory

Ensure the temp directory exists for storing compiled files:

```bash
mkdir -p temp
chmod 755 temp
```

## 5. Run the Application

Start the Flask application:

```bash
python app.py
```

The application will be available at http://localhost:5000 (or the port specified in your config.py)

## Features

- **Multi-language Support**: Write and test code in C, C++, Python, and Java
- **AI-powered Test Generation**: Automatically generate test cases based on task description and solution code
- **Test Execution**: Run code against test cases and get detailed results
- **Test Weighting**: Assign weights to tests based on difficulty for accurate grading
- **Resource Limits**: All code executes with memory, CPU and time constraints for security

## Configuration Options

You can adjust the following parameters in `config.py`:

- `PORT`: Application port (default: 5000)
- `EXECUTION_TIMEOUT`: Maximum execution time for code (seconds)
- `MAX_MEMORY_MB`: Memory limit for code execution
- `MAX_CPU_LIMIT`: CPU limit for containers
- `MAX_OUTPUT_SIZE`: Maximum output size in bytes
- `SANDBOX_USER`: Non-privileged user for execution
- `DEFAULT_TEST_COUNT`: Default number of tests to generate
- `MAX_TEST_COUNT`: Maximum allowed number of tests

## Troubleshooting

If you encounter permission issues:

- Make sure Docker is running
- Verify that your user has permissions to run Docker commands
- Check that the temp directory has appropriate permissions (755)
- Ensure the API key is correctly set in the .env file

For compilation errors, check the Docker images and make sure all dependencies are installed.
