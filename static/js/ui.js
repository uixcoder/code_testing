// Define difficulty multipliers
const difficultyMultipliers = {
    '1': 0.5, // Easy
    '2': 0.8, // Medium-Easy
    '3': 1.0, // Medium
    '4': 1.5, // Medium-Hard
    '5': 2.0  // Hard
};

/**
 * UI module for Code Testing Platform
 * Handles test tabs, weights, and other UI interactions
 */

/**
 * Add a new test with the provided input, output, and weight
 * @param {string} input - Test input
 * @param {string} output - Expected test output
 * @param {number} weight - Test weight percentage
 * @param {string} explanation - Test explanation
 * @param {number} difficulty - Test difficulty level (1-5)
 * @returns {number} - Index of the added test
 */
function addTest(input = '', output = '', weight = 20, explanation = '', difficulty = 3) {
    // Get current containers
    const testTabs = document.getElementById('testTabs');
    const testsContainer = document.getElementById('testsContainer');
    
    // Calculate new test index
    const testIndex = document.querySelectorAll('.test-tab:not(.add-test-tab)').length + 1;
    
    // Create tab element with difficulty indicator
    const tabElement = document.createElement('div');
    tabElement.className = 'test-tab';
    tabElement.setAttribute('data-test-id', testIndex);
    tabElement.innerHTML = `
        <span>${testIndex}</span>
        <span class="difficulty-indicator difficulty-${difficulty}">D${difficulty}</span>
    `;
    
    // Add click handler to tab
    tabElement.addEventListener('click', function(e) {
        if (!e.target.closest('.delete-test-btn')) {
            activateTab(testIndex);
        }
    });
    
    // Add tab before the "+" tab
    const addTab = document.querySelector('.add-test-tab');
    testTabs.insertBefore(tabElement, addTab);
    
    // Create test content
    const testContent = document.createElement('div');
    testContent.className = 'test-tab-content';
    testContent.setAttribute('data-test-id', testIndex);
    
    // Set the content
    testContent.innerHTML = `
        <div class="test-header">
            <h3>Test ${testIndex}</h3>
            <button class="delete-test-btn" title="Delete test">&times;</button>
        </div>
        <div class="test-io-container">
            <div class="test-input-container">
                <label class="field-label">Input:</label>
                <textarea class="test-input form-control auto-resize">${input}</textarea>
            </div>
            <div class="test-output-container">
                <label class="field-label">Expected Output:</label>
                <textarea class="test-output form-control auto-resize">${output}</textarea>
            </div>
        </div>
        <div class="test-weight-container">
            <span class="test-weight-label">Weight:</span>
            <input type="text" class="test-weight-value form-control" value="${weight}" readonly>%
            <input type="range" class="test-weight form-range test-weight-range" min="0" max="100" value="${weight}" oninput="testWeightChanged(this)">
        </div>
        <div class="difficulty-container">
            <span class="difficulty-label">Difficulty:</span>
            <div class="difficulty-options">
                <div class="difficulty-option ${difficulty === 1 ? 'selected' : ''}" data-value="1" onclick="setDifficulty(this, ${testIndex})">Easy</div>
                <div class="difficulty-option ${difficulty === 2 ? 'selected' : ''}" data-value="2" onclick="setDifficulty(this, ${testIndex})">Medium-Easy</div>
                <div class="difficulty-option ${difficulty === 3 ? 'selected' : ''}" data-value="3" onclick="setDifficulty(this, ${testIndex})">Medium</div>
                <div class="difficulty-option ${difficulty === 4 ? 'selected' : ''}" data-value="4" onclick="setDifficulty(this, ${testIndex})">Medium-Hard</div>
                <div class="difficulty-option ${difficulty === 5 ? 'selected' : ''}" data-value="5" onclick="setDifficulty(this, ${testIndex})">Hard</div>
            </div>
            <input type="hidden" class="test-difficulty" value="${difficulty}">
        </div>
        <div class="test-explanation-container">
            <label class="test-explanation-label">Explanation:</label>
            <textarea class="test-explanation form-control auto-resize">${explanation}</textarea>
        </div>
    `;
    
    // Add to container
    testsContainer.appendChild(testContent);
    
    // Add delete button handler
    const deleteBtn = testContent.querySelector('.delete-test-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            removeTestTab(testIndex);
        });
    }
    
    // Setup auto-resize for new fields
    setupAutoResize(testContent);
    
    // Setup difficulty buttons
    setupDifficultyButtons(testContent, testIndex);
    
    return testIndex;
}

