// Simple logger abstraction to keep console usage centralized for future upgrades.
export const logEvent = (message, context = {}) => {
  const suffix = Object.keys(context).length ? ` ${JSON.stringify(context)}` : "";
  console.log(`[VantaPrompt] ${message}${suffix}`);
};

export default {
  logEvent
};
