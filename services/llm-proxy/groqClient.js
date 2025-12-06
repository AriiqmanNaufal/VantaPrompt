// Placeholder Groq proxy client
function sendToGroq(payload) {
  return Promise.resolve({ provider: "groq", payload });
}

module.exports = { sendToGroq };
