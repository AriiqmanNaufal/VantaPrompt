// Validates prompt payloads and enforces workspace scoping on write operations.
export const validatePrompt = (req, res, next) => {
  const prompt = req.body?.prompt;
  const workspaceId = req.body?.workspaceId || req.headers["x-workspace-id"];
  const userId = req.body?.userId || req.headers["x-user-id"];

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Prompt is required for this operation."
    });
  }

  if (typeof workspaceId !== "string" || !workspaceId.trim()) {
    return res.status(400).json({
      error: "workspaceId is required"
    });
  }

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({
      error: "userId is required"
    });
  }

  req.prompt = prompt.trim();
  req.workspaceId = workspaceId.trim();
  req.userId = userId.trim();
  return next();
};