/**
 * Setup difficulty buttons for a test
 * @param {HTMLElement} testContent - The test content element
 * @param {number} testIndex - The test index
 */
function setupDifficultyButtons(testContent, testIndex) {
    const difficultyOptions = testContent.querySelectorAll('.difficulty-option');
    difficultyOptions.forEach(option => {
        option.addEventListener('click', function() {
            setDifficulty(this, testIndex);
        });
    });
}

/**
 * Update the difficulty indicator in the test tab
 * @param {number} testId - The test ID
 * @param {number} difficulty - The new difficulty level
 */
function updateTabDifficulty(testId, difficulty) {
    const tab = document.querySelector(`.test-tab[data-test-id="${testId}"]`);
    if (!tab) return;
    
    let indicator = tab.querySelector('.difficulty-indicator');
    
    // If the indicator doesn't exist, create it
    if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'difficulty-indicator';
        tab.appendChild(indicator);
    }
    
    // Update the indicator class and content
    indicator.className = `difficulty-indicator difficulty-${difficulty}`;
    indicator.textContent = `D${difficulty}`;
}

/**
 * Activate a specific test tab
 * @param {number} tabId - ID of the tab to activate
 */
function activateTab(tabId) {
    // Deactivate all tabs
    document.querySelectorAll('.test-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.test-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate selected tab
    const selectedTab = document.querySelector(`.test-tab[data-test-id="${tabId}"]`);
    const selectedContent = document.querySelector(`.test-tab-content[data-test-id="${tabId}"]`);
    
    if (selectedTab && selectedContent) {
        selectedTab.classList.add('active');
        selectedContent.classList.add('active');
        
        // Adjust textarea heights in the selected tab
        const textareas = selectedContent.querySelectorAll('.auto-resize');
        textareas.forEach(textarea => {
            autoResizeTextarea(textarea);
        });
    }
}

/**
 * Remove a test tab
 * @param {number} tabId - ID of the tab to remove
 */
function removeTestTab(tabId) {
    // Find elements to remove
    const tabToRemove = document.querySelector(`.test-tab[data-test-id="${tabId}"]`);
    const contentToRemove = document.querySelector(`.test-tab-content[data-test-id="${tabId}"]`);
    
    if (!tabToRemove || !contentToRemove) return;
    
    // Check if tab was active
    const wasActive = tabToRemove.classList.contains('active');
    
    // Determine which tab to activate after removal
    let newActiveTabId = null;
    
    if (wasActive) {
        const tabs = Array.from(document.querySelectorAll('.test-tab:not(.add-test-tab)'));
        const currentIndex = tabs.indexOf(tabToRemove);
        
        if (currentIndex > 0) {
            // Get previous tab
            newActiveTabId = tabs[currentIndex - 1].getAttribute('data-test-id');
        } else if (tabs.length > 1) {
            // Get next tab
            newActiveTabId = tabs[1].getAttribute('data-test-id');
        }
    }
    
    // Remove elements
    tabToRemove.remove();
    contentToRemove.remove();
    
    // Renumber tabs
    renumberTabs();
    
    // Reset testing status
    resetTestingStatus();
    
    // Activate new tab if needed
    if (wasActive && document.querySelectorAll('.test-tab:not(.add-test-tab)').length > 0) {
        activateTab(newActiveTabId || 1);
    }
    
    // Recalculate weights if auto-recalculate is enabled
    if (isAutoRecalculateEnabled()) {
        recalculateWeightsBasedOnDifficulty();
    }
}

/**
 * Renumber tabs after deletion
 */
function renumberTabs() {
    const tabs = document.querySelectorAll('.test-tab:not(.add-test-tab)');
    const contents = document.querySelectorAll('.test-tab-content');
    
    // Clear event handlers from tabs
    tabs.forEach(tab => {
        // Create clone to remove event listeners
        const newTab = tab.cloneNode(true);
        if (tab.parentNode) {
            tab.parentNode.replaceChild(newTab, tab);
        }
    });
    
    // Get refreshed tabs after clearing handlers
    const refreshedTabs = document.querySelectorAll('.test-tab:not(.add-test-tab)');
    
    // Renumber tabs
    refreshedTabs.forEach((tab, index) => {
        const newId = index + 1;
        
        // Update ID and text
        tab.setAttribute('data-test-id', newId);
        const numSpan = tab.querySelector('span:first-child');
        if (numSpan) numSpan.textContent = `${newId}`;
        
        // Add event handler
        tab.addEventListener('click', function(e) {
            if (!e.target.closest('.delete-test-btn')) {
                activateTab(newId);
            }
        });
    });
    
    // Renumber content containers
    contents.forEach((content, index) => {
        const newId = index + 1;
        content.setAttribute('data-test-id', newId);
        
        // Update the title
        const title = content.querySelector('h3');
        if (title) {
            title.textContent = `Test ${newId}`;
        }
        
        // Clear and update delete buttons
        const deleteBtn = content.querySelector('.delete-test-btn');
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            
            // Add new handler
            newDeleteBtn.addEventListener('click', function() {
                removeTestTab(newId);
            });
        }
        
        // Re-setup difficulty buttons
        setupDifficultyButtons(content, newId);
    });
}

