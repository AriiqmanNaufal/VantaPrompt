exports.selectProvider = (hint) => {
  // Decide which LLM provider should handle a safe prompt
  return hint || "claude";
};
