importScripts("config.js");

const backgroundConfig = self.VANTAPROMPT_CONFIG || {};

const statusEndpoint = backgroundConfig.apiBaseUrl
  ? `${backgroundConfig.apiBaseUrl}${backgroundConfig.endpoints.status}`
  : null;
const validateEndpoint = backgroundConfig.apiBaseUrl
  ? `${backgroundConfig.apiBaseUrl}${backgroundConfig.endpoints.validatePrompt}`
  : null;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": backgroundConfig.apiKey || ""
});

const pingBackendStatus = async () => {
  if (!statusEndpoint) {
    console.warn("Backend API base URL not configured for the extension.");
    return;
  }

  try {
    const response = await fetch(statusEndpoint);
    const data = await response.json();
    console.log("VantaPrompt backend status:", data);
  } catch (error) {
    console.error("Unable to reach VantaPrompt backend status endpoint.", error);
  }
};

const forwardPromptToBackend = async (prompt) => {
  if (!validateEndpoint) {
    throw new Error("Backend validate endpoint not configured.");
  }

  const response = await fetch(validateEndpoint, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      prompt,
      metadata: {
        source: "extension-popup",
        triggeredAt: new Date().toISOString()
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return response.json();
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("VantaPrompt Extension installed");
  pingBackendStatus();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "buttonClicked") {
    forwardPromptToBackend(request.prompt)
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => {
        console.error("Backend validation failed", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab updated:", tab.url);
  }
});

