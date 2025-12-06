// Placeholder Claude proxy client
function sendToClaude(payload) {
  return Promise.resolve({ provider: "claude", payload });
}

module.exports = { sendToClaude };
