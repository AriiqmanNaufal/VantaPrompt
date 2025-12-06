import { env } from "../config/env.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const SAFE_ALTERNATIVE_FALLBACK =
  "Ask general questions using anonymized placeholders or synthetic examples only.";
const PLACEHOLDER_REPLACE_REGEX = /\[[A-Z0-9_]+\]/g;
const PLACEHOLDER_TEST_REGEX = /\[[A-Z0-9_]+\]/i;
const SENSITIVE_KEYWORDS = [
  "account",
  "statement",
  "password",
  "pin",
  "token",
  "secret",
  "customer",
  "client",
  "transfer",
  "iban",
  "swift",
  "passport",
  "ic",
  "nric",
  "ssn",
  "balance",
  "transaction",
  "credit",
  "loan",
  "export",
  "list"
];
const SENSITIVE_TYPE_HINTS = new Set([
  "EMAIL",
  "PHONE",
  "ACCOUNT_NUM",
  "SSN_US",
  "MALAYSIA_IC",
  "MALAYSIA_IC_COMPACT",
  "PASSPORT",
  "VIRTUAL_ACCOUNT",
  "EWALLET_ACCOUNT",
  "SWIFT_BIC",
  "IBAN",
  "AWS_KEY",
  "API_KEY",
  "API_KEY_GENERIC",
  "CREDIT_CARD"
]);

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const KEYWORD_REGEXES = SENSITIVE_KEYWORDS.map((keyword) => {
  const pattern = `\\b${escapeRegex(keyword)}\\b`;
  return new RegExp(pattern, "i");
});

const ensureString = (value, fallback = "") => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
};

const normalizeSeverity = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["low", "medium", "high", "critical"].includes(normalized)) {
    return normalized;
  }
  return "high";
};

const collapseWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();
const containsPlaceholder = (value = "") => PLACEHOLDER_TEST_REGEX.test(value || "");
const containsSensitiveKeyword = (value = "") => KEYWORD_REGEXES.some((regex) => regex.test(value));
const hasSensitiveDetectedType = (detectedTypes = []) =>
  detectedTypes.some((type) => SENSITIVE_TYPE_HINTS.has(String(type || "").toUpperCase()));

const buildSafeRewrite = (prompt = "") => {
  const normalized = collapseWhitespace(prompt || "");
  if (!normalized) {
    return "Rewrite this prompt using placeholders only and avoid referencing live data.";
  }
  const replaced = normalized.replace(PLACEHOLDER_REPLACE_REGEX, "<SENSITIVE_DATA>");
  return `Example safe prompt: ${replaced}. Use placeholders only.`;
};

const describeSensitiveContext = ({ hasPlaceholder, hasKeyword, sensitiveTypes }) => {
  const reasons = [];
  if (hasPlaceholder) {
    reasons.push("it contains masked identifiers");
  }
  if (hasKeyword) {
    reasons.push("it references sensitive account/context keywords");
  }
  if (sensitiveTypes.length) {
    reasons.push(`detected types: ${sensitiveTypes.join(", ")}`);
  }
  if (!reasons.length) {
    reasons.push("policy requires manual handling for this severity");
  }
  return reasons.join(" and ");
};

const buildRewriteReason = (context) => {
  return `This prompt must be rewritten because ${describeSensitiveContext(context)}.`;
};

const buildBlockReason = (context) => {
  return `This prompt is blocked due to high severity — ${describeSensitiveContext(context)}.`;
};

const evaluateLocally = ({ sanitizedPrompt, severity, detectedTypes }) => {
  const normalizedSeverity = normalizeSeverity(severity);
  const prompt = ensureString(sanitizedPrompt);
  const details = Array.isArray(detectedTypes) ? detectedTypes : [];
  const hasPlaceholder = containsPlaceholder(prompt);
  const hasKeyword = containsSensitiveKeyword(prompt);
  const sensitiveTypes = details.filter((type) => SENSITIVE_TYPE_HINTS.has(String(type || "").toUpperCase()));
  const context = { hasPlaceholder, hasKeyword, sensitiveTypes };

  if (normalizedSeverity === "low") {
    return {
      decision: "ALLOW",
      risk: "low",
      reason: "No sensitive indicators detected."
    };
  }

  if (normalizedSeverity === "medium") {
    if (hasPlaceholder || hasKeyword || sensitiveTypes.length) {
      return {
        decision: "REWRITE",
        risk: "medium",
        reason: buildRewriteReason(context),
        safeText: buildSafeRewrite(prompt)
      };
    }
    return {
      decision: "ALLOW",
      risk: "medium",
      reason: "No harmful or sensitive intent detected."
    };
  }

  return {
    decision: "BLOCK",
    risk: "high",
    reason: buildBlockReason(context),
    safeAlternative: SAFE_ALTERNATIVE_FALLBACK
  };
};

