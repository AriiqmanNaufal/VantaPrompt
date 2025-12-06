// Bootstrap for proxying prompts to the selected LLM provider
function forwardPrompt(prompt, provider) {
  // TODO: delegate to claude/openai/groq clients based on provider
  return Promise.resolve({ provider, prompt });
}

module.exports = { forwardPrompt };
