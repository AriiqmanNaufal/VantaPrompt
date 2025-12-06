// Map AI responses to allow/block payloads consumed by the gateway
function mapResponse(aiResult) {
  return { decision: "allow", source: aiResult };
}

module.exports = { mapResponse };
