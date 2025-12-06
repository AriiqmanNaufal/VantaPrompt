import { Router } from "express";
import { DlpEvent } from "../models/DlpEvent.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const RANGE_MS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildBadRequest = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const severityCaseExpression = (valueRef) => ({
  $switch: {
    branches: [
      { case: { $in: [valueRef, ["critical", "crit", "4"]] }, then: "critical" },
      { case: { $in: [valueRef, ["high", "3"]] }, then: "high" },
      { case: { $in: [valueRef, ["medium", "med", "2"]] }, then: "medium" },
      { case: { $in: [valueRef, ["low", "1", "0"]] }, then: "low" }
    ],
    default: null
  }
});

const severityNormalizationExpression = {
  $let: {
    vars: {
      severityStr: {
        $toLower: {
          $trim: {
            input: {
              $convert: {
                input: "$severity",
                to: "string",
                onError: "",
                onNull: ""
              }
            }
          }
        }
      },
      fragmentSeverityStr: {
        $toLower: {
          $trim: {
            input: {
              $convert: {
                input: {
                  $ifNull: [{ $arrayElemAt: ["$fragments.severity", 0] }, ""]
                },
                to: "string",
                onError: "",
                onNull: ""
              }
            }
          }
        }
      }
    },
    in: {
      $let: {
        vars: {
          primary: severityCaseExpression("$$severityStr"),
          fallback: severityCaseExpression("$$fragmentSeverityStr")
        },
        in: {
          $ifNull: ["$$primary", { $ifNull: ["$$fallback", "low"] }]
        }
      }
    }
  }
};

const combinedTypeArrayExpression = {
  $filter: {
    input: {
      $concatArrays: [
        { $ifNull: ["$detectedTypes", []] },
        {
          $map: {
            input: { $ifNull: ["$fragments", []] },
            as: "fragment",
            in: "$$fragment.type"
          }
        },
        {
          $map: {
            input: { $ifNull: ["$findings", []] },
            as: "finding",
            in: "$$finding.type"
          }
        }
      ]
    },
    as: "type",
    cond: { $and: [{ $ne: ["$$type", null] }, { $ne: ["$$type", ""] }] }
  }
};

const severityStage = () => ({
  $addFields: {
    normalizedSeverity: severityNormalizationExpression
  }
});

const resolveRange = (query) => {
  const raw = String(query.since || env.defaultTimeframe || "24h").toLowerCase();

  if (RANGE_MS[raw]) {
    return {
      timeframe: raw,
      startDate: new Date(Date.now() - RANGE_MS[raw])
    };
  }

  if (raw === "custom") {
    const source = query.from || query.start || query.startDate || query.sinceTs;
    if (!source) {
      throw buildBadRequest("Custom timeframe requires `from` query parameter.");
    }

    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) {
      throw buildBadRequest("Invalid `from` value for custom timeframe.");
    }

    return { timeframe: "custom", startDate: parsed };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return { timeframe: "custom", startDate: parsed };
  }

  return {
    timeframe: "24h",
    startDate: new Date(Date.now() - RANGE_MS["24h"])
  };
};

const buildBaseMatch = (workspaceId, startDate) => {
  const match = {};
  if (workspaceId) {
    match.workspaceId = workspaceId;
  }
  if (startDate instanceof Date && !Number.isNaN(startDate.getTime())) {
    match.timestamp = { $gte: startDate };
  }
  return match;
};

const resolveTimezone = (tz) => tz || env.timezone || "UTC";

const normalizeSeverityParam = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (["critical", "crit", "4"].includes(normalized)) return "critical";
  if (["high", "3"].includes(normalized)) return "high";
  if (["medium", "med", "2"].includes(normalized)) return "medium";
  if (["low", "1", "0"].includes(normalized)) return "low";
  return null;
};

const redactPrompt = (prompt, fragments = [], matches = []) => {
  if (typeof prompt !== "string" || !prompt) {
    return prompt || "";
  }

  const entries = [
    ...(fragments || []).map((fragment) => ({
      value: fragment?.fragment,
      label: fragment?.type || "PII"
    })),
    ...(matches || []).map((value) => ({ value, label: "PII" }))
  ];

  return entries.reduce((text, entry) => {
    if (!entry.value) return text;
    const mask = `[REDACTED:${entry.label}]`;
    const regex = new RegExp(escapeRegex(entry.value), "gi");
    return text.replace(regex, mask);
  }, prompt);
};

const formatEventForResponse = (event) => {
  const detectedTypes = Array.from(
    new Set(
      []
        .concat(event.detectedTypes || [])
        .filter((type) => typeof type === "string" && type.trim().length > 0)
    )
  );

  const redacted =
    event.redactedText && event.redactedText.trim().length
      ? event.redactedText
      : redactPrompt(event.originalJson?.prompt, event.fragments, event.matches);

  return {
    _id: event._id?.toString(),
    timestamp: event.timestamp,
    userId: event.userId,
    severity: event.severity,
    actionTaken: event.actionTaken,
    redactedText: redacted || "",
    detectedTypes,
    allowed: event.allowed,
    source: event.source,
    workstation: event.workstation,
    matches: event.matches,
    fragments: event.fragments,
    ipAddress: event.ipAddress
  };
};

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    const { timeframe, startDate } = resolveRange(req.query);
    const match = buildBaseMatch(workspaceId, startDate);

    const [result] = await DlpEvent.aggregate([
      { $match: match },
      severityStage(),
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                allowedEvents: { $sum: { $cond: ["$allowed", 1, 0] } },
                blockedEvents: { $sum: { $cond: ["$allowed", 0, 1] } }
              }
            }
          ],
          severity: [{ $group: { _id: "$normalizedSeverity", count: { $sum: 1 } } }],
          types: [
            {
              $project: {
                combinedTypes: combinedTypeArrayExpression
              }
            },
            { $unwind: "$combinedTypes" },
            { $match: { combinedTypes: { $ne: null } } },
            { $group: { _id: "$combinedTypes", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          lastEvent: [{ $sort: { timestamp: -1 } }, { $limit: 1 }]
        }
      }
    ]);

    const totals = result?.stats?.[0] || { totalEvents: 0, allowedEvents: 0, blockedEvents: 0 };
    const severityCount = { low: 0, medium: 0, high: 0, critical: 0 };
    (result?.severity || []).forEach((row) => {
      if (row?._id && severityCount[row._id] !== undefined) {
        severityCount[row._id] = row.count;
      }
    });

    const topDetectedTypes = (result?.types || []).map((row) => ({
      type: row._id,
      count: row.count
    }));

    const lastEventTimestamp = result?.lastEvent?.[0]?.timestamp?.toISOString() || null;

    return res.json({
      totalEvents: totals.totalEvents,
      blockedEvents: totals.blockedEvents,
      allowedEvents: totals.allowedEvents,
      severityCount,
      topDetectedTypes,
      lastEventTimestamp,
      timeframe
    });
  })
);

