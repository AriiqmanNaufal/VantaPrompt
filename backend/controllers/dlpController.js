// Controllers hold business logic that will eventually orchestrate the DLP agent.
export const checkPrompt = (req, res) => {
  const prompt = req.prompt ?? req.body?.prompt ?? "";

  // TODO: integrate rules engine + Claude agent before returning real verdicts
  return res.json({
    allowed: true,
    message: "DLP evaluation stub: all prompts currently allowed.",
    promptPreview: prompt.slice(0, 100)
  });
};
