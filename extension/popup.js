// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('actionBtn');
  const status = document.getElementById('status');
  const promptMonitor = document.getElementById('promptMonitor');
  const promptContent = document.getElementById('promptContent');
  const promptInfo = document.getElementById('promptInfo');
  const dbStatusBtn = document.getElementById('dbStatusBtn');
  const dbStatus = document.getElementById('dbStatus');
  const detectionAlert = document.getElementById('detectionAlert');
  const detectedNumbers = document.getElementById('detectedNumbers');

  chrome.storage.local.get(["clickCount"], (result) => {
    const count = result.clickCount || 0;
    if (count > 0) {
      updateStatus(`Button clicked ${count} times`);
    }
  });

  // Load monitored prompt
  loadMonitoredPrompt();

  // Button click handler
  actionBtn.addEventListener('click', () => {
    // Get current count
    chrome.storage.local.get(['clickCount'], (result) => {
      const newCount = (result.clickCount || 0) + 1;
      chrome.storage.local.set({ clickCount: newCount }, () => {
        updateStatus(`Button clicked ${newCount} time${newCount !== 1 ? "s" : ""}`);
      });
    });

    const promptPayload = `Extension button triggered at ${new Date().toISOString()}`;
    chrome.runtime.sendMessage(
      {
        action: "buttonClicked",
        prompt: promptPayload
      },
      (response) => {
        if (chrome.runtime.lastError) {
          updateStatus("Backend connection failed. See console for details.", true);
          console.error("Extension -> backend error", chrome.runtime.lastError);
          return;
        }

        if (response?.success) {
          const result = response.result || {};
          const statusMsg = `Backend decision: ${result.allowed ? "Allowed" : "Blocked"} via ${result.provider}`;
          updateStatus(statusMsg);
        } else {
          updateStatus(response?.error || "Backend request failed.", true);
        }
      }
    );
  });

  dbStatusBtn.addEventListener('click', () => {
    dbStatus.textContent = 'Checking...';
    chrome.runtime.sendMessage({ action: 'checkDbStatus' }, (response) => {
      if (response?.success) {
        dbStatus.textContent = `MongoDB connection: ${response.status}`;
      } else {
        dbStatus.textContent = 'Unable to reach backend.';
      }
    });
  });
});

// Load the monitored prompt from background script
function loadMonitoredPrompt() {
  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.runtime.sendMessage({ 
        action: 'getMonitoredPrompt',
        tabId: tabs[0].id
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting prompt:', chrome.runtime.lastError);
          return;
        }

        if (response && response.success && response.prompt) {
          // Display the prompt
          promptContent.textContent = response.prompt;
          const length = response.promptLength || response.prompt.length;
          const timestamp = response.timestamp ? new Date(response.timestamp).toLocaleTimeString() : 'Just now';
          promptInfo.textContent = `${length} characters • ${timestamp}`;
          
          // Display 12-digit number detection
          if (response.has12DigitNumber && response.detectedNumbers && response.detectedNumbers.length > 0) {
            displayDetectedNumbers(response.detectedNumbers);
          } else {
            hideDetectedNumbers();
          }
          
          promptMonitor.style.display = 'block';
        } else {
          promptMonitor.style.display = 'none';
          hideDetectedNumbers();
        }
      });
    }
  });
}

function updateStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.classList.add('show');
}

// Display detected 12-digit numbers
function displayDetectedNumbers(numbers) {
  if (!numbers || numbers.length === 0) {
    hideDetectedNumbers();
    return;
  }
  
  detectedNumbers.innerHTML = '';
  numbers.forEach((number, index) => {
    const numberItem = document.createElement('div');
    numberItem.className = 'number-item';
    numberItem.textContent = `${index + 1}. ${number}`;
    detectedNumbers.appendChild(numberItem);
  });
  
  detectionAlert.style.display = 'block';
  detectionAlert.classList.add('show');
}

// Hide detected numbers alert
function hideDetectedNumbers() {
  detectionAlert.style.display = 'none';
  detectionAlert.classList.remove('show');
  detectedNumbers.innerHTML = '';
}

