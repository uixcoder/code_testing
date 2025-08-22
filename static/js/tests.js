/**
 * Tests module for Code Testing Platform
 * Handles test operations and data management
 */

/**
 * Get test data from all test elements
 * @returns {Object} - Object containing test data
 */
function getAllTests() {
    const testContents = document.querySelectorAll('.test-tab-content');
    const tests = {
        count: testContents.length
    };
    
    let totalWeight = 0;
    
    testContents.forEach((testContent, index) => {
        const testId = index + 1;
        const input = testContent.querySelector('.test-input').value;
        const output = testContent.querySelector('.test-output').value;
        const weight = parseInt(testContent.querySelector('.test-weight').value) || 0;
        const explanation = testContent.querySelector('.test-explanation')?.value || "";
        const difficulty = parseInt(testContent.querySelector('.test-difficulty')?.value || 3);
        
        totalWeight += weight;
        
        tests[testId] = {
            id: testId,
            value: weight,
            input: input,
            output: output,
            explanation: explanation,
            difficulty: difficulty
        };
    });
    
    tests.totalWeight = totalWeight;
    return tests;
}

/**
 * Validate test data
 * @returns {boolean} - Whether tests are valid
 */
function validateTests() {
    const testContents = document.querySelectorAll('.test-tab-content');
    if (testContents.length === 0) {
        alert("Please add at least one test");
        return false;
    }
    
    let totalWeight = 0;
    let isValid = true;
    
    testContents.forEach((testContent, index) => {
        const testId = index + 1;
        const input = testContent.querySelector('.test-input').value;
        const output = testContent.querySelector('.test-output').value;
        const weight = parseInt(testContent.querySelector('.test-weight').value) || 0;
        
        if (!input.trim() || !output.trim()) {
            alert(`Please fill in input and output for test ${testId}`);
            isValid = false;
            return false;
        }
        
        totalWeight += weight;
    });
    
    if (totalWeight !== 100 && isValid) {
        alert("Test weights must sum to 100%");
        return false;
    }
    
    return isValid;
}

/**
 * Get a single test's data by index
 * @param {number} testIndex - Index of the test
 * @returns {Object|null} - Test data or null if not found
 */
function getTestByIndex(testIndex) {
    const testContent = document.querySelector(`.test-tab-content[data-test-id="${testIndex}"]`);
    if (!testContent) return null;
    
    return {
        input: testContent.querySelector('.test-input').value,
        output: testContent.querySelector('.test-output').value,
        weight: parseInt(testContent.querySelector('.test-weight').value) || 0,
        explanation: testContent.querySelector('.test-explanation')?.value || "",
        difficulty: parseInt(testContent.querySelector('.test-difficulty')?.value || 3)
    };
}

/**
 * Duplicate a test
 * @param {number} testIndex - Index of test to duplicate
 */
function duplicateTest(testIndex) {
    const test = getTestByIndex(testIndex);
    if (!test) return;
    
    // Add duplicate test
    const newTestIndex = addTest(
        test.input,
        test.output,
        test.weight,
        test.explanation,
        test.difficulty
    );
    
    // Activate the new test tab
    activateTab(newTestIndex);
    
    // Recalculate weights if necessary
    if (isAutoRecalculateEnabled()) {
        recalculateWeightsBasedOnDifficulty();
    }
}

/**
 * Reset all tests (remove all tests)
 */
function resetAllTests() {
    if (confirm('Are you sure you want to remove all tests?')) {
        document.querySelectorAll('.test-tab:not(.add-test-tab)').forEach(tab => tab.remove());
        document.getElementById('testsContainer').innerHTML = '';
        
        // Add one default test
        const firstIndex = addTest('', '', 100);
        activateTab(firstIndex);
        
        resetTestingStatus();
    }
}

/**
 * Update test status visualization for all tests
 * @param {Object} testResults - Test results object
 */
function updateTestsVisualStatus(testResults) {
    resetTestResults(); // Clear previous results
    
    if (!testResults || !testResults.count) return;
    
    // Process each test result
    for (let i = 1; i <= testResults.count; i++) {
        const testId = i.toString();
        const test = testResults[testId];
        
        if (test) {
            const passed = test.status === 'success';
            let errorMessage = null;
            
            if (!passed) {
                if (test.run_output !== undefined && test.output !== undefined) {
                    errorMessage = `Expected: "${test.output}", Got: "${test.run_output || ''}"`;
                } else if (test.error) {
                    errorMessage = test.error;
                } else {
                    errorMessage = "Test failed";
                }
            }
            
            updateTestTabStatus(i, passed, errorMessage);
        }
    }
}

/**
 * Import test data from JSON
 * @param {string} jsonText - JSON string containing test data
 */
function importTestsFromJson(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        
        if (!data.tests || !data.tests.count) {
            throw new Error('Invalid test data format');
        }
        
        // Clear existing tests
        document.querySelectorAll('.test-tab:not(.add-test-tab)').forEach(tab => tab.remove());
        document.getElementById('testsContainer').innerHTML = '';
        
        // Add each test from the imported data
        let lastAddedIndex = 0;
        for (let i = 1; i <= data.tests.count; i++) {
            const test = data.tests[i.toString()];
            if (test) {
                lastAddedIndex = addTest(
                    test.input || '', 
                    test.output || '', 
                    test.value || 20, 
                    test.explanation || '', 
                    test.difficulty || 3
                );
            }
        }
        
        // Activate the first tab if any were added
        if (lastAddedIndex > 0) {
            activateTab(1);
            // Adjust all textarea heights
            setTimeout(() => {
                document.querySelectorAll('.auto-resize').forEach(textarea => {
                    autoResizeTextarea(textarea);
                });
            }, 10);
        }
        
        // Show success message
        alert('Tests imported successfully');
    } catch (error) {
        console.error('Error importing tests:', error);
        alert(`Error importing tests: ${error.message}`);
    }
}

/**
 * Export all test data to JSON
 * @returns {string} - JSON string of test data
 */
function exportTestsToJson() {
    const tests = getAllTests();
    return JSON.stringify({tests}, null, 2);
}