const SYSTEM_INSTRUCTIONS = [
  "You are the Layer 2 Risk Evaluator in a two-layer Safe LLM filtering system.",
  "You only receive sanitized prompts. Never attempt to recover or guess masked data.",
  "Always decide according to this schema strictly:",
  "",
  "For severity=medium:",
  "- If content is safe: { \"decision\": \"ALLOW\", \"risk\": \"medium\", \"reason\": \"No harmful or sensitive intent detected.\" }",
  "- If sensitive but recoverable: { \"decision\": \"REWRITE\", \"risk\": \"medium\", \"reason\": \"The prompt contains sensitive personal meaning but can be rewritten safely.\", \"safeText\": \"<safe rewritten prompt>\" }",
  "",
  "For severity=high or severity=critical:",
  '{ "decision": "BLOCK", "risk": "high", "reason": "The prompt seeks to access or infer personal/sensitive information.", "safeAlternative": "<general safe instruction>" }',
  "",
  "General rules:",
  "- NEVER reveal or infer actual sensitive data.",
  "- NEVER output markdown or explanations. Respond with JSON ONLY.",
  "- If unsure, default to BLOCK.",
  "- `safeText` is mandatory for REWRITE and must be fully sanitized.",
  "- `safeAlternative` is mandatory for BLOCK.",
  "- Ensure the JSON is valid and contains double-quoted keys.",
  "- The `risk` field must be one of: low, medium, high.",
  "- The `decision` field must be one of: ALLOW, REWRITE, BLOCK.",
  "- The `reason` field must explain the specific sensitive context detected (e.g., mention detected types, placeholders, or sensitive keywords)."
].join("\n");

const buildUserPrompt = ({ sanitizedPrompt, severity, detectedTypes }) => {
  const normalized = ensureString(sanitizedPrompt);
  const severityValue = normalizeSeverity(severity);
  const detected = Array.isArray(detectedTypes) && detectedTypes.length > 0 ? detectedTypes.join(", ") : "none";
  return [
    "Analyze the following sanitized prompt and respond with the required JSON schema.",
    `sanitizedPrompt: ${JSON.stringify(normalized)}`,
    `severity: ${severityValue}`,
    `detectedTypes: ${detected}`
  ].join("\n");
};

const extractJson = (text) => {
  if (!text) {
    throw new Error("Anthropic response was empty");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Anthropic response did not include JSON");
  }
  const jsonText = text.slice(start, end + 1);
  return JSON.parse(jsonText);
};

const sanitizeDecisionShape = (value) => {
  const normalizedDecision = ensureString(value?.decision).toUpperCase();
  const normalizedRisk = ensureString(value?.risk).toLowerCase();
  const reason = ensureString(value?.reason);

  if (!["ALLOW", "REWRITE", "BLOCK"].includes(normalizedDecision)) {
    throw new Error("Invalid decision from Anthropic");
  }

  if (!["low", "medium", "high"].includes(normalizedRisk)) {
    throw new Error("Invalid risk from Anthropic");
  }
  if (!reason) {
    throw new Error("Missing reason in Anthropic response");
  }

  const decision = {
    decision: normalizedDecision,
    risk: normalizedRisk,
    reason
  };

  if (normalizedDecision === "REWRITE") {
    const safeText = ensureString(value?.safeText);
    if (!safeText) {
      throw new Error("Missing safeText for rewrite decision");
    }
    decision.safeText = safeText;
  }

  if (normalizedDecision === "BLOCK") {
    const safeAlternative = ensureString(value?.safeAlternative);
    if (!safeAlternative) {
      throw new Error("Missing safeAlternative for block decision");
    }
    decision.safeAlternative = safeAlternative;
  }

  return decision;
};

const callAnthropic = async (payload) => {
  if (!env.anthropicApiKey) {
    throw new Error("Anthropic API key not configured");
  }
  if (typeof fetch !== "function") {
    throw new Error("fetch API is not available in this runtime");
  }

  const body = {
    model: env.anthropicModel,
    max_tokens: Math.max(256, env.anthropicMaxTokens || 512),
    system: SYSTEM_INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(payload)
      }
    ]
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": env.anthropicVersion || "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const textContent = Array.isArray(data?.content)
    ? data.content
        .filter((part) => part?.type === "text")
        .map((part) => ensureString(part?.text))
        .join("\n")
        .trim()
    : ensureString(data?.content);

  const parsed = extractJson(textContent);
  return sanitizeDecisionShape(parsed);
};

export const evaluateLayerTwoRisk = async (payload) => {
  if (env.anthropicApiKey) {
    try {
      const anthropicDecision = await callAnthropic(payload);
      return {
        ...anthropicDecision,
        provider: "anthropic"
      };
    } catch (error) {
      console.error("VantaPrompt: Anthropic Layer 2 evaluation failed", error);
    }
  }

  return {
    ...evaluateLocally(payload),
    provider: "local"
  };
};

export default evaluateLayerTwoRisk;
