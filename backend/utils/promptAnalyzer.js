import crypto from "crypto";

const SEVERITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const severityLevel = (value = "critical") => {
  const normalized = String(value || "critical").trim().toLowerCase();
  return SEVERITY_ORDER[normalized] || SEVERITY_ORDER.critical;
};

const toPriority = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return 9999;
};

const hashValue = (value = "") => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

const buildRegex = (pattern, flags = "g") => {
  if (!pattern) {
    return null;
  }
  const normalizedFlags = flags.includes("g") ? flags : `${flags}g`;
  try {
    return new RegExp(pattern, normalizedFlags);
  } catch {
    return null;
  }
};

const collectFragments = (prompt = "", definitions = []) => {
  const fragments = [];
  definitions.forEach((definition) => {
    const regex = buildRegex(definition.pattern, definition.flags || "g");
    if (!regex) {
      return;
    }
    let match;
    while ((match = regex.exec(prompt)) !== null) {
      const fragment = match[0];
      if (!fragment) {
        continue;
      }
      const start = match.index;
      const end = start + fragment.length;
      fragments.push({
        type: definition.type,
        fragment,
        start,
        end,
        length: fragment.length,
        severity: definition.severity || "critical",
        priority: toPriority(definition.priority),
        fragmentHash: hashValue(fragment),
      });
      if (match.index === regex.lastIndex) {
        regex.lastIndex += 1;
      }
    }
  });
  return fragments;
};

const definitionByType = (definitions, type) => {
  return definitions.find((definition) => definition.type === type);
};

const fragmentMatchesDefinition = (fragment, definition) => {
  if (!fragment || !definition) {
    return false;
  }
  const regex = buildRegex(definition.pattern, definition.flags || "g");
  if (!regex) {
    return false;
  }
  return regex.test(fragment);
};

const filterAccountNumberNoise = (fragments = [], definitions = []) => {
  const phoneDefinition = definitionByType(definitions, "PHONE");
  const malaysiaDefinition = definitionByType(definitions, "MALAYSIA_IC_COMPACT");

  return fragments.filter((fragment) => {
    if (fragment.type !== "ACCOUNT_NUM") {
      return true;
    }
    if (fragmentMatchesDefinition(fragment.fragment, phoneDefinition)) {
      return false;
    }
    if (fragmentMatchesDefinition(fragment.fragment, malaysiaDefinition)) {
      return false;
    }
    return true;
  });
};

const buildSanitizedPrompt = (prompt = "", fragments = []) => {
  if (!prompt || fragments.length === 0) {
    return prompt;
  }
  const sorted = [...fragments].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    return severityLevel(b.severity) - severityLevel(a.severity);
  });

  const parts = [];
  let cursor = 0;
  sorted.forEach((fragment) => {
    if (fragment.start < cursor) {
      return;
    }
    parts.push(prompt.slice(cursor, fragment.start));
    parts.push(`[${fragment.type}]`);
    cursor = fragment.end;
  });
  parts.push(prompt.slice(cursor));
  return parts.join("");
};

const determineHighestSeverity = (fragments = []) => {
  if (!fragments.length) {
    return "low";
  }
  return fragments.reduce((current, fragment) => {
    if (severityLevel(fragment.severity) > severityLevel(current)) {
      return fragment.severity;
    }
    return current;
  }, fragments[0].severity || "critical");
};

export const analyzePrompt = (prompt = "", regexDefinitions = []) => {
  const collectedFragments = collectFragments(prompt, regexDefinitions);
  const filteredFragments = filterAccountNumberNoise(collectedFragments, regexDefinitions);
  const sanitizedPrompt = buildSanitizedPrompt(prompt, filteredFragments);
  const findings = filteredFragments.map((fragment) => ({
    type: fragment.type,
    fragmentHash: fragment.fragmentHash,
    severity: fragment.severity,
  }));
  const detectedTypes = Array.from(
    new Set(filteredFragments.map((fragment) => fragment.type).filter(Boolean))
  );
  const highestSeverity = determineHighestSeverity(filteredFragments);

  return {
    redactedText: sanitizedPrompt,
    fragments: filteredFragments,
    findings,
    detectedTypes,
    highestSeverity,
  };
};
