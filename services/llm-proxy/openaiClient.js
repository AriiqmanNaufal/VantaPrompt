// Placeholder OpenAI proxy client
function sendToOpenAI(payload) {
  return Promise.resolve({ provider: "openai", payload });
}

module.exports = { sendToOpenAI };
