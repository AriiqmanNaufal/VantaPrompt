// Popup script
const popupConfig = window.VANTAPROMPT_CONFIG || {};

document.addEventListener("DOMContentLoaded", () => {
  const actionBtn = document.getElementById("actionBtn");

  chrome.storage.local.get(["clickCount"], (result) => {
    const count = result.clickCount || 0;
    if (count > 0) {
      updateStatus(`Button clicked ${count} times`);
    }
  });

  actionBtn.addEventListener("click", () => {
    chrome.storage.local.get(["clickCount"], (result) => {
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

  if (popupConfig.apiBaseUrl) {
    updateStatus(`Connected to ${popupConfig.apiBaseUrl}`, false);
  }
});

function updateStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.classList.add("show");
  if (isError) {
    status.classList.add("error");
  } else {
    status.classList.remove("error");
  }
}

