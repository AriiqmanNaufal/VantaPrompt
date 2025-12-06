// Background service worker (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('VantaPrompt Extension installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'buttonClicked') {
    console.log('Button clicked in popup');
    sendResponse({ success: true, message: 'Action received' });
  }
  return true; // Keep the message channel open for async response
});

// Example: Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

