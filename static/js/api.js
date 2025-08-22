/**
 * API module for Code Testing Platform
 * Handles server communication and data processing
 */

/**
 * Process API test results and update UI
 * @param {Object} tests - The tests object from API response
 */
function processAPITestResults(tests) {
    if (!tests || typeof tests !== 'object' || !tests.count) {
        console.warn("Invalid test results data:", tests);
        return;
    }

    // Clear previous results first
    resetTestResults();
    
    // Process each test result
    for (let i = 1; i <= tests.count; i++) {
        const testId = i.toString();
        const test = tests[testId];
        
        if (test) {
            // Get result and error message if any
            const passed = test.status === 'success';
            let errorMessage = null;
            
            if (!passed) {
                if (test.run_output !== undefined && test.output !== undefined) {
                    // Format the outputs for better comparison visibility
                    // But keep actual line breaks in the displayed message
                    const expectedOutput = test.output.replace(/\n/g, '\\n');
                    const actualOutput = (test.run_output || '').replace(/\n/g, '\\n');
                    errorMessage = `Expected: "${expectedOutput}", Got: "${actualOutput}"`;
                } else if (test.error) {
                    errorMessage = test.error;
                } else {
                    errorMessage = "Test failed";
                }
            }
            
            // Update UI
            console.log(`Updating test tab ${i}: passed=${passed}, message=${errorMessage}`);
            updateTestTabStatus(i, passed, errorMessage);
        }
    }
}

/**
 * Generate tests using AI
 * @returns {Promise<void>}
 */
async function generateTests() {
    resetTestingStatus();
    const statusElement = document.getElementById('generationStatus');
    const resultOutput = document.getElementById('resultOutput');
    
    try {
        // Show generation status
        statusElement.textContent = 'Generating tests...';
        statusElement.className = 'generation-status ongoing';
        resultOutput.textContent = 'Generating tests, please wait...';
        resultOutput.classList.remove('error');
        
        // Collect data
        const taskDescription = document.getElementById('taskDescription').value;
        const codeInput = document.getElementById('codeInput');
        const code = codeInput ? codeInput.value : '';
        
        // Get test count and validate against max value from configuration
        let testCount = parseInt(document.getElementById('testCount').value) || 5;
        const maxTestCount = parseInt(document.getElementById('testCount').getAttribute('max')) || 10;
        if (testCount > maxTestCount) {
            console.warn(`Requested ${testCount} tests, but max is ${maxTestCount}. Using maximum.`);
            testCount = maxTestCount;
            document.getElementById('testCount').value = maxTestCount;
        }
        
        const programmingLanguage = document.getElementById('programmingLanguage').value;
        
        if (!taskDescription || !code) {
            throw new Error('Task description and code are required');
        }
        
        // Prepare request data
        const requestData = {
            task_description: taskDescription,
            code: code,
            submission_code: code,
            test_count: testCount,
            programming_language: programmingLanguage || 'c'
        };
        
        console.log("Sending data to generate tests:", requestData);
        
        // Send API request
        const response = await fetch('/api/generate-tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error: ${response.status}, message: ${errorText}`);
        }
        
        // Process response
        const data = await response.json();
        resultOutput.textContent = JSON.stringify(data, null, 2);
        
        console.log("Received test data:", data);
        
        // Check if we got fallback tests
        const hasFallbackTests = data.tests && 
            data.tests[1] && 
            data.tests[1].input && 
            data.tests[1].input.startsWith('fallback_test_input_');
            
        if (hasFallbackTests) {
            statusElement.textContent = 'Generation had issues, using basic tests';
            statusElement.className = 'generation-status generation-warning';
            resultOutput.textContent += "\n\nNote: The AI had trouble generating specific tests. Please review and modify these basic tests.";
        } else {
            statusElement.textContent = 'Generated successfully';
            statusElement.className = 'generation-status generation-success';
        }
        
        // Clear existing tabs and test content
        document.querySelectorAll('.test-tab:not(.add-test-tab)').forEach(tab => tab.remove());
        document.getElementById('testsContainer').innerHTML = '';
        
        // Add each test and activate the first one
        let lastAddedIndex = 0;
        
        if (data.tests && data.tests.count) {
            for (let i = 1; i <= data.tests.count; i++) {
                const test = data.tests[i.toString()];
                if (test) {
                    console.log(`Adding test ${i}:`, test);
                    
                    // Process the input and output to handle newlines properly
                    const testInput = typeof test.input === 'string' ? 
                        test.input.replace(/\\n/g, '\n') : '';
                    const testOutput = typeof test.output === 'string' ? 
                        test.output.replace(/\\n/g, '\n') : '';
                    const testWeight = parseInt(test.value) || 20;
                    const testExplanation = test.explanation || '';
                    const testDifficulty = parseInt(test.difficulty) || 3;
                    
                    lastAddedIndex = addTest(
                        testInput, 
                        testOutput, 
                        testWeight, 
                        testExplanation, 
                        testDifficulty
                    );
                }
            }
            
            // Activate the first tab
            if (lastAddedIndex > 0) {
                activateTab(1);
                
                // Recalculate weights based on difficulty
                if (isAutoRecalculateEnabled()) {
                    setTimeout(() => {
                        recalculateWeightsBasedOnDifficulty();
                        console.log("Weights recalculated after test generation");
                    }, 100);
                }
                
                // Ensure textareas are properly sized
                updateTestFieldHeights();
            }
        } else {
            console.error("Invalid or missing tests in response:", data);
            throw new Error("Invalid test data received from server");
        }
        
        // Remove status message after 10 seconds
        setTimeout(() => {
            if (statusElement.textContent === 'Generated successfully' || 
                statusElement.textContent === 'Generation had issues, using basic tests') {
                statusElement.textContent = '';
                statusElement.className = 'generation-status';
            }
        }, 10000);
        
    } catch (error) {
        console.error('Error generating tests:', error);
        resultOutput.textContent = `Error: ${error.message}`;
        resultOutput.classList.add('error');
        
        // Show error message
        statusElement.textContent = 'Generation failed';
        statusElement.className = 'generation-status generation-error';
    }
}