/**
 * Check if auto-recalculate is enabled
 * @returns {boolean} - Whether auto-recalculate is enabled
 */
function isAutoRecalculateEnabled() {
    return document.getElementById('autoRecalculateToggle').checked;
}

/**
 * Recalculate test weights based on difficulty levels
 */
function recalculateWeightsBasedOnDifficulty() {
    const testContents = document.querySelectorAll('.test-tab-content');
    if (testContents.length === 0) return;
    
    // Calculate total difficulty
    let totalRawWeight = 0;
    testContents.forEach(test => {
        const difficultyInput = test.querySelector('.test-difficulty');
        if (difficultyInput) {
            const difficulty = parseInt(difficultyInput.value) || 3;
            const multiplier = difficultyMultipliers[difficulty] || 1.0;
            test.dataset.rawWeight = multiplier;
            totalRawWeight += multiplier;
        }
    });
    
    // Calculate and set weights
    let totalWeight = 0;
    testContents.forEach(test => {
        if (totalRawWeight === 0) {
            // Edge case: all difficulties are 0 (shouldn't happen)
            // Distribute equally
            const weight = Math.floor(100 / testContents.length);
            setTestWeight(test, weight);
            totalWeight += weight;
        } else {
            const rawWeight = parseFloat(test.dataset.rawWeight || 1.0);
            const normalizedWeight = Math.round((rawWeight / totalRawWeight) * 100);
            setTestWeight(test, normalizedWeight);
            totalWeight += normalizedWeight;
        }
    });
    
    // Adjust to ensure sum is exactly 100%
    if (totalWeight !== 100 && testContents.length > 0) {
        const diff = 100 - totalWeight;
        
        // Find test with highest difficulty to add/subtract from
        const testsByDifficulty = Array.from(testContents).sort((a, b) => {
            const diffA = parseInt(a.querySelector('.test-difficulty')?.value || 3);
            const diffB = parseInt(b.querySelector('.test-difficulty')?.value || 3);
            return diffB - diffA;
        });
        
        const highestDifficultyTest = testsByDifficulty[0];
        if (highestDifficultyTest) {
            const weightInput = highestDifficultyTest.querySelector('.test-weight');
            if (weightInput) {
                const currentWeight = parseInt(weightInput.value) || 0;
                const newWeight = Math.max(0, currentWeight + diff);
                setTestWeight(highestDifficultyTest, newWeight);
            }
        }
    }
}

/**
 * Set the weight for a test
 * @param {HTMLElement} test - The test element
 * @param {number} weight - The weight to set
 */
function setTestWeight(test, weight) {
    const weightInput = test.querySelector('.test-weight');
    const weightValue = test.querySelector('.test-weight-value');
    
    if (weightInput) weightInput.value = weight;
    if (weightValue) weightValue.value = weight;
}

/**
 * Redistribute weights when a weight is manually changed
 * @param {Element} changedSlider - The slider that was changed
 */
