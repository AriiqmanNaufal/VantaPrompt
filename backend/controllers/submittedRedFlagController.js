import SubmittedRedFlag from "../models/SubmittedRedFlag.js";
import WarningLog from "../models/WarningLog.js";

export const normalizeRedFlagSeverity = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (["low", "medium", "high", "critical"].includes(normalized)) {
    return normalized === "critical" ? "high" : normalized;
  }
  if (["3", "high"].includes(normalized)) {
    return "high";
  }
  if (["2", "medium", "med"].includes(normalized)) {
    return "medium";
  }
  if (["1", "low"].includes(normalized)) {
    return "low";
  }
  return "high";
};

export const dedupeDetectedTypes = (values) => {
  const unique = new Set();
  (Array.isArray(values) ? values : [values]).forEach((value) => {
    if (typeof value === "string" && value.trim().length > 0) {
      unique.add(value.trim());
    }
  });
  return Array.from(unique);
};

export async function logSubmittedRedFlag(req, res) {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) {
      return res.status(400).json({ success: false, message: "prompt is required" });
    }

    const detectedTypes = dedupeDetectedTypes(req.body?.detectedTypes || []);
    const matches = dedupeDetectedTypes(req.body?.matches || []);
    const severity = normalizeRedFlagSeverity(req.body?.severity);
    const submittedAtRaw = req.body?.submittedAt ? new Date(req.body.submittedAt) : new Date();
    const submittedAt = Number.isNaN(submittedAtRaw.valueOf()) ? new Date() : submittedAtRaw;
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",").shift()?.trim() ||
      req.socket?.remoteAddress ||
      "";

    const created = await SubmittedRedFlag.create({
      prompt,
      detectedTypes,
      matches,
      severity,
      source: req.body?.source || "unknown",
      url: req.body?.url || "",
      workstation: req.body?.workstation || req.headers["user-agent"] || "unknown",
      metadata: req.body?.metadata || {},
      submittedAt,
      ipAddress,
      warningLogId: req.body?.warningLogId || null
    });

    return res.status(201).json({ success: true, id: created._id });
  } catch (error) {
    console.error("VantaPrompt: Unable to log submitted red flag", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to log submitted red flag", error: error.message });
  }
}

export default {
  logSubmittedRedFlag
};

export async function logPromptSubmission(req, res) {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const promptHash = typeof req.body?.promptHash === "string" ? req.body.promptHash.trim() : "";
    if (!prompt || !promptHash) {
      return res.status(400).json({ success: false, message: "prompt and promptHash are required" });
    }

    const matches = dedupeDetectedTypes(req.body?.matches || []);

    let warning = null;
    if (promptHash) {
      warning = await WarningLog.findOne({ promptHash }).sort({ createdAt: -1 }).lean();
    }
    if (!warning && matches.length) {
      warning = await WarningLog.findOne({ matches: { $in: matches } })
        .sort({ createdAt: -1 })
        .lean();
    }
    if (!warning) {
      return res.status(202).json({
        success: false,
        message: "No matching sensitive warning found for submitted prompt"
      });
    }

    const existing = await SubmittedRedFlag.findOne({ warningLogId: warning._id });
    if (existing) {
      return res.json({
        success: true,
        id: existing._id,
        warningLogId: warning._id,
        duplicate: true
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",").shift()?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const submittedAtRaw = req.body?.submittedAt ? new Date(req.body.submittedAt) : new Date();
    const submittedAt = Number.isNaN(submittedAtRaw.valueOf()) ? new Date() : submittedAtRaw;

    const metadata = {
      compareSource: "prompt_hash",
      ...(req.body?.metadata || {})
    };

    const created = await SubmittedRedFlag.create({
      warningLogId: warning._id,
      prompt,
      detectedTypes: warning.detectedTypes || [],
      matches: warning.matches || matches,
      severity: warning.severity || "high",
      source: req.body?.source || warning.source || "unknown",
      url: req.body?.url || "",
      workstation: req.body?.workstation || warning.workstation,
      metadata,
      submittedAt,
      ipAddress
    });

    return res.status(201).json({
      success: true,
      id: created._id,
      warningLogId: warning._id
    });
  } catch (error) {
    console.error("VantaPrompt: Unable to log prompt submission red flag", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log prompt submission red flag",
      error: error.message
    });
  }
}
