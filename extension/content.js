// Content script - runs in the context of web pages
console.log('VantaPrompt extension content script loaded');

// Example: Add a simple indicator to the page
function addExtensionIndicator() {
  // Only add if not already present
  if (document.getElementById('vantaprompt-indicator')) {
    return;
  }

  const indicator = document.createElement('div');
  indicator.id = 'vantaprompt-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 10000;
    display: none;
  `;
  indicator.textContent = 'VantaPrompt Active';
  document.body.appendChild(indicator);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addExtensionIndicator);
} else {
  addExtensionIndicator();
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showIndicator') {
    const indicator = document.getElementById('vantaprompt-indicator');
    if (indicator) {
      indicator.style.display = 'block';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 2000);
    }
    sendResponse({ success: true });
  }
  return true;
});

