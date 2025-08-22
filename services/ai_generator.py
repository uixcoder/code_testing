"""
AI Test Generator Service
Uses Google's Generative AI to generate test cases for programming tasks.
"""

import os
import json
import google.generativeai as genai
import logging
from typing import Dict, List, Any
from config import GEMINI_MODEL, GOOGLE_GEMINI_API_KEY, MAX_TEST_COUNT, AI_PROMPT

logger = logging.getLogger(__name__)

class TestGenerator:
    """Generates test cases using Google's Generative AI based on task description and code"""
    
    def __init__(self):
        """Initialize the test generator with API key from config"""
        self.api_key = GOOGLE_GEMINI_API_KEY
        self.model = GEMINI_MODEL
        genai.configure(api_key=self.api_key)
        self.generation_config = {
            "temperature": 0.2,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
        }
    
    def generate_tests(self, task_description, code, language="c", count=5):
        """
        Generate test cases for a given programming task and solution.
        
        Args:
            task_description (str): Description of the programming task
            code (str): Solution code
            language (str): Programming language
            count (int): Number of tests to generate
            
        Returns:
            dict: Dictionary of generated tests
        """
        try:
            # Limit count to a reasonable range
            count = min(max(1, count), MAX_TEST_COUNT)
            
            # Create prompt for test generation
            prompt = self._create_prompt(task_description, code, language, count)
            
            # Get AI model
            model = genai.GenerativeModel(self.model, generation_config=self.generation_config)
            
            # Generate response
            response = model.generate_content(prompt)
            
            # Log the raw response for debugging
            logger.debug(f"Raw AI response: {response.text}")
            
            # Parse the response to get test cases
            tests = self._parse_response(response.text, count)
            
            # Ensure we always have exactly the requested number of tests
            if tests["count"] < count:
                logger.info(f"AI returned {tests['count']} tests, but {count} were requested. Adding missing tests.")
                tests = self._ensure_test_count(tests, count)
                
            return tests
        
        except Exception as e:
            logger.error(f"Error generating tests: {str(e)}")
            # Return fallback tests when AI generation fails
            return self._generate_fallback_tests(count)
    
    def _create_prompt(self, task_description, code, language, count):
        """Create prompt for the AI model"""
        return AI_PROMPT.format(
            count=count,
            task_description=task_description,
            language=language,
            code=code
        )
    
    def _parse_response(self, response_text, count):
        """Parse AI response into structured test cases"""
        try:
            # Try to extract JSON from the response text
            # First attempt: look for JSON array
            json_text = response_text.strip()
            
            # Look for JSON array beginning/end if surrounded by other text
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']')
            
            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                json_text = response_text[start_idx:end_idx+1]
            
            # Log the extracted JSON for debugging
            logger.debug(f"Extracted JSON text: {json_text[:200]}...")
            
            try:
                # Parse the JSON array
                test_cases = json.loads(json_text)
                
                # Create result structure
                result = {"count": min(len(test_cases), count)}
                
                # Calculate weight distribution - improved for exact distribution
                test_count = result["count"]
                weights = self._calculate_balanced_weights(test_count)
                
                # Add each test to the result
                for i, test in enumerate(test_cases[:count], 1):
                    # Ensure all required fields exist
                    result[str(i)] = {
                        "id": i,
                        "value": weights[i-1],  # Use pre-calculated weight
                        "input": test.get("input", ""),
                        "output": test.get("output", ""),
                        "explanation": test.get("explanation", ""),
                        "difficulty": test.get("difficulty", 3)
                    }
                
                return result
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON: {str(e)}")
                # Try a more forgiving approach - find each test case individually
                return self._extract_tests_manually(response_text, count)
                
        except Exception as e:
            logger.error(f"Error processing AI response: {str(e)}")
            logger.error(f"Response text: {response_text[:200]}...")
            return self._generate_fallback_tests(count)
        
    def _calculate_balanced_weights(self, count):
        """
        Calculate balanced weights that sum exactly to 100
        This ensures even initial distribution without rounding errors
        """
        if count == 0:
            return []
            
        # Start with basic calculation
        base_weight = 100 // count
        remainder = 100 % count
        
        # Create initial weights array
        weights = [base_weight for _ in range(count)]
        
        # Distribute remainder evenly
        for i in range(remainder):
            weights[i] += 1
        
        # Verify that weights sum to 100
        assert sum(weights) == 100, f"Weights {weights} sum to {sum(weights)}, not 100"
        
        return weights
    
    def _ensure_test_count(self, tests, requested_count):
        """
        Ensure the tests dictionary contains exactly the requested number of tests
        by duplicating existing tests or creating new ones if necessary.
        """
        current_count = tests["count"]
        
        # If we already have the right number, no need to do anything
        if current_count >= requested_count:
            return tests
        
        # Calculate how many more tests we need
        missing_count = requested_count - current_count
        logger.info(f"Need to add {missing_count} more tests")
        
        # Calculate new balanced weights for all tests
        new_weights = self._calculate_balanced_weights(requested_count)
        
        # Update weights of existing tests
        for i in range(1, current_count + 1):
            tests[str(i)]["value"] = new_weights[i-1]
        
        # Add new tests by duplicating or modifying existing ones
        existing_inputs = [tests[str(i)]["input"] for i in range(1, current_count + 1)]
        
        for i in range(current_count + 1, requested_count + 1):
            # Base the new test on an existing one if possible
            base_test_idx = (i - current_count - 1) % current_count + 1
            base_test = tests[str(base_test_idx)]
            
            # Create a slightly modified version
            input_text = base_test["input"]
            output_text = base_test["output"]
            
            # Make sure input is different from all existing inputs
            if input_text in existing_inputs:
                input_text = f"{input_text}\n# Modified version {i}"
            
            existing_inputs.append(input_text)
            
            # Add the new test with the pre-calculated weight
            tests[str(i)] = {
                "id": i,
                "value": new_weights[i-1],
                "input": input_text,
                "output": output_text,
                "explanation": f"Additional test based on test {base_test_idx}",
                "difficulty": base_test["difficulty"]
            }
        
        # Update the count
        tests["count"] = requested_count
        
        return tests
    
    def _extract_tests_manually(self, text, count):
        """Attempt to extract test cases manually when JSON parsing fails"""
        try:
            # Look for patterns that might indicate test cases
            import re
            
            # Create result structure with fallback tests
            result = {"count": count}
            
            # Try to find JSON objects in the text
            pattern = r'\{\s*"input"\s*:\s*"([^"]*)"\s*,\s*"output"\s*:\s*"([^"]*)"\s*,\s*"explanation"\s*:\s*"([^"]*)"\s*,\s*"difficulty"\s*:\s*(\d+)\s*\}'
            matches = re.findall(pattern, text)
            
            if matches:
                # Calculate weights
                test_count = min(len(matches), count)
                result["count"] = test_count
                base_weight = 100 // test_count
                remainder = 100 % test_count
                
                # Add each found test
                for i, (input_text, output, explanation, difficulty) in enumerate(matches[:count], 1):
                    extra = 1 if i <= remainder else 0
                    result[str(i)] = {
                        "id": i,
                        "value": base_weight + extra,
                        "input": input_text,
                        "output": output,
                        "explanation": explanation,
                        "difficulty": int(difficulty) if difficulty.isdigit() else 3
                    }
                
                return result
            else:
                # If no pattern matches, return fallback tests
                return self._generate_fallback_tests(count)
                
        except Exception as e:
            logger.error(f"Error in manual extraction: {str(e)}")
            return self._generate_fallback_tests(count)
    
    def _generate_fallback_tests(self, count):
        """Generate fallback tests when AI generation fails"""
        result = {"count": count}
        base_weight = 100 // count
        remainder = 100 % count
        
        for i in range(1, count + 1):
            extra = 1 if i <= remainder else 0
            result[str(i)] = {
                "id": i,
                "value": base_weight + extra,
                "input": f"fallback_test_input_{i}",
                "output": f"fallback_test_output_{i}",
                "explanation": f"Fallback test case. The AI failed to generate tests. Please manually create tests.",
                "difficulty": 3
            }
            
        return result