/**
 * Submit code and tests to server for evaluation
 */
async function submitData() {
    const statusElement = document.getElementById('testingStatus');
    
    try {
        // Show testing status
        statusElement.textContent = 'Running tests...';
        statusElement.className = 'testing-status ongoing';

        // Reset previous results
        resetCompilationStatus();
        resetTestResults();
        
        // Collect form data
        const taskName = document.getElementById('taskName').value;
        const taskDescription = document.getElementById('taskDescription').value;
        const submissionCode = document.getElementById('codeInput').value;
        const programmingLanguage = document.getElementById('programmingLanguage').value;
        const maxGrade = parseInt(document.getElementById('maxGrade').value) || 10;
        
        if (!taskName || !taskDescription || !submissionCode) {
            throw new Error('Please fill in task name, description, and code');
        }
        
        // Collect test data
        const testContents = document.querySelectorAll('.test-tab-content');
        const tests = {
            count: testContents.length
        };
        
        let totalWeight = 0;
        
        testContents.forEach((testContent, index) => {
            const input = testContent.querySelector('.test-input').value;
            const output = testContent.querySelector('.test-output').value.trim(); // Trim to fix whitespace issues
            const weight = parseInt(testContent.querySelector('.test-weight').value) || 0;
            const explanation = testContent.querySelector('.test-explanation')?.value || "";
            
            if (!input || !output) {
                throw new Error(`Please fill in input and output for test ${index + 1}`);
            }
            
            totalWeight += weight;
            
            tests[index + 1] = {
                id: index + 1,
                value: weight,
                input: input,
                output: output, // Normalized output
                explanation: explanation
            };
        });
        
        if (totalWeight !== 100) {
            throw new Error('Test weights must sum to 100');
        }
        
        // Prepare data for submission
        const jsonData = {
            id: Date.now(),
            user_id: 1,
            task_id: 1,
            variant_id: 1,
            max_grade: maxGrade,
            submission_code: submissionCode,
            programming_language: programmingLanguage,
            task_name: taskName,
            task_description: taskDescription,
            tests: tests
        };
        
        console.log("Submitting data:", jsonData);
        
        // Send data to server
        const response = await fetch('/api/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error: ${response.status}, message: ${errorText}`);
        }
        
        // Process successful response
        const data = await response.json();
        document.getElementById('resultOutput').textContent = JSON.stringify(data, null, 2);
        
        // Update testing status
        statusElement.textContent = 'Testing completed';
        statusElement.className = 'testing-status testing-success';

        // Update compilation status based on server response
        if (data.build_status && data.build_message) {
            const isSuccess = data.build_status === "success";
            updateCompilationStatus(isSuccess, data.build_message);
            
            if (isSuccess) {
                // Display grade if available
                if (data.grade !== undefined) {
                    const gradeDisplay = document.getElementById('gradeDisplay');
                    if (gradeDisplay) {
                        gradeDisplay.textContent = `Grade: ${data.grade}/${maxGrade}`;
                        
                        // Add styling based on grade percentage
                        const percentage = (data.grade / maxGrade) * 100;
                        if (percentage >= 90) {
                            gradeDisplay.style.backgroundColor = '#e6ffe6'; // light green
                            gradeDisplay.style.color = '#1e6929';
                        } else if (percentage >= 70) {
                            gradeDisplay.style.backgroundColor = '#e6f7ff'; // light blue
                            gradeDisplay.style.color = '#0d47a1';
                        } else if (percentage >= 50) {
                            gradeDisplay.style.backgroundColor = '#fff9e6'; // light yellow
                            gradeDisplay.style.color = '#b35900';
                        } else {
                            gradeDisplay.style.backgroundColor = '#ffebee'; // light red
                            gradeDisplay.style.color = '#c62828';
                        }
                    }
                }
                
                // Process and display test results
                if (data.tests) {
                    processAPITestResults(data.tests);
                }
            } else {
                statusElement.textContent = 'Compilation failed';
                statusElement.className = 'testing-status testing-error';
                
                // Mark all tests as failed in case of compilation failure
                const testTabs = document.querySelectorAll('.test-tab:not(.add-test-tab)');
                testTabs.forEach(tab => {
                    const testId = tab.getAttribute('data-test-id');
                    updateTestTabStatus(testId, false, "Compilation failed");
                });
            }
        } else {
            console.warn("No build status information in server response");
            
            // Try to process test results from data if available
            if (data.tests && data.tests.count > 0) {
                processAPITestResults(data.tests);
            }
        }
        
    } catch (error) {
        console.error('Detailed error:', error);
        document.getElementById('resultOutput').textContent = `Error: ${error.message}`;
        document.getElementById('resultOutput').classList.add('error');
        
        // Update testing status to error
        if (statusElement) {
            statusElement.textContent = 'Error testing';
            statusElement.className = 'testing-status testing-error';
        }
        
        updateCompilationStatus(false, error.message);
    }
}