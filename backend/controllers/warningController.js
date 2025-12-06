import WarningLog from "../models/WarningLog.js";
import LlmResult from "../models/LlmResult.js";
import { evaluateLayerTwoRisk } from "../services/layerTwoEvaluator.js";

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
    .filter((fragment) => fragment.fragmentHash || fragment.fragment);
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

    const fragments = sanitizeFragments(req.body.fragments);
    const detectedTypesFromFragments = fragments.map((fragment) => fragment.type).filter(Boolean);
    const matches = dedupeStrings(req.body.matches);
    const detectedTypes = dedupeStrings(
      (req.body.detectedTypes || []).concat(detectedTypesFromFragments)
    );
    const normalizedSeverity = normalizeSeverity(req.body.severity);

    const warning = {
      workspaceId: req.body.workspaceId || "",
      userId: req.body.userId || "",
      workstation: req.body.workstation || req.headers["user-agent"] || "unknown",
      source: req.body.source || "unknown",
      promptHash: req.body.promptHash || "",
      sanitizedPrompt: req.body.sanitizedPrompt || "",
      severity: normalizedSeverity,
      allowed: Boolean(req.body.allowed),
      actionTaken: req.body.actionTaken || "masked",
      detectedTypes,
      fragments,
      ipAddress,
      originalJsonHash: req.body.originalJsonHash || "",
      matches
    };

    const created = await WarningLog.create(warning);
    let layerTwoDecision = null;
    try {
      layerTwoDecision = await evaluateLayerTwoRisk({
        sanitizedPrompt: warning.sanitizedPrompt,
        severity: normalizedSeverity,
        detectedTypes
      });

      if (layerTwoDecision) {
        await LlmResult.findOneAndUpdate(
          { warningLogId: created._id },
          {
            warningLogId: created._id,
            ...layerTwoDecision,
            severity: normalizedSeverity,
            sanitizedPrompt: warning.sanitizedPrompt,
            detectedTypes,
            metadata: {
              actionTaken: warning.actionTaken,
              source: warning.source,
              provider: layerTwoDecision.provider || "unknown"
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } catch (evalError) {
      console.error("VantaPrompt: Unable to persist Layer 2 result", evalError);
    }

    res.status(201).json({
      success: true,
      id: created._id,
      layerTwoDecision
    });
  } catch (error) {
    console.error("VantaPrompt: Unable to log warning", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to log warning", error: error.message });
  }
}
