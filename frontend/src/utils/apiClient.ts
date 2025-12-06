const API_BASE = "/api";

export const apiClient = {
  async checkPrompt(prompt: string) {
    // Placeholder for server call to DLP endpoint
    return fetch(`${API_BASE}/dlp/check`, { method: "POST", body: JSON.stringify({ prompt }) });
  },
  async sendToLlm(payload: unknown) {
    // Placeholder call for forwarding prompts to the backend
    return fetch(`${API_BASE}/llm/send`, { method: "POST", body: JSON.stringify(payload) });
  }
};
