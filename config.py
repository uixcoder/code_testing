import os

# Flask settings
PORT = int(os.environ.get('PORT', 5000))

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, 'temp')
os.makedirs(TEMP_DIR, exist_ok=True)

# Execution limits
EXECUTION_TIMEOUT = 10  # seconds
MAX_MEMORY_MB = 128
MAX_CPU_LIMIT = 1.0
MAX_OUTPUT_SIZE = 10 * 1024 * 1024  # 10KB

# Code execution security
SANDBOX_USER = 'coderunner'  # Non-privileged user for container execution

# Default test settings
DEFAULT_TEST_COUNT = 3
MAX_TEST_COUNT = 30

# AI settings
GOOGLE_GEMINI_API_KEY = os.environ.get('GOOGLE_GEMINI_API_KEY', '')
GEMINI_MODEL = 'gemini-2.0-flash-lite'

# AI PROMPT
AI_PROMPT = """
You are a programming test generator. Create {count} test cases for the following programming task.

Task Description:
{task_description}

Solution Code ({language}):
{code}

Your test cases should:
1. Cover various input scenarios
2. Include edge cases
3. Test different code paths
4. Have varying difficulty (easy to hard)

It's IMPORTANT that you create EXACTLY {count} test cases, no more and no less.

Return the test cases as a valid JSON array with the following structure for each test:
{{
  "input": "test input",
  "output": "expected output",
  "explanation": "explanation of what this test is checking",
  "difficulty": difficulty level (1-5, where 1 is easiest and 5 is hardest)
}}

The input and output should exactly match what the program would receive as stdin and produce as stdout.
Return ONLY the JSON array, with no additional text or formatting.
Make sure your JSON is properly formatted and valid.
"""