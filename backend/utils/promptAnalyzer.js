import crypto from "crypto";

const passesLuhn = (value = "") => {
  const digits = value.replace(/[\s-]/g, "");
  if (!/^\d{13,16}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

const PATTERNS = [
  {
    type: "EMAIL",
    regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    severity: "medium"
  },
  {
    type: "IC",
    regex: /\b(?:ic|id)[-\s]*\d{4,}\b/gi,
    severity: "high"
  },
  {
    type: "ACCOUNT_NUM",
    regex: /\b\d{8,12}\b/g,
    severity: "high"
  },
  {
    type: "CREDIT_CARD",
    regex: /\b(?:\d[ -]?){13,16}\b/g,
    severity: "critical",
    validator: (value) => passesLuhn(value)
  }
];

const ensureGlobalRegex = (regex) => {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  return new RegExp(regex.source, flags);
};

const hashValue = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

export const analyzePrompt = (prompt) => {
  let redacted = prompt;
  const findings = [];
  const detected = new Set();

  PATTERNS.forEach((pattern) => {
    const regex = ensureGlobalRegex(pattern.regex);
    redacted = redacted.replace(regex, (match) => {
      const fragment = match.trim();
      if (!fragment) {
        return match;
      }

      if (pattern.validator && !pattern.validator(fragment)) {
        return match;
      }

      findings.push({
        type: pattern.type,
        fragmentHash: hashValue(fragment)
      });
      detected.add(pattern.type);

      return `[REDACTED:${pattern.type}]`;
    });
  });

  return {
    redactedText: redacted,
    findings,
    detectedTypes: Array.from(detected),
    highestSeverity: determineHighestSeverity(Array.from(detected))
  };
};

const determineHighestSeverity = (types) => {
  if (!types.length) {
    return "low";
  }

  const order = { low: 0, medium: 1, high: 2, critical: 3 };
  let highest = "low";

  types.forEach((type) => {
    const pattern = PATTERNS.find((entry) => entry.type === type);
    if (!pattern) return;

    const current = pattern.severity || "low";
    if (order[current] > order[highest]) {
      highest = current;
    }
  });

  return highest;
};
