/**
 * Main JavaScript for Code Testing Platform
 * Initializes UI components and event handlers
 */

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up programming language change handler
    const languageSelect = document.getElementById('programmingLanguage');
    if (languageSelect) {
        languageSelect.addEventListener('change', handleLanguageChange);
        
        // Initially load the default language
        handleLanguageChange();
    }
    
    // Setup auto-resize for all textareas
    setupAutoResize(document);
    
    // Set up test change listeners
    setupTestChangeListeners();
    
    // Add click event for the "add test" button
    const addTestBtn = document.getElementById('addTestTab');
    if (addTestBtn) {
        addTestBtn.addEventListener('click', addTestInput);
    }
    
    // Add click event for the generate tests button
    const generateTestsBtn = document.getElementById('generateTestsBtn');
    if (generateTestsBtn) {
        generateTestsBtn.addEventListener('click', generateTests);
    }
    
    // Add click event for the submit button
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.addEventListener('click', submitData);
    }

    // Initialize test tabs
    initUI();
});

/**
 * Handle programming language change
 */
function handleLanguageChange() {
    const languageSelect = document.getElementById('programmingLanguage');
    const codeInput = document.getElementById('codeInput');
    
    if (!languageSelect || !codeInput) return;
    
    const language = languageSelect.value;
    codeInput.setAttribute('data-language', language);
    
    // Update sample code based on selected language
    switch (language) {
        case 'c':
            loadDefaultCode('c', '#include <stdio.h>\n\nint main()\n{\n    int i;\n    scanf("%d", &i);\n    printf("%d", i);\n    return 0;\n}');
            break;
        case 'cpp':
            loadDefaultCode('cpp', '#include <iostream>\n\nint main() {\n    int i;\n    std::cin >> i;\n    std::cout << i;\n    return 0;\n}');
            break;
        case 'python':
            loadDefaultCode('python', 'i = int(input())\nprint(i)');
            break;
        case 'java':
            loadDefaultCode('java', 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        int i = scanner.nextInt();\n        System.out.println(i);\n        scanner.close();\n    }\n}');
            break;
    }
    
    // Reset compilation and test status when language changes
    resetCompilationStatus();
    resetTestingStatus();
}

/**
 * Load default code for a language
 * @param {string} language - The programming language
 * @param {string} defaultCode - The default code snippet
 */
function loadDefaultCode(language, defaultCode) {
    const codeInput = document.getElementById('codeInput');
    
    // Only set default code if the current code is empty or from another language
    if (!codeInput.value.trim() || codeInput.getAttribute('data-language') !== language) {
        codeInput.value = defaultCode;
        autoResizeTextarea(codeInput);
    }
}

/**
 * Setup listeners to track test changes and reset testing status
 */
function setupTestChangeListeners() {
    document.addEventListener('input', function(e) {
        // Check if the changed field is related to tests
        if (e.target.classList.contains('test-input') || 
            e.target.classList.contains('test-output') ||
            e.target.classList.contains('test-weight') ||
            e.target.classList.contains('test-difficulty') ||
            e.target.classList.contains('test-explanation')) {
            resetTestingStatus();
        }
        
        // Update difficulty display if difficulty slider is changed
        if (e.target.classList.contains('test-difficulty')) {
            const testContent = e.target.closest('.test-tab-content');
            const difficultyDisplay = testContent?.querySelector('.difficulty-value');
            if (difficultyDisplay) {
                difficultyDisplay.textContent = e.target.value;
            }
        }
    });
    
    // Reset status when code changes
    const codeInput = document.getElementById('codeInput');
    if (codeInput) {
        codeInput.addEventListener('input', function() {
            resetCompilationStatus();
            resetTestingStatus();
        });
    }
}

/**
 * Update compilation status UI
 * @param {boolean} success - Whether compilation succeeded
 * @param {string} message - Compilation message
 */
function updateCompilationStatus(success, message = '') {
    const statusElement = document.getElementById('compilationStatus');
    
    if (success) {
        statusElement.innerHTML = `<span>✓ ${message || 'Compilation Successful'}</span>`;
        statusElement.className = 'compilation-status compilation-success';
    } else {
        let errorDisplay = `<span>✗ ${message || 'Compilation Failed'}</span>`;
        if (message && message !== 'Compilation Failed') {
            // Add error details if available
            errorDisplay += `<div class="compilation-error-details">${message}</div>`;
        }
        statusElement.innerHTML = errorDisplay;
        statusElement.className = 'compilation-status compilation-error';
    }
}