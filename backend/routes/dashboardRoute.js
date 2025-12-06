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

const resolveRange = (query) => {
  const raw = (query.since || env.defaultTimeframe || "24h").toLowerCase();

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

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    const { timeframe, startDate } = resolveRange(req.query);
    const match = buildBaseMatch(workspaceId, startDate);

    const [result] = await DlpEvent.aggregate([
      { $match: match },
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
          severity: [{ $group: { _id: "$severity", count: { $sum: 1 } } }],
          types: [
            { $unwind: "$detectedTypes" },
            { $group: { _id: "$detectedTypes", count: { $sum: 1 } } },
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
      severityCount[row._id] = row.count;
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
          critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } }
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
    const { workspaceId, severity, action, detectedType } = req.query;
    const { timeframe, startDate } = resolveRange(req.query);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const skip = (page - 1) * limit;

    const match = buildBaseMatch(workspaceId, startDate);
    if (severity) {
      match.severity = severity;
    }
    if (action) {
      match.actionTaken = action;
    }
    if (detectedType) {
      match.detectedTypes = detectedType;
    }
    if (req.query.search) {
      match.redactedText = { $regex: escapeRegex(req.query.search), $options: "i" };
    }

    const [result] = await DlpEvent.aggregate([
      { $match: match },
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
                severity: 1,
                actionTaken: 1,
                redactedText: 1,
                detectedTypes: 1,
              }
            }
          ]
        }
      }
    ]);

    const total = result?.total?.[0]?.value || 0;

    return res.json({
      page,
      limit,
      total,
      timeframe,
      events: (result?.events || []).map((event) => ({
        ...event,
        _id: event._id?.toString()
      }))
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
      { $unwind: "$findings" },
      { $group: { _id: "$findings.type", count: { $sum: 1 } } },
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
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: "day",
              timezone
            }
          },
          low: { $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } }
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
