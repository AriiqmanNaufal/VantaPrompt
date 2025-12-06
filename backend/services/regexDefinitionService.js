import RegexPattern from "../models/RegexPattern.js";
import { DEFAULT_REGEX_DEFINITIONS } from "../config/defaultRegexes.js";

const CACHE_TTL_MS = 60 * 1000;
let cachedDefinitions = [];
let cacheExpiresAt = 0;

const severityOrder = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const normalizeSeverity = (value) => {
  if (!value) {
    return "critical";
  }
  const normalized = String(value).trim().toLowerCase();
  return severityOrder[normalized] ? normalized : "critical";
};

const toNumberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureGlobalFlags = (value = "") => {
  const normalized = value || "";
  return normalized.includes("g") ? normalized : `${normalized}g`;
};

const buildDefinitions = (records = []) => {
  return records
    .map((entry) => {
      if (!entry || !entry.type || !entry.pattern) {
        return null;
      }
      return {
        type: entry.type,
        pattern: entry.pattern,
        flags: ensureGlobalFlags(entry.flags || "g"),
        severity: normalizeSeverity(entry.severity),
        priority: toNumberOr(entry.priority, 9999),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
};

export const loadRegexDefinitions = async () => {
  const now = Date.now();
  if (cachedDefinitions.length && cacheExpiresAt > now) {
    return cachedDefinitions;
  }

  const records = await RegexPattern.find().lean();
  const built = buildDefinitions(records);
  if (built.length) {
    cachedDefinitions = built;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return cachedDefinitions;
  }

  cachedDefinitions = buildDefinitions(DEFAULT_REGEX_DEFINITIONS);
  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedDefinitions;
};

export const invalidateRegexCache = () => {
  cachedDefinitions = [];
  cacheExpiresAt = 0;
};
