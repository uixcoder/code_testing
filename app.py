from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import logging
from services.compiler import CompilerService
from services.code_runner import CodeRunner
from services.ai_generator import TestGenerator
from config import DEFAULT_TEST_COUNT, MAX_TEST_COUNT, PORT
from utils.response_formatter import format_response

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
compiler_service = CompilerService()
code_runner = CodeRunner()
test_generator = TestGenerator()

@app.route('/')
def index():
    # Pass the configuration values to the template
    return render_template('index.html', 
                          default_test_count=DEFAULT_TEST_COUNT, 
                          max_test_count=MAX_TEST_COUNT)

@app.route('/api/task', methods=['POST'])
def process_task():
    """Process submitted code and run tests"""
    data = request.json
    
    # Validate request data
    if not data or 'submission_code' not in data:
        return jsonify({'error': 'Invalid request data'}), 400
        
    runner = CodeRunner()
    result = runner.run_tests(
        code=data['submission_code'],
        language=data['programming_language'],
        tests=data['tests'],
        max_grade=data['max_grade']
    )
    
    return jsonify(format_response(result))

@app.route('/api/generate-tests', methods=['POST'])
def generate_tests():
    """Generate tests using AI based on task description and code"""
    data = request.json
    
    # Validate request data
    if not data or 'task_description' not in data or 'code' not in data:
        return jsonify({'error': 'Invalid request data'}), 400
        
    generator = TestGenerator()
    tests = generator.generate_tests(
        task_description=data['task_description'],
        code=data['code'],
        language=data['programming_language'],
        count=data.get('test_count', 5)
    )
    
    return jsonify({'tests': tests})

if __name__ == '__main__':
    logger.info(f"Starting application on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=app.config.get('DEBUG', False))