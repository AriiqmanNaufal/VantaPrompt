import crypto from "crypto";
import { DlpEvent } from "../models/DlpEvent.js";
import WarningLog from "../models/WarningLog.js";
import { analyzePrompt } from "../utils/promptAnalyzer.js";
import { loadRegexDefinitions } from "../services/regexDefinitionService.js";

const severityActionMap = {
  low: { allowed: true, actionTaken: "allowed" },
  medium: { allowed: false, actionTaken: "manual_review" },
  high: { allowed: false, actionTaken: "blocked" },
  critical: { allowed: false, actionTaken: "blocked" }
};

const hashPrompt = (prompt) => {
  return crypto.createHash("sha256").update(prompt).digest("hex");
};

export const checkPrompt = async (req, res, next) => {
  try {
    const prompt = req.prompt ?? "";
    const workspaceId = req.workspaceId;
    const userId = req.userId;
    const source = req.body?.source || req.headers["x-client-source"] || "web";
    const modelUsed = req.body?.modelUsed;
    const latencyMs = Number(req.body?.latencyMs);

    const regexDefinitions = await loadRegexDefinitions();
    const { redactedText, detectedTypes, findings, highestSeverity, fragments } = analyzePrompt(
      prompt,
      regexDefinitions
    );
    const decision = severityActionMap[highestSeverity] || severityActionMap.low;

    const eventPayload = {
      workspaceId,
      userId,
      originalHash: hashPrompt(prompt),
      redactedText,
      detectedTypes,
      findings,
      severity: highestSeverity,
      allowed: decision.allowed,
      actionTaken: decision.actionTaken,
      source,
      modelUsed,
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : undefined,
      timestamp: new Date()
    };

    const createdEvent = await DlpEvent.create(eventPayload);

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",").shift()?.trim() ||
      req.socket?.remoteAddress ||
      "";

    const maskedFragments = fragments.map((fragment) => ({
      type: fragment.type,
      severity: fragment.severity || highestSeverity,
      fragmentHash: fragment.fragmentHash,
    }));

    const originalJson = {
      redactedText,
      detectedTypes,
      findings
    };

    await WarningLog.create({
      workspaceId,
      userId,
      workstation: req.headers["user-agent"],
      source,
      promptHash: eventPayload.originalHash,
      matches: detectedTypes,
      detectedTypes,
      fragments: maskedFragments,
      severity: highestSeverity,
      allowed: decision.allowed,
      actionTaken: decision.actionTaken,
      sanitizedPrompt: redactedText,
      originalJsonHash: hashPrompt(JSON.stringify(originalJson)),
      ipAddress
    });

    return res.json({
      allowed: decision.allowed,
      severity: highestSeverity,
      actionTaken: decision.actionTaken,
      detectedTypes,
      redactedText,
      eventId: createdEvent._id,
      message: decision.allowed
        ? "Prompt cleared by DLP guardrails."
        : "Prompt requires intervention per workspace policy."
    });
  } catch (error) {
    return next(error);
  }
};
