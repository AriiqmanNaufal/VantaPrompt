import WarningLog from "../models/WarningLog.js";

export async function logWarning(req, res) {
  try {
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",").shift()?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const body = {
      workstation: req.body.workstation || "unknown",
      source: req.body.source || "unknown",
      matches: req.body.matches || [],
      fragments: req.body.fragments || [],
      severity: req.body.severity || "critical",
      allowed: !!req.body.allowed,
      actionTaken: req.body.actionTaken || "masked",
      originalJson: req.body.originalJson || {},
      ipAddress,
    };
    await WarningLog.create(body);
    res.json({ success: true });
  } catch (error) {
    console.error("VantaPrompt: Unable to log warning", error);
    res.status(500).json({ success: false, message: "Unable to log warning" });
  }
}

