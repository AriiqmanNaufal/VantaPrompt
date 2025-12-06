// Content script - runs in the context of web pages
// VantaPrompt extension content script loaded (silent)

// Check if current page is a supported AI platform
function isSupportedAIPlatform() {
  const hostname = window.location.hostname;
  
  // ChatGPT
  if (hostname === 'www.chatgpt.com' || 
      hostname === 'chatgpt.com' || 
      hostname.endsWith('.chatgpt.com') ||
      hostname === 'chat.openai.com' ||
      hostname.endsWith('.openai.com')) {
    return { supported: true, platform: 'ChatGPT' };
  }
  
  // Claude
  if (hostname === 'claude.ai' || 
      hostname === 'www.claude.ai' ||
      hostname.endsWith('.claude.ai')) {
    return { supported: true, platform: 'Claude' };
  }
  
  // NotesGPT
  if (hostname === 'notegpt.io' || 
      hostname === 'www.notegpt.io' ||
      hostname.endsWith('.notegpt.io')) {
    return { supported: true, platform: 'NotesGPT' };
  }
  
  // Gemini (Google)
  if (hostname === 'gemini.google.com' || 
      hostname === 'bard.google.com' ||
      hostname.includes('gemini') && hostname.endsWith('.google.com')) {
    return { supported: true, platform: 'Gemini' };
  }
  
  return { supported: false, platform: null };
}

// Legacy function for backward compatibility
function isChatGPTDomain() {
  return isSupportedAIPlatform().supported;
}

const BACKEND_API_BASE = "http://localhost:5000";
const REGEXES_ENDPOINT = `${BACKEND_API_BASE}/dlp/regexes`;

function isRuntimeAvailable() {
  return !!(chrome.runtime && chrome.runtime.id);
}

const DEFAULT_REGEX_CONFIG = [
  {
    type: "EMAIL",
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",
    flags: "gi",
    severity: "medium",
    description: "Email addresses",
  },
  {
    type: "PHONE",
    pattern: "\\b(?:(?:\\+?6?01[0-9])[-\\s]?[0-9]{6,8}|(?:\\+?65|0)?[679]\\d{7})\\b",
    flags: "ig",
    severity: "medium",
    description: "Malaysia/Singapore phone numbers",
  },
  {
    type: "UUID",
    pattern: "\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b",
    flags: "ig",
    severity: "high",
    description: "UUID/GUID",
  },
  {
    type: "API_KEY_GENERIC",
    pattern:
      "\\b(?:(?:api[-]?key)|(?:secret[-]?key))[:=]\\s*['\\\"]?[A-Za-z0-9\\-_]{16,}['\\\"]?\\b",
    flags: "ig",
    severity: "high",
    description: "Generic API keys",
  },
  {
    type: "AWS_KEY",
    pattern: "\\b(?:AKIA|ASIA)[A-Z0-9]{16}\\b",
    flags: "gi",
    severity: "high",
    description: "AWS-style access keys",
  },
  {
    type: "CREDIT_CARD",
    pattern:
      "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b",
    flags: "g",
    severity: "critical",
    description: "Major credit cards",
  },
  {
    type: "ACCOUNT_NUM",
    pattern: "\\b(?:\\d{8}|\\d{10,16})\\b",
    flags: "g",
    severity: "critical",
    description: "Generic financial account numbers",
  },
  {
    type: "SSN_US",
    pattern: "\\b\\d{3}-\\d{2}-\\d{4}\\b",
    flags: "g",
    severity: "critical",
    description: "US Social Security numbers",
  },
  {
    type: "MALAYSIA_IC",
    pattern: "\\b\\d{6}-\\d{2}-\\d{4}\\b",
    flags: "g",
    severity: "critical",
    description: "Malaysia IC with dashes",
  },
  {
    type: "MALAYSIA_IC_COMPACT",
    pattern: "\\b\\d{12}\\b",
    flags: "g",
    severity: "critical",
    description: "Malaysia IC without dashes",
    contextKeywords: ["IC", "NRIC", "MyKad", "identification", "ID", "no ic", "kad pengenalan"],
    priority: 1,
  },
  {
    type: "PASSPORT",
    pattern: "\\b[A-Z0-9]{6,10}\\b",
    flags: "gi",
    severity: "high",
    description: "Generic passport numbers",
    contextKeywords: ["passport", "passport no", "passport number", "passport ID", "passport holder"],
    priority: 1,
  },
  {
    type: "VIRTUAL_ACCOUNT",
    pattern: "\\b\\d{15,20}\\b",
    flags: "g",
    severity: "critical",
    description: "Virtual Account Numbers for FPX / DuitNow VA",
    contextKeywords: ["VA", "virtual account", "duitnow", "FPX va", "e-banking", "bank transfer"],
    priority: 2,
  },
  {
    type: "EWALLET_ACCOUNT",
    pattern: "\\b\\d{8,15}\\b",
    flags: "g",
    severity: "critical",
    description: "General e-wallet account identifiers",
    contextKeywords: ["ewallet", "wallet id", "touch n go", "boost", "grabpay", "duitnow id"],
    priority: 2,
  },
  {
    type: "SWIFT_BIC",
    pattern: "\\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\\b",
    flags: "gi",
    severity: "medium",
    description: "SWIFT/BIC financial institution codes",
    contextKeywords: ["SWIFT", "BIC", "bank code", "international transfer"],
    priority: 2,
  },
  {
    type: "IBAN",
    pattern: "\\b[A-Z]{2}\\d{2}[A-Z0-9]{11,30}\\b",
    flags: "gi",
    severity: "high",
    description: "International Bank Account Numbers",
    contextKeywords: ["IBAN", "international account", "SEPA", "EU transfer"],
    priority: 2,
  },
];
let runtimeRegexDefinitions = buildRegexDefinitions(DEFAULT_REGEX_CONFIG);
let regexLoadPromise = null;
const SENSITIVE_PAUSE_MS = 1500;
let sensitiveAlertTimer = null;
let pendingSensitiveDetails = null;
let lastAlertSignature = "";