function redistributeOtherWeights(changedSlider) {
    const allTests = document.querySelectorAll('.test-tab-content');
    if (allTests.length <= 1) return;
    
    const changedTest = changedSlider.closest('.test-tab-content');
    const changedWeight = parseInt(changedSlider.value) || 0;
    
    // Get all other tests for redistribution
    const otherTests = Array.from(allTests).filter(item => item !== changedTest);
    
    // Calculate new sum for other tests (must be 100 - changedWeight)
    const newOtherTestsSum = 100 - changedWeight;
    
    // Special case: if changed weight is 100%, set all others to 0
    if (changedWeight === 100) {
        otherTests.forEach(test => {
            setTestWeight(test, 0);
        });
        return;
    }
   
    // Calculate total difficulty based raw weight
    let totalRawWeight = 0;
    otherTests.forEach(test => {
        const difficulty = test.querySelector('.test-difficulty')?.value || 3;
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        test.dataset.rawWeight = multiplier;
        totalRawWeight += multiplier;
    });
    
    if (totalRawWeight === 0) {
        // Distribute equally
        const equalWeight = Math.floor(newOtherTestsSum / otherTests.length);
        let remainder = newOtherTestsSum - (equalWeight * otherTests.length);
        
        otherTests.forEach(test => {
            let weight = equalWeight;
            if (remainder > 0) {
                weight++;
                remainder--;
            }
            setTestWeight(test, weight);
        });
    } else {
        // Distribute proportionally based on difficulty
        let newTotalWeight = changedWeight;
        
        otherTests.forEach(test => {
            const rawWeight = parseFloat(test.dataset.rawWeight);
            const proportion = rawWeight / totalRawWeight;
            let newWeight = Math.round(proportion * newOtherTestsSum);
            
            // Ensure minimum weight is 0
            newWeight = Math.max(0, newWeight);
            
            setTestWeight(test, newWeight);
            newTotalWeight += newWeight;
        });
        
        // Final adjustment to ensure total is exactly 100%
        if (newTotalWeight !== 100 && otherTests.length > 0) {
            const diff = 100 - newTotalWeight;
            
            // Find test with highest difficulty to add/subtract from
            const testsByDifficulty = otherTests.sort((a, b) => {
                const diffA = parseInt(a.querySelector('.test-difficulty')?.value || 3);
                const diffB = parseInt(b.querySelector('.test-difficulty')?.value || 3);
                return diffB - diffA;
            });
            
            const targetTest = testsByDifficulty[0];
            const weightInput = targetTest.querySelector('.test-weight');
            if (weightInput) {
                const currentWeight = parseInt(weightInput.value) || 0;
                const newWeight = Math.max(0, currentWeight + diff);
                setTestWeight(targetTest, newWeight);
            }
        }
    }
}

/**
 * Function to add a new test with empty fields
 */
function addTestInput() {
    addTest();
    
    // Activate the newly added tab
    const testIndex = document.querySelectorAll('.test-tab:not(.add-test-tab)').length;
    if (testIndex > 0) {
        activateTab(testIndex);
    }
}

/**
 * Handle test weight change
 * @param {HTMLInputElement} rangeInput - The range input element
 */
function testWeightChanged(rangeInput) {
    // Update the weight value display
    const valueDisplay = rangeInput.parentElement.querySelector('.test-weight-value');
    if (valueDisplay) {
        valueDisplay.value = rangeInput.value;
    }
    
    // Recalculate weights to ensure they sum to 100%
    if (isAutoRecalculateEnabled()) {
        redistributeOtherWeights(rangeInput);
    }
}

/**
 * Set the difficulty level for a test
 * @param {HTMLElement} option - The clicked difficulty option
 * @param {number} testIndex - The test index
 */
