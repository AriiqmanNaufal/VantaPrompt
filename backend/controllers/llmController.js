import { selectProvider } from "../utils/llmSwitch.js";
import { logEvent } from "../utils/logger.js";

// Responsible for forwarding safe prompts to the eventual LLM proxy service.
export const sendToLLM = (req, res) => {
  const provider = selectProvider(req.body?.providerHint);

  // TODO: replace logging-only stub with proxy call + response handling
  logEvent(`LLM forwarding stub invoked for provider ${provider}`);

  return res.json({
    status: "queued",
    provider,
    message: "Prompt forwarding stub: no external LLM invoked yet.",
    promptPreview: req.prompt?.slice(0, 100) ?? ""
  });
};