function buildRegexDefinitions(list = []) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((entry) => {
      if (!entry || !entry.type || !entry.pattern) {
        return null;
      }
      return {
        type: entry.type,
        pattern: entry.pattern,
        flags: entry.flags || "g",
        severity: (entry.severity || "critical").toLowerCase(),
        description: entry.description || "",
        contextKeywords: Array.isArray(entry.contextKeywords) ? entry.contextKeywords : [],
        priority: typeof entry.priority === "number" ? entry.priority : Number(entry.priority) || 0,
      };
    })
    .filter(Boolean);
}

async function loadRemoteRegexDefinitions() {
  try {
    const response = await fetch(REGEXES_ENDPOINT, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to fetch regex definitions (${response.status})`);
    }
    const payload = await response.json();
    if (payload?.success && Array.isArray(payload.regexes) && payload.regexes.length > 0) {
      const remoteDefs = buildRegexDefinitions(payload.regexes);
      if (remoteDefs.length > 0) {
        runtimeRegexDefinitions = remoteDefs;
        console.log(
          "VantaPrompt: Loaded regex patterns from backend",
          runtimeRegexDefinitions.map((def) => def.type)
        );
      } else {
        console.warn("VantaPrompt: Remote regex response contained no valid entries");
      }
    }
  } catch (error) {
    console.error("VantaPrompt: Unable to load regex patterns from backend", error);
  }
}

async function refreshRegexDefinitions() {
  runtimeRegexDefinitions = buildRegexDefinitions(DEFAULT_REGEX_CONFIG);
  try {
    const response = await fetch(REGEXES_ENDPOINT, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to fetch regex definitions (${response.status})`);
    }
    const payload = await response.json();
    if (payload?.success && Array.isArray(payload.regexes) && payload.regexes.length > 0) {
      const remoteDefs = buildRegexDefinitions(payload.regexes);
      if (remoteDefs.length > 0) {
        runtimeRegexDefinitions = remoteDefs;
        console.log(
          "VantaPrompt: Loaded regex patterns from backend",
          runtimeRegexDefinitions.map((def) => def.type)
        );
      } else {
        console.warn("VantaPrompt: Remote regex response contained no valid entries");
      }
    }
  } catch (error) {
    console.error("VantaPrompt: Unable to load regex patterns from backend", error);
  }
}

function ensureRegexDefinitionsLoaded() {
  if (!regexLoadPromise) {
    regexLoadPromise = refreshRegexDefinitions();
  }
  return regexLoadPromise;
}

function startMonitoringWhenReady(delay = 0) {
  setTimeout(() => {
    refreshRegexDefinitions()
      .catch(() => {
        // Error already logged when loading
      })
      .finally(() => {
        startPromptMonitoring();
      });
  }, delay);
}

function findRegexDefinition(type) {
  return runtimeRegexDefinitions.find((def) => def.type === type);
}

function severityLevel(severity) {
  switch ((severity || "").toLowerCase()) {
    case "medium":
      return 2;
    case "high":
      return 3;
    case "critical":
      return 4;
    default:
      return 1;
  }
}

function highestSeverityString(fragments = []) {
  if (!fragments.length) {
    return "critical";
  }
  return fragments.reduce((current, fragment) => {
    if (
      severityLevel(fragment.severity) > severityLevel(current)
    ) {
      return fragment.severity;
    }
    return current;
  }, fragments[0].severity || "critical");
}

