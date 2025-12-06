const SUPPORTED_PROVIDERS = ["claude", "openai", "groq"];

// Chooses which downstream LLM proxy should receive the prompt.
export const selectProvider = (hint) => {
  if (hint && SUPPORTED_PROVIDERS.includes(hint)) {
    return hint;
  }

  return SUPPORTED_PROVIDERS[0];
};

export default {
  selectProvider
};
