// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('actionBtn');
  const status = document.getElementById('status');

  // Load saved state
  chrome.storage.local.get(['clickCount'], (result) => {
    const count = result.clickCount || 0;
    if (count > 0) {
      updateStatus(`Button clicked ${count} times`);
    }
  });

  // Button click handler
  actionBtn.addEventListener('click', () => {
    // Get current count
    chrome.storage.local.get(['clickCount'], (result) => {
      const newCount = (result.clickCount || 0) + 1;
      
      // Save new count
      chrome.storage.local.set({ clickCount: newCount }, () => {
        updateStatus(`Button clicked ${newCount} time${newCount !== 1 ? 's' : ''}`);
      });
    });

    // Send message to background script
    chrome.runtime.sendMessage({ action: 'buttonClicked' }, (response) => {
      console.log('Response from background:', response);
    });
  });
});

function updateStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.classList.add('show');
}