function setDifficulty(option, testIndex) {
    const testContent = document.querySelector(`.test-tab-content[data-test-id="${testIndex}"]`);
    if (!testContent) return;
    
    // Get all options in the container
    const options = option.closest('.difficulty-options').querySelectorAll('.difficulty-option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Select this option
    option.classList.add('selected');
    
    // Update hidden input
    const difficultyInput = testContent.querySelector('.test-difficulty');
    if (difficultyInput) {
        const newDifficulty = option.getAttribute('data-value');
        difficultyInput.value = newDifficulty;
        
        // Update the tab display
        updateTabDifficulty(testIndex, parseInt(newDifficulty));
        
        // Recalculate weights if auto-recalculate is enabled
        if (isAutoRecalculateEnabled()) {
            recalculateWeightsBasedOnDifficulty();
        }
    }
}

/**
 * Update test tab status to show pass/fail status
 * @param {number} testId - The test ID
 * @param {boolean} passed - Whether the test passed
 * @param {string} errorMessage - Optional error message
 */
function updateTestTabStatus(testId, passed, errorMessage = null) {
    const tab = document.querySelector(`.test-tab[data-test-id="${testId}"]`);
    const content = document.querySelector(`.test-tab-content[data-test-id="${testId}"]`);
    
    if (tab) {
        // Remove previous status classes
        tab.classList.remove('test-success', 'test-failed');
        
        // Create or find status icon
        let statusIcon = tab.querySelector('.status-icon');
        if (!statusIcon) {
            statusIcon = document.createElement('span');
            statusIcon.className = 'status-icon';
            tab.appendChild(statusIcon);
        }
        
        if (passed) {
            // Test passed
            tab.classList.add('test-success');
            statusIcon.textContent = '✓';
        } else {
            // Test failed
            tab.classList.add('test-failed');
            statusIcon.textContent = '✗';
            
            // Add error message to content if provided
            if (content && errorMessage) {
                // Remove previous errors
                const oldError = content.querySelector('.test-error');
                if (oldError) oldError.remove();
                
                // Add new error message
                const errorElement = document.createElement('div');
                errorElement.className = 'test-error';
                errorElement.textContent = `Error: ${errorMessage}`;
                content.appendChild(errorElement);
            }
        }
    }
}

/**
 * Reset test results (remove pass/fail status)
 */
function resetTestResults() {
    document.querySelectorAll('.test-tab').forEach(tab => {
        if (!tab.classList.contains('add-test-tab')) {
            tab.classList.remove('test-success', 'test-failed');
            const statusIcon = tab.querySelector('.status-icon');
            if (statusIcon) statusIcon.remove();
        }
    });
    
    document.querySelectorAll('.test-error').forEach(errorElement => {
        errorElement.remove();
    });
}

/**
 * Reset testing status
 */
function resetTestingStatus() {
    const statusElement = document.getElementById('testingStatus');
    if (statusElement) {
        statusElement.textContent = '';
        statusElement.className = 'testing-status';
    }
    
    // Reset compilation status
    resetCompilationStatus();
    
    // Reset test results
    resetTestResults();
    
    // Reset grade display
    resetGradeDisplay();
}

/**
 * Reset compilation status
 */
function resetCompilationStatus() {
    const statusElement = document.getElementById('compilationStatus');
    if (statusElement) {
        statusElement.innerHTML = '';
        statusElement.className = 'compilation-status';
    }
}

/**
 * Reset grade display
 */
function resetGradeDisplay() {
    const gradeDisplay = document.getElementById('gradeDisplay');
    if (gradeDisplay) {
        gradeDisplay.textContent = '';
        gradeDisplay.style.backgroundColor = '';
        gradeDisplay.style.color = '';
    }
}

/**
 * Initialize UI event handlers
 */
function initUI() {
    // Set up "Add Test" button click handler
    const addTestTab = document.getElementById('addTestTab');
    if (addTestTab) {
        addTestTab.addEventListener('click', addTestInput);
    }
    
    // Add initial test if none exist
    if (document.querySelectorAll('.test-tab:not(.add-test-tab)').length === 0) {
        const firstIndex = addTest('', '', 100);
        activateTab(firstIndex);
    } else {
        // Activate the first tab if any exists
        activateTab(1);
    }
    
    // Set up auto-recalculate toggle event
    const autoRecalculateToggle = document.getElementById('autoRecalculateToggle');
    if (autoRecalculateToggle) {
        autoRecalculateToggle.addEventListener('change', function() {
            if (this.checked) {
                recalculateWeightsBasedOnDifficulty();
            }
        });
    }
    
    // Set up global event listener for textarea changes
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('auto-resize')) {
            autoResizeTextarea(e.target);
        }
    });
}

// Call this function when page loads
document.addEventListener('DOMContentLoaded', initUI);