function sortFragmentsByPriority(fragments = []) {
  return [...fragments].sort((a, b) => {
    const toPriority = (entry) => {
      if (entry == null) return null;
      const parsed = Number(entry.priority);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const priorityA = toPriority(a);
    const priorityB = toPriority(b);

    if (priorityA !== null && priorityB !== null) {
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    } else if (priorityA !== null && priorityB === null) {
      // compare with severity when other fragment has no priority
      return severityLevel(b.severity) - severityLevel(a.severity);
    } else if (priorityA === null && priorityB !== null) {
      return severityLevel(b.severity) - severityLevel(a.severity);
    }

    return severityLevel(b.severity) - severityLevel(a.severity);
  });
}

ensureRegexDefinitionsLoaded();

function detect12DigitNumber(text = "") {
  if (!text) return [];
  const regex = /(\d{6}-\d{2}-\d{4}|\d{12})/g;
  const matches = text.match(regex);
  return matches || [];
}

function detectSensitiveFragments(text = "") {
  if (!text) return [];
  const findings = [];
  runtimeRegexDefinitions.forEach((def) => {
    if (!def.pattern || !def.type) return;
    const regex = new RegExp(def.pattern, def.flags || "g");
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        type: def.type,
        fragment: match[0],
        severity: def.severity || "critical",
        priority: typeof def.priority === "number" ? def.priority : Number(def.priority) || 9999,
      });
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
  });

  const phonePattern = findRegexDefinition("PHONE");
  const malaysiaPattern = findRegexDefinition("MALAYSIA_IC_COMPACT");

  return findings.filter((fragment) => {
    if (fragment.type !== "ACCOUNT_NUM") {
      return true;
    }
    if (phonePattern) {
      const phoneRegex = new RegExp(phonePattern.pattern, phonePattern.flags || "g");
      if (phoneRegex.test(fragment.fragment)) {
        return false;
      }
    }
    if (malaysiaPattern) {
      const malaysiaRegex = new RegExp(
        malaysiaPattern.pattern,
        malaysiaPattern.flags || "g"
      );
      if (malaysiaRegex.test(fragment.fragment)) {
        return false;
      }
    }
    return true;
  });
}

function has12DigitNumber(text = "") {
  return detect12DigitNumber(text).length > 0;
}

function maskSensitiveData(text = "", forcedType = null) {
  if (!text) return "";
  let masked = text;
  const fragments = detectSensitiveFragments(text);
  fragments.forEach(({ fragment, type }) => {
    if (!fragment) {
      return;
    }
    const placeholderType = forcedType || type || "SENSITIVE";
    const placeholder = `[${placeholderType}]`;
    masked = masked.split(fragment).join(placeholder);
  });
  return masked;
}

function replacePromptWithSanitizedText(maskedPrompt) {
  if (!promptMonitor || !maskedPrompt) {
    return;
  }

  if (promptMonitor.tagName === "TEXTAREA" || promptMonitor.tagName === "INPUT") {
    promptMonitor.value = maskedPrompt;
  } else if (promptMonitor.contentEditable === "true") {
    promptMonitor.textContent = maskedPrompt;
  }
  lastPromptValue = maskedPrompt;
}

async function hashFragment(value = "") {
  if (!value) {
    return "";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashFragments(list = []) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  const mapped = await Promise.all(
    list.map(async (fragment) => ({
      type: fragment.type,
      severity: fragment.severity,
      fragmentHash: await hashFragment(fragment.fragment),
    }))
  );
  return mapped;
}

function scheduleSensitiveAlert() {
  if (sensitiveAlertTimer) {
    clearTimeout(sensitiveAlertTimer);
  }
  sensitiveAlertTimer = setTimeout(() => {
    triggerSensitiveAlert();
  }, SENSITIVE_PAUSE_MS);
}

async function triggerSensitiveAlert() {
  if (!pendingSensitiveDetails) {
    return;
  }
  const signature = pendingSensitiveDetails.signature || "";
  if (signature && signature === lastAlertSignature) {
    pendingSensitiveDetails = null;
    return;
  }
  lastAlertSignature = signature;
  const summary = pendingSensitiveDetails.detectedTypes.length
    ? `Detected: ${pendingSensitiveDetails.detectedTypes.join(", ")} • Severity: ${pendingSensitiveDetails.severity}`
    : `Severity: ${pendingSensitiveDetails.severity}`;
  showSensitiveToast(pendingSensitiveDetails.maskedPrompt, summary);
  replacePromptWithSanitizedText(pendingSensitiveDetails.maskedPrompt);
  const hashedFragments = await hashFragments(pendingSensitiveDetails.fragments);
  console.warn("VantaPrompt: ⚠️ Sensitive data detected:", hashedFragments);
  sendSensitiveWarning({
    fragments: hashedFragments,
    severity: pendingSensitiveDetails.severity,
    detectedTypes: pendingSensitiveDetails.detectedTypes,
    matches: pendingSensitiveDetails.matches,
    prompt: pendingSensitiveDetails.prompt,
    sanitizedPrompt: pendingSensitiveDetails.maskedPrompt,
  });
  pendingSensitiveDetails = null;
  sensitiveAlertTimer = null;
}

async function sendSensitiveWarning(details = {}) {
  if (!isRuntimeAvailable()) {
    console.warn("VantaPrompt: Skipping logWarning because runtime context was invalidated");
    return;
  }
  try {
    const promptHash = await hashFragment(details.prompt || "");
    const originalJsonString = JSON.stringify({
      prompt: details.prompt || "",
      consoleMatches: details.fragments || [],
    });
    const originalJsonHash = await hashFragment(originalJsonString);
    chrome.runtime.sendMessage({
      action: "logWarning",
      matches: details.matches || [],
      fragments: details.fragments || [],
      severity: details.severity || "critical",
      detectedTypes: details.detectedTypes || [],
      source: isSupportedAIPlatform().platform,
      promptHash,
      sanitizedPrompt: details.sanitizedPrompt || "",
      actionTaken: "masked",
      allowed: false,
      originalJsonHash,
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("VantaPrompt: Error sending logWarning:", chrome.runtime.lastError);
      }
    });
  } catch (err) {
    console.error("VantaPrompt: logWarning send failed", err);
  }
}

