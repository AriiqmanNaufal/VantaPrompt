import WarningLog from "../models/WarningLog.js";

export async function logWarning(req, res) {
  try {
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",").shift()?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const fragments = req.body.fragments || [];
    const body = {
      workstation: req.body.workstation || req.headers["user-agent"] || "unknown",
      source: req.body.source || "unknown",
      promptHash: req.body.promptHash || "",
      sanitizedPrompt: req.body.sanitizedPrompt || "",
      matches: req.body.matches || [],
      detectedTypes: fragments.map((f) => f.type).filter(Boolean),
      fragments,
      severity: req.body.severity || "critical",
      allowed: !!req.body.allowed,
      actionTaken: req.body.actionTaken || "masked",
      originalJsonHash: req.body.originalJsonHash || "",
      ipAddress,
    };
    await WarningLog.create(body);
    res.json({ success: true });
  } catch (error) {
    console.error("VantaPrompt: Unable to log warning", error);
    res.status(500).json({ success: false, message: "Unable to log warning" });
  }
}
