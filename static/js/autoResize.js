/**
 * Handle automatic textarea height adjustment
 */

/**
 * Automatically resize a textarea based on its content
 * @param {HTMLTextAreaElement} textarea - The textarea element to resize
 */
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    // Save current height
    const saveHeight = textarea.style.height;
    
    // Reset height to calculate proper scrollHeight
    textarea.style.height = 'auto';
    
    // Set height based on content (add 2px to prevent scrollbar in some browsers)
    const newHeight = Math.max(38, textarea.scrollHeight + 2);
    textarea.style.height = `${newHeight}px`;
    
    // If height didn't change, restore it
    if (saveHeight === textarea.style.height) {
        textarea.style.height = saveHeight;
    }
}

/**
 * Setup auto-resize for all textareas within an element
 * @param {HTMLElement} element - The parent element containing textareas
 */
function setupAutoResize(element) {
    const textareas = element.querySelectorAll('.auto-resize');
    
    textareas.forEach(textarea => {
        // Initially set proper height
        autoResizeTextarea(textarea);
        
        // Only add event listener if it doesn't already have one
        if (!textarea._hasAutoResizeListener) {
            textarea.addEventListener('input', function() {
                autoResizeTextarea(this);
            });
            textarea._hasAutoResizeListener = true;
        }
    });
}

/**
 * Update heights of all textareas in document
 */
function updateAllTextareaHeights() {
    document.querySelectorAll('.auto-resize').forEach(textarea => {
        autoResizeTextarea(textarea);
    });
}

/**
 * Robust function to update test field heights after generation
 * Tries multiple times with increasing delays to ensure DOM is ready
 */
function updateTestFieldHeights() {
    // Try updating immediately
    updateAllTextareaHeights();
    
    // Try with various delays to catch any late DOM updates
    const delays = [50, 100, 300, 500, 1000];
    
    delays.forEach(delay => {
        setTimeout(() => {
            // Get all test tabs
            const testContents = document.querySelectorAll('.test-tab-content');
            
            // Update each test's fields
            testContents.forEach(content => {
                // First ensure the tab has proper display properties for calculation
                const wasActive = content.classList.contains('active');
                
                // If not active, temporarily make it block to calculate properly
                if (!wasActive) {
                    content.style.display = 'block';
                    content.style.visibility = 'hidden'; // Avoid flicker
                }
                
                // Find all textareas and resize them
                const textareas = content.querySelectorAll('.auto-resize');
                textareas.forEach(textarea => {
                    autoResizeTextarea(textarea);
                });
                
                // Restore original state
                if (!wasActive) {
                    content.style.display = '';
                    content.style.visibility = '';
                }
            });
        }, delay);
    });
}

// Call setupAutoResize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupAutoResize(document);
    
    // Also adjust heights when window is resized
    window.addEventListener('resize', function() {
        updateAllTextareaHeights();
    });
});