// Create and show modal popup for AI platforms
function showAIPlatformModal() {
  // Check if modal already exists
  if (document.getElementById('vantaprompt-ai-modal')) {
    return;
  }

  const platformInfo = isSupportedAIPlatform();
  if (!platformInfo.supported) {
    return;
  }

  const platformName = platformInfo.platform;

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'vantaprompt-ai-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    text-align: center;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  modal.innerHTML = `
    <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">
      🎉 VantaPrompt Detected ${platformName}!
    </h2>
    <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.5;">
      You're visiting ${platformName}. Click the extension icon to open VantaPrompt!
    </p>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="vantaprompt-open-btn" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      ">Open Extension</button>
      <button id="vantaprompt-close-btn" style="
        background: #f5f5f5;
        color: #333;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      ">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Button handlers
  const openBtn = document.getElementById('vantaprompt-open-btn');
  const closeBtn = document.getElementById('vantaprompt-close-btn');

  openBtn.addEventListener('mouseenter', () => {
    openBtn.style.background = '#45a049';
  });
  openBtn.addEventListener('mouseleave', () => {
    openBtn.style.background = '#4CAF50';
  });

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#e0e0e0';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#f5f5f5';
  });

  // Open extension popup (user will need to click extension icon)
  openBtn.addEventListener('click', () => {
    // Send message to background to highlight extension icon
    chrome.runtime.sendMessage({ action: 'highlightExtension' });
    overlay.remove();
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Auto-close after 1 second if not clicked
  setTimeout(() => {
    if (document.getElementById('vantaprompt-ai-modal')) {
      // Auto-click the close button to trigger its handler
      closeBtn.click();
    }
  }, 1000);
}

// Legacy function for backward compatibility
function showChatGPTModal() {
  showAIPlatformModal();
}

// Initialize when DOM is ready
function init() {
  const platformInfo = isSupportedAIPlatform();
  if (platformInfo.supported) {
    // Wait a bit for page to fully load
    setTimeout(() => {
      showAIPlatformModal();
      refreshRegexDefinitions().catch(() => {});
      // Notify background script
      chrome.runtime.sendMessage({ 
        action: 'aiPlatformDetected',
        platform: platformInfo.platform,
        url: window.location.href 
      });
    }, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for navigation changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    const platformInfo = isSupportedAIPlatform();
    if (platformInfo.supported) {
      setTimeout(() => {
        showAIPlatformModal();
        refreshRegexDefinitions().catch(() => {});
        try {
          chrome.runtime.sendMessage({ 
            action: 'aiPlatformDetected',
            platform: platformInfo.platform,
            url: window.location.href 
          });
        } catch (err) {
          console.error('VantaPrompt: sendMessage failed (aiPlatformDetected)', err);
        }
      }, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Monitor ChatGPT prompt box
let promptMonitor = null;
let lastPromptValue = '';
let debounceTimer = null;
let sendButtonMonitor = null;
let lastLoggedPrompt = ''; // Prevent duplicate logging

// Find ChatGPT prompt textarea
function findChatGPTPromptBox() {
  // ChatGPT uses contenteditable divs, not textareas
  // Multiple selectors to find the ChatGPT input box
  const selectors = [
    // Contenteditable divs (ChatGPT's actual input)
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    '[contenteditable="true"]',
    // Textareas (fallback)
    'textarea[data-id="root"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="ChatGPT"]',
    'textarea[placeholder*="chat"]',
    'textarea[placeholder*="Send"]',
    'form textarea',
    'textarea[tabindex="0"]',
    '#prompt-textarea',
    'textarea'
  ];
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      
      for (const el of elements) {
        // Check if it's likely the main input (has reasonable size and is visible)
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
        
        // More lenient size check for contenteditable divs
        const minWidth = el.tagName === 'DIV' ? 100 : 200;
        const minHeight = el.tagName === 'DIV' ? 20 : 40;
        
        if (rect.width > minWidth && rect.height > minHeight && isVisible) {
          // Additional check: should be near bottom of page (ChatGPT input is at bottom)
          const isNearBottom = rect.top > window.innerHeight * 0.5;
          
          // Prefer contenteditable divs near bottom, but accept any valid match
          if (el.tagName === 'DIV' && el.contentEditable === 'true') {
            return el;
          } else if (el.tagName === 'TEXTAREA' && !isNearBottom) {
            // For textareas, prefer ones near bottom
            continue;
          } else {
            return el;
          }
        }
      }
    } catch (e) {
      // Silent error handling - no logging during periodic checks
    }
  }
  
  return null;
}

// Get current prompt value
function getCurrentPromptValue() {
  if (!promptMonitor) {
    return '';
  }
  
  if (promptMonitor.tagName === 'TEXTAREA') {
    return promptMonitor.value || '';
  } else if (promptMonitor.contentEditable === 'true') {
    // For contenteditable, get text content
    let currentValue = promptMonitor.textContent || promptMonitor.innerText || '';
    // Also check for any nested text nodes
    if (!currentValue) {
      const textNodes = [];
      const walker = document.createTreeWalker(
        promptMonitor,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node.textContent);
      }
      currentValue = textNodes.join('');
    }
    return currentValue;
  } else {
    return promptMonitor.value || promptMonitor.textContent || '';
  }
}

// Find ChatGPT send button
function findChatGPTSendButton() {
  // Multiple selectors to find the send button
  const selectors = [
    'button[data-testid*="send"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button[title*="Send"]',
    'button[title*="send"]',
    'button:has(svg)',
    'form button[type="submit"]',
    'button[class*="send"]',
    'button[class*="Send"]',
    // Look for buttons near the prompt box
    'button'
  ];

  // First, try to find button near the prompt box
  if (promptMonitor) {
    const form = promptMonitor.closest('form');
    if (form) {
      const formButtons = form.querySelectorAll('button');
      for (const btn of formButtons) {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        if (rect.width > 0 && rect.height > 0 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden') {
          // Check if it's likely a send button (has icon or specific text)
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          if (text.includes('send') || ariaLabel.includes('send') || 
              btn.querySelector('svg') || btn.getAttribute('data-testid')) {
            return btn;
          }
        }
      }
    }
    
    // Look for button in the same container
    const container = promptMonitor.closest('div[class*="input"]') || 
                      promptMonitor.closest('div[class*="form"]') ||
                      promptMonitor.parentElement;
    if (container) {
      const buttons = container.querySelectorAll('button');
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        if (rect.width > 0 && rect.height > 0 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden') {
          return btn;
        }
      }
    }
  }

  // Fallback: try all selectors
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         style.display !== 'none' && 
                         style.visibility !== 'hidden';
        
        if (isVisible) {
          // Prefer buttons that are likely send buttons
          const text = el.textContent?.toLowerCase() || '';
          const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
          const hasIcon = el.querySelector('svg');
          
          if (text.includes('send') || ariaLabel.includes('send') || 
              hasIcon || el.getAttribute('data-testid')) {
            return el;
          }
        }
      }
    } catch (e) {
      // Silent error handling
    }
  }
  
  return null;
}

