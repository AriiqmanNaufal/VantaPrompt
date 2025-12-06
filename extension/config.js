// Shared configuration for communicating with the VantaPrompt backend.
const VANTAPROMPT_CONFIG = {
  apiBaseUrl: "http://localhost:5000",
  apiKey: "dev-key", // Update to match backend API_KEY in production
  endpoints: {
    status: "/extension/status",
    validatePrompt: "/extension/validatePrompt"
  }
};

if (typeof window !== "undefined") {
  window.VANTAPROMPT_CONFIG = VANTAPROMPT_CONFIG;
}

if (typeof self !== "undefined") {
  self.VANTAPROMPT_CONFIG = VANTAPROMPT_CONFIG;
}
