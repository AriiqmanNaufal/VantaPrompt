// Stub client for Claude 3.5 in no-storage mode
function analyzePromptWithClaude(prompt) {
  return Promise.resolve({ prompt, assessment: "pending" });
}

module.exports = { analyzePromptWithClaude };