// Monitor send button
function monitorSendButton() {
  const platformInfo = isSupportedAIPlatform();
  if (!platformInfo.supported) {
    return;
  }

  const sendButton = findChatGPTSendButton();
  
  if (sendButton && sendButton !== sendButtonMonitor) {
    // Remove old listener if any
    if (sendButtonMonitor) {
      sendButtonMonitor.removeEventListener('click', handleSendClick, true);
      sendButtonMonitor.removeEventListener('mousedown', handleSendClick, true);
    }

    sendButtonMonitor = sendButton;
    
    // Add multiple event listeners for better detection
    sendButtonMonitor.addEventListener('click', handleSendClick, { capture: true, passive: true });
    sendButtonMonitor.addEventListener('mousedown', handleSendClick, { capture: true, passive: true });
    
    console.log('VantaPrompt: Send button found and monitored');
  }
}

// Also listen for form submission as fallback
function setupFormSubmissionListener() {
  const platformInfo = isSupportedAIPlatform();
  if (!platformInfo.supported || !promptMonitor) {
    return;
  }

  const form = promptMonitor.closest('form');
  if (form && !form.hasAttribute('data-vantaprompt-listener')) {
    form.setAttribute('data-vantaprompt-listener', 'true');
    form.addEventListener('submit', (event) => {
      console.log('VantaPrompt: Form submission detected');
      handleSendClick(event);
    }, { capture: true, passive: true });
  }
}

// Handle send button click
function handleSendClick(event) {
  // Capture prompt immediately before it might be cleared
  let finalPrompt = getCurrentPromptValue();
  
  // If prompt is empty, use the last tracked value
  if (!finalPrompt || !finalPrompt.trim()) {
    finalPrompt = lastPromptValue || '';
  }
  
  // If still empty, try getting it again with a small delay
  if (!finalPrompt || !finalPrompt.trim()) {
    setTimeout(() => {
      const retryPrompt = getCurrentPromptValue() || lastPromptValue || '';
      if (retryPrompt && retryPrompt.trim()) {
        logFinalPrompt(retryPrompt);
      } else {
        // Last attempt - try after longer delay
        setTimeout(() => {
          const finalRetry = getCurrentPromptValue() || lastPromptValue || '';
          if (finalRetry && finalRetry.trim()) {
            logFinalPrompt(finalRetry);
          } else {
            console.warn('VantaPrompt: Could not capture final prompt');
          }
        }, 200);
      }
    }, 50);
  } else {
    // We have the prompt, log it immediately
    logFinalPrompt(finalPrompt);
  }
}

