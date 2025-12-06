import WarningLog from "../models/WarningLog.js";

const normalizeSeverity = (value) => {
  if (value === null || value === undefined) {
    return "critical";
  }

  const normalized = String(value).trim().toLowerCase();
  if (["critical", "crit", "4"].includes(normalized)) return "critical";
  if (["high", "3"].includes(normalized)) return "high";
  if (["medium", "med", "2"].includes(normalized)) return "medium";
  if (["low", "1", "0"].includes(normalized)) return "low";
  return "critical";
};

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

const sanitizeFragments = (fragments) => {
  return ensureArray(fragments)
    .map((fragment) => ({
      type: fragment?.type || fragment?.category || "PII",
      fragment: fragment?.fragment || fragment?.value || "",
      severity: fragment?.severity || fragment?.level || null,
      fragmentHash: fragment?.fragmentHash
    }))
    .filter((fragment) => fragment.fragment);
};

const dedupeStrings = (values) => {
  const output = new Set();
  ensureArray(values).forEach((value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        output.add(trimmed);
      }
    }
  });
  return Array.from(output);
};

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
      timestamp
    };

    const created = await WarningLog.create(warning);

    res.status(201).json({
      success: true,
      id: created._id,
      normalizedSeverity: created.normalizedSeverity
    });
  } catch (error) {
    console.error("VantaPrompt: Unable to log warning", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to log warning", error: error.message });
  }
}
