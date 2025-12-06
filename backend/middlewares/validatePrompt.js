// Lightweight guard that ensures prompt payloads exist before controller logic runs.
export const validatePrompt = (req, res, next) => {
  const prompt = req.body?.prompt;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Prompt is required for this operation."
    });
  }

  req.prompt = prompt.trim();
  return next();
};