// Helper function to log final prompt
function logFinalPrompt(prompt) {
  if (prompt && prompt.trim() && prompt !== lastLoggedPrompt) {
    lastLoggedPrompt = prompt;
    
    const maskedPrompt = maskSensitiveData(prompt);

    // Detect 12-digit numbers in final prompt
    const detectedNumbers = detect12DigitNumber(prompt);
    
    console.log('VantaPrompt: Final prompt sent:', {
      prompt: maskedPrompt,
      length: prompt.length,
      has12DigitNumber: detectedNumbers.length > 0,
      detectedNumbers: detectedNumbers,
      timestamp: new Date().toISOString()
    });
    console.log('VantaPrompt: Full prompt text:', maskedPrompt);
    
    // Log warning if 12-digit numbers detected
    if (detectedNumbers.length > 0) {
      console.warn('VantaPrompt: ⚠️ 12-digit number(s) detected in prompt:', detectedNumbers);
    }
  }
}

// Toast/notification for sensitive data detection
function showSensitiveToast(maskedPrompt = "", summary = "") {
  let toast = document.getElementById("vantaprompt-sensitive-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "vantaprompt-sensitive-toast";
    toast.innerHTML = `
      <span style="font-size:18px;">⚠️</span>
      <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
        <strong style="font-size:14px;">VantaPrompt Alert</strong>
        <span id="vantaprompt-sensitive-summary" style="font-size:12px; color:#856404;">
          Sensitive data detected
        </span>
      </div>
      <div id="vantaprompt-sensitive-content" style="flex:1; font-family: 'Courier New', monospace;"></div>
      <button id="vantaprompt-sensitive-copy" class="toast-copy-btn">Copy masked prompt</button>
    `;
    document.body.appendChild(toast);
    if (!document.getElementById("vantaprompt-sensitive-toast-style")) {
      const style = document.createElement("style");
      style.id = "vantaprompt-sensitive-toast-style";
      style.textContent = `
        #vantaprompt-sensitive-toast {
          position: fixed; right: 32px; bottom: 32px;
          background: #fff3cd;
          color: #856404;
          padding: 18px 24px;
          border: 2px solid #ffc107;
          border-radius: 8px;
          min-width: 240px;
          box-shadow: 0 8px 24px 0 rgba(0,0,0,0.12);
          font-size: 14px;
          font-family: system-ui, sans-serif;
          z-index: 2147483647;
          display: flex; align-items: center; gap: 10px;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s, transform 0.3s;
          transform: translateY(40px);
        }
        #vantaprompt-sensitive-toast.show {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        #vantaprompt-sensitive-content {
          color: #212529;
          font-family: 'Courier New', monospace;
          display:inline-block;
          margin-left: 4px;
        }
        #vantaprompt-sensitive-toast .toast-copy-btn {
          border-radius: 4px;
          border: 1px solid #856404;
          background: #ffeeba;
          color: #856404;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }
  }

  const summaryEl = toast.querySelector("#vantaprompt-sensitive-summary");
  if (summaryEl && summary) {
    summaryEl.textContent = summary;
  }

  const content = toast.querySelector("#vantaprompt-sensitive-content");
  if (content) {
    content.textContent = maskedPrompt;
  }
  const copyButton = toast.querySelector("#vantaprompt-sensitive-copy");
  if (copyButton) {
    copyButton.disabled = false;
    copyButton.textContent = "Copy masked prompt";
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(maskedPrompt);
        copyButton.textContent = "Copied!";
        hideSensitiveToast();
      } catch (err) {
        copyButton.textContent = "Copy failed";
        console.error("VantaPrompt: Clipboard copy failed", err);
      }
    };
  }
  toast.classList.add("show");
  toast._vantapromptTimer && clearTimeout(toast._vantapromptTimer);
}

function hideSensitiveToast() {
  const toast = document.getElementById("vantaprompt-sensitive-toast");
  if (toast) {
    toast.classList.remove("show");
    toast._vantapromptTimer && clearTimeout(toast._vantapromptTimer);
  }
}

// Monitor prompt box changes
function monitorPromptBox() {
  const platformInfo = isSupportedAIPlatform();
  if (!platformInfo.supported) {
    return;
  }

  const promptBox = findChatGPTPromptBox();
  
  if (promptBox && promptBox !== promptMonitor) {
    // Remove old listeners if any
    if (promptMonitor) {
      promptMonitor.removeEventListener('input', handlePromptChange);
      promptMonitor.removeEventListener('keyup', handlePromptChange);
      promptMonitor.removeEventListener('keydown', handlePromptChange);
      promptMonitor.removeEventListener('paste', handlePromptChange);
      promptMonitor.removeEventListener('compositionupdate', handlePromptChange);
      
      // Remove document-level listener if exists
      if (promptMonitor._vantapromptKeyHandler) {
        document.removeEventListener('keydown', promptMonitor._vantapromptKeyHandler, true);
        delete promptMonitor._vantapromptKeyHandler;
      }
    }

    promptMonitor = promptBox;
    
    // Add event listeners - use capture phase for better detection
    const options = { capture: true, passive: true };
    promptMonitor.addEventListener('input', handlePromptChange, options);
    promptMonitor.addEventListener('keyup', handlePromptChange, options);
    
    // Enhanced Enter key detection for all platforms (especially Gemini)
    const handleKeyDown = (event) => {
      handlePromptChange(event);
      // Detect Enter key press (to send message) - check multiple ways
      const isEnter = event.key === 'Enter' || 
                      event.keyCode === 13 || 
                      event.which === 13;
      const isShiftEnter = event.shiftKey && isEnter;
      
      if (isEnter && !isShiftEnter) {
        console.log('VantaPrompt: Enter key detected (sending message)', {
          key: event.key,
          keyCode: event.keyCode,
          platform: isSupportedAIPlatform().platform
        });
        
        // Capture prompt immediately (synchronously) before it might be cleared
        const promptBeforeSend = getCurrentPromptValue() || lastPromptValue || '';
        if (promptBeforeSend && promptBeforeSend.trim()) {
          logFinalPrompt(promptBeforeSend);
        }
        
        // Also try after delays as fallback
        setTimeout(() => {
          handleSendClick(event);
        }, 50);
        setTimeout(() => {
          handleSendClick(event);
        }, 200);
      }
    };
    
    promptMonitor.addEventListener('keydown', handleKeyDown, options);
    promptMonitor.addEventListener('paste', handlePromptChange, options);
    promptMonitor.addEventListener('compositionupdate', handlePromptChange, options);
    
    // Also listen at document level as fallback for Gemini
    const documentKeyHandler = (event) => {
      // Only handle if focus is on the prompt box
      if (document.activeElement === promptMonitor || promptMonitor.contains(document.activeElement)) {
        const isEnter = event.key === 'Enter' || 
                        event.keyCode === 13 || 
                        event.which === 13;
        const isShiftEnter = event.shiftKey && isEnter;
        
        if (isEnter && !isShiftEnter) {
          console.log('VantaPrompt: Enter key detected at document level (sending message)');
          
          // Capture prompt immediately (synchronously) before it might be cleared
          const promptBeforeSend = getCurrentPromptValue() || lastPromptValue || '';
          if (promptBeforeSend && promptBeforeSend.trim()) {
            logFinalPrompt(promptBeforeSend);
          }
          
          // Also try after delays as fallback
          setTimeout(() => {
            handleSendClick(event);
          }, 50);
          setTimeout(() => {
            handleSendClick(event);
          }, 200);
        }
      }
    };
    
    // Add document-level listener with capture to catch it early
    document.addEventListener('keydown', documentKeyHandler, { capture: true, passive: true });
    
    // Store handler for cleanup
    promptMonitor._vantapromptKeyHandler = documentKeyHandler;
    
    // Setup form submission listener
    setupFormSubmissionListener();
    
    // For contenteditable divs, also listen to input events on the parent
    if (promptMonitor.contentEditable === 'true') {
      // Use MutationObserver as additional fallback for contenteditable
      const contentObserver = new MutationObserver(() => {
        handlePromptChange({ type: 'mutation' });
      });
      contentObserver.observe(promptMonitor, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    // Send initial value if exists (silently, no logging)
    const initialValue = promptMonitor.tagName === 'TEXTAREA' 
      ? promptMonitor.value 
      : (promptMonitor.textContent || promptMonitor.innerText || '');
    if (initialValue) {
      // Don't log initial value, only log when user types
      lastPromptValue = initialValue;
    }
  }
}

// Handle prompt changes with debouncing
function handlePromptChange(event) {
  if (!promptMonitor) {
    return;
  }

  // Only log for actual user typing events, not mutations or initial loads
  const isUserTyping = event && (
    event.type === 'input' || 
    event.type === 'keydown' || 
    event.type === 'keyup' || 
    event.type === 'paste' ||
    event.type === 'compositionupdate'
  );

  // Get current prompt value using helper function
  const currentValue = getCurrentPromptValue();
  
  // Detect 12-digit numbers immediately while typing
  if (currentValue && currentValue.length > 0) {
    const immediateDetection = detect12DigitNumber(currentValue);
    if (immediateDetection.length > 0) {
      console.warn('VantaPrompt: ⚠️ 12-digit number detected while typing:', immediateDetection);
    }
  }
  
  // Only log when user is actively typing
  if (isUserTyping) {
    console.log('VantaPrompt: User typing detected -', {
      length: currentValue.length,
      preview: currentValue.substring(0, 30) + (currentValue.length > 30 ? '...' : '')
    });
  }
  
  // Debounce to avoid too many messages
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (currentValue !== lastPromptValue) {
      // Detect if prompt was cleared (likely sent)
      if (lastPromptValue && !currentValue.trim() && currentValue.length === 0) {
        // Prompt was cleared - this likely means it was sent
        console.log('VantaPrompt: Final prompt sent (detected via clear):', {
          prompt: lastPromptValue,
          length: lastPromptValue.length,
          timestamp: new Date().toISOString()
        });
        console.log('VantaPrompt: Full prompt text:', lastPromptValue);
      }
      
      // Detect 12-digit numbers in the prompt
      const detectedNumbers = detect12DigitNumber(currentValue);
      const sensitiveFragments = detectSensitiveFragments(currentValue);
      const prioritizedFragments = sortFragmentsByPriority(sensitiveFragments);
      const severity = prioritizedFragments[0]?.severity || "critical";
      const detectedTypes = [
        ...new Set(prioritizedFragments.map((fragment) => fragment.type)),
      ];
      const uniqueMatches = [...new Set([...detectedNumbers, ...sensitiveFragments.map((f) => f.fragment)])];
      const highestType = prioritizedFragments[0]?.type || null;
      const maskedPrompt = maskSensitiveData(currentValue, highestType);
      if (sensitiveFragments.length > 0) {
        const signature = prioritizedFragments
          .map((fragment) => `${fragment.type}:${fragment.fragment}`)
          .join("|");
        pendingSensitiveDetails = {
          fragments: sensitiveFragments,
          severity,
          detectedTypes,
          prompt: currentValue,
          matches: uniqueMatches,
          maskedPrompt,
          signature,
        };
        scheduleSensitiveAlert();
      } else {
        if (sensitiveAlertTimer) {
          clearTimeout(sensitiveAlertTimer);
          sensitiveAlertTimer = null;
        }
        pendingSensitiveDetails = null;
        if (/\d/.test(currentValue) && currentValue.length > 10) {
          console.log(
            "VantaPrompt: No sensitive regex matches detected. Text contains digits but not in expected format."
          );
        }
      }

      lastPromptValue = currentValue;

      if (isRuntimeAvailable()) {
        try {
          chrome.runtime.sendMessage({
            action: "promptChanged",
            prompt: currentValue,
            promptLength: currentValue.length,
            has12DigitNumber: uniqueMatches.length > 0,
            detectedNumbers: uniqueMatches,
            sensitiveDetails: sensitiveFragments,
            url: window.location.href,
            timestamp: Date.now(),
          }, () => {
            if (chrome.runtime.lastError && isUserTyping) {
              console.error("VantaPrompt: Error sending prompt:", chrome.runtime.lastError);
            }
          });
        } catch (err) {
          console.error("VantaPrompt: sendMessage failed (promptChanged)", err);
        }
      } else if (isUserTyping) {
        console.warn("VantaPrompt: Skipping promptChanged message because runtime context was invalidated");
      }

    }
  }, 300); // 300ms debounce
}

// Start monitoring with MutationObserver to handle dynamic content
let monitoringObserver = null;
let monitoringInterval = null;

function startPromptMonitoring() {
  const platformInfo = isSupportedAIPlatform();
  if (!platformInfo.supported) {
    return;
  }

  // Try to find immediately
  monitorPromptBox();
  monitorSendButton();
  setupFormSubmissionListener();

  // Use MutationObserver to watch for DOM changes (ChatGPT is React-based)
  if (monitoringObserver) {
    monitoringObserver.disconnect();
  }
  
  monitoringObserver = new MutationObserver(() => {
    monitorPromptBox();
    monitorSendButton();
    setupFormSubmissionListener();
  });

  monitoringObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });

  // Also check periodically as fallback (more frequent)
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  monitoringInterval = setInterval(() => {
    const platformInfo = isSupportedAIPlatform();
    if (!platformInfo.supported) {
      if (monitoringInterval) clearInterval(monitoringInterval);
      if (monitoringObserver) monitoringObserver.disconnect();
      return;
    }
    monitorPromptBox();
    monitorSendButton();
    setupFormSubmissionListener();
  }, 1000); // Check every second

  // Silent initialization - no logging
}

// Initialize prompt monitoring when on supported AI platform
const platformInfo = isSupportedAIPlatform();
if (platformInfo.supported) {
  const scheduleMonitoring = (delay = 1000) => startMonitoringWhenReady(delay);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      scheduleMonitoring(1000);
    });
  } else {
    scheduleMonitoring(1000);
  }

  // Retry later in case React finishes later
  setTimeout(() => {
    const currentPlatformInfo = isSupportedAIPlatform();
    if (currentPlatformInfo.supported && !promptMonitor) {
      console.log("VantaPrompt: Retrying to find prompt box after delay...");
      scheduleMonitoring(0);
    }
  }, 3000);
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
  } else if (request.action === 'getCurrentPrompt') {
    // Return current prompt value
    const promptBox = findChatGPTPromptBox();
    const currentPrompt = promptBox ? (promptBox.value || promptBox.textContent || '') : '';
    sendResponse({ prompt: currentPrompt, success: true });
  }
  return true;
});