router.get(
  "/timeseries",
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    const { timeframe, startDate } = resolveRange(req.query);
    const match = buildBaseMatch(workspaceId, startDate);
    const timezone = resolveTimezone(req.query.tz);

    const durationMs = Math.max(Date.now() - startDate.getTime(), 0);
    const useHourly = durationMs < 48 * 60 * 60 * 1000;
    const unit = useHourly ? "hour" : "day";

    const buckets = await DlpEvent.aggregate([
      { $match: match },
      severityStage(),
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit,
              timezone
            }
          },
          total: { $sum: 1 },
          blocked: { $sum: { $cond: ["$allowed", 0, 1] } },
          critical: { $sum: { $cond: [{ $eq: ["$normalizedSeverity", "critical"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedBuckets = buckets.map((bucket) => ({
      date: useHourly ? bucket._id.toISOString() : bucket._id.toISOString().split("T")[0],
      total: bucket.total,
      blocked: bucket.blocked,
      critical: bucket.critical
    }));

    return res.json({
      buckets: formattedBuckets,
      bucketSize: unit,
      timeframe
    });
  })
);

router.get(
  "/recentEvents",
  asyncHandler(async (req, res) => {
    const { workspaceId, action, detectedType } = req.query;
    const severityParam = normalizeSeverityParam(req.query.severity);
    const { timeframe, startDate } = resolveRange(req.query);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const skip = (page - 1) * limit;

    const baseMatch = buildBaseMatch(workspaceId, startDate);
    const andConditions = [];
    if (Object.keys(baseMatch).length) {
      andConditions.push(baseMatch);
    }
    if (action) {
      andConditions.push({ actionTaken: action });
    }
    if (detectedType) {
      andConditions.push({
        $or: [
          { detectedTypes: detectedType },
          { "fragments.type": detectedType },
          { "findings.type": detectedType }
        ]
      });
    }
    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      andConditions.push({
        $or: [
          { redactedText: regex },
          { "originalJson.prompt": regex },
          { matches: regex }
        ]
      });
    }

    const pipeline = [];
    if (andConditions.length) {
      pipeline.push({ $match: { $and: andConditions } });
    } else {
      pipeline.push({ $match: {} });
    }

    pipeline.push(severityStage());

    if (severityParam) {
      pipeline.push({ $match: { normalizedSeverity: severityParam } });
    }

    pipeline.push(
      { $sort: { timestamp: -1 } },
      {
        $facet: {
          total: [{ $count: "value" }],
          events: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                timestamp: 1,
                userId: 1,
                severity: "$normalizedSeverity",
                actionTaken: 1,
                redactedText: 1,
                detectedTypes: combinedTypeArrayExpression,
                fragments: 1,
                matches: 1,
                allowed: 1,
                source: 1,
                workstation: 1,
                originalJson: 1,
                ipAddress: 1
              }
            }
          ]
        }
      }
    );

    const [result] = await DlpEvent.aggregate(pipeline);
    const total = result?.total?.[0]?.value || 0;

    const events = (result?.events || []).map((event) => formatEventForResponse(event));

    return res.json({
      page,
      limit,
      total,
      timeframe,
      events
    });
  })
);

router.get(
  "/typeBreakdown",
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    const { timeframe, startDate } = resolveRange(req.query);
    const match = buildBaseMatch(workspaceId, startDate);

    const types = await DlpEvent.aggregate([
      { $match: match },
      {
        $project: {
          piiTypes: combinedTypeArrayExpression
        }
      },
      { $unwind: "$piiTypes" },
      { $match: { piiTypes: { $ne: null } } },
      { $group: { _id: "$piiTypes", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      timeframe,
      types: types.map((row) => ({
        type: row._id,
        count: row.count
      }))
    });
  })
);

router.get(
  "/severityTrend",
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    const { timeframe, startDate } = resolveRange(req.query);
    const match = buildBaseMatch(workspaceId, startDate);
    const timezone = resolveTimezone(req.query.tz);

    const trend = await DlpEvent.aggregate([
      { $match: match },
      severityStage(),
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: "day",
              timezone
            }
          },
          low: { $sum: { $cond: [{ $eq: ["$normalizedSeverity", "low"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$normalizedSeverity", "medium"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$normalizedSeverity", "high"] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ["$normalizedSeverity", "critical"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      timeframe,
      trend: trend.map((row) => ({
        date: row._id.toISOString().split("T")[0],
        low: row.low,
        medium: row.medium,
        high: row.high,
        critical: row.critical
      }))
    });
  })
);

export default router;
