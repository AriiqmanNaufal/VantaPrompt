const BACKEND_BASE = "http://localhost:5000";

// Background service worker (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  // Silent installation
});

// Store monitored prompts
const monitoredPrompts = new Map(); // tabId -> { prompt, timestamp, length }

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'buttonClicked') {
    console.log('Button clicked in popup');
    sendResponse({ success: true, message: 'Action received' });
  } else if (request.action === 'chatgptDetected' || request.action === 'aiPlatformDetected') {
    // Set badge to indicate AI platform was detected (silent)
    if (sender.tab) {
      chrome.action.setBadgeText({
        text: '!',
        tabId: sender.tab.id
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: sender.tab.id
      });
    }
    sendResponse({ success: true });
  } else if (request.action === 'highlightExtension') {
    // Flash the badge to draw attention
    if (sender.tab) {
      chrome.action.setBadgeText({
        text: '!',
        tabId: sender.tab.id
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#FF5722',
        tabId: sender.tab.id
      });
    }
    sendResponse({ success: true });
  } else if (request.action === 'promptChanged') {
    // Handle prompt monitoring
    if (sender.tab) {
      const tabId = sender.tab.id;
      monitoredPrompts.set(tabId, {
        prompt: request.prompt,
        promptLength: request.promptLength,
        timestamp: request.timestamp,
        url: request.url,
        has12DigitNumber: request.has12DigitNumber || false,
        detectedNumbers: request.detectedNumbers || []
      });

      // Update badge with prompt length indicator or warning for 12-digit numbers
      if (request.has12DigitNumber && request.detectedNumbers && request.detectedNumbers.length > 0) {
        // Show warning badge when 12-digit numbers detected
        chrome.action.setBadgeText({
          text: '!',
          tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#FF5722',
          tabId: tabId
        });
      } else if (request.promptLength > 0) {
        chrome.action.setBadgeText({
          text: String(request.promptLength > 999 ? '999+' : request.promptLength),
          tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#2196F3',
          tabId: tabId
        });
      } else {
        chrome.action.setBadgeText({
          text: '!',
          tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#4CAF50',
          tabId: tabId
        });
      }

      // Silent update - no logging unless there's an error
    }
    sendResponse({ success: true });
  } else if (request.action === 'getMonitoredPrompt') {
    // Get the latest monitored prompt for a tab
    const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
    if (tabId) {
      const promptData = monitoredPrompts.get(tabId);
      sendResponse({ 
        success: true, 
        prompt: promptData?.prompt || '',
        promptLength: promptData?.promptLength || 0,
        timestamp: promptData?.timestamp || null,
        has12DigitNumber: promptData?.has12DigitNumber || false,
        detectedNumbers: promptData?.detectedNumbers || []
      });
    } else {
      sendResponse({ success: false, error: 'No tab information' });
    }
  } else if (request.action === 'checkDbStatus') {
    fetch(`${BACKEND_BASE}/dlp/db-status`)
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, status: data.status }))
      .catch((err) => {
        console.error("VantaPrompt: DB status fetch failed", err);
        sendResponse({ success: false });
      });
    return true;
  } else if (request.action === "logWarning") {
    fetch(`${BACKEND_BASE}/dlp/logWarning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workstation: navigator.userAgent,
        source: request.source || "unknown",
        matches: request.matches || [],
        fragments: request.fragments || [],
        severity: request.severity || "critical",
        actionTaken: request.actionTaken || "masked",
        originalJson: request.original || {},
      }),
    }).catch((err) => console.error("VantaPrompt: logWarning failed", err));
    sendResponse({ success: true });
    return true;
  }
  return true; // Keep the message channel open for async response
});

// Helper function to check if domain is a supported AI platform
function isSupportedAIPlatform(hostname) {
  // ChatGPT
  if (hostname === 'www.chatgpt.com' || 
      hostname === 'chatgpt.com' || 
      hostname.endsWith('.chatgpt.com') ||
      hostname === 'chat.openai.com' ||
      hostname.endsWith('.openai.com')) {
    return true;
  }
  
  // Claude
  if (hostname === 'claude.ai' || 
      hostname === 'www.claude.ai' ||
      hostname.endsWith('.claude.ai')) {
    return true;
  }
  
  // NotesGPT
  if (hostname === 'notegpt.io' || 
      hostname === 'www.notegpt.io' ||
      hostname.endsWith('.notegpt.io')) {
    return true;
  }
  
  // Gemini (Google)
  if (hostname === 'gemini.google.com' || 
      hostname === 'bard.google.com' ||
      (hostname.includes('gemini') && hostname.endsWith('.google.com'))) {
    return true;
  }
  
  return false;
}

// Listen for tab updates to detect AI platform navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    
    // Check if it's a supported AI platform
    if (isSupportedAIPlatform(hostname)) {
      // Set badge (silent)
      chrome.action.setBadgeText({
        text: '!',
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tabId
      });
    } else {
      // Clear badge and stored prompt for non-AI platform sites
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
      monitoredPrompts.delete(tabId);
    }
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  monitoredPrompts.delete(tabId);
});
