import mongoose from "mongoose";
import { DlpEvent } from "../models/DlpEvent.js";

const rangeToDays = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90
};

const buildStartDate = (rangeKey) => {
  const days = rangeToDays[rangeKey] || 7;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const computeRangeSummary = async (startDate) => {
  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        blocked: { $sum: { $cond: ["$blocked", 1, 0] } },
        allowed: { $sum: { $cond: ["$blocked", 0, 1] } },
        low: { $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } }
      }
    }
  ];

  const [result] = await DlpEvent.aggregate(pipeline);
  if (!result) {
    return {
      total: 0,
      blocked: 0,
      allowed: 0,
      severity: { low: 0, medium: 0, high: 0, critical: 0 }
    };
  }

  return {
    total: result.total,
    blocked: result.blocked,
    allowed: result.allowed,
    severity: {
      low: result.low,
      medium: result.medium,
      high: result.high,
      critical: result.critical
    }
  };
};

export const getSummaryStats = async () => {
  const now = new Date();
  const last24h = await computeRangeSummary(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const last7d = await computeRangeSummary(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const last30d = await computeRangeSummary(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

  const heatmap = await getWorkspaceHeatmap(30);

  return {
    last24h,
    last7d,
    last30d,
    workspaceHeatmap: heatmap
  };
};

export const getTrendStats = async (rangeKey = "7d") => {
  const startDate = buildStartDate(rangeKey);
  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          day: {
            $dateTrunc: {
              date: "$createdAt",
              unit: "day",
              timezone: "UTC"
            }
          },
          severity: "$severity"
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.day",
        counts: {
          $push: {
            k: "$_id.severity",
            v: "$count"
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const rows = await DlpEvent.aggregate(pipeline);
  return rows.map((row) => {
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    row.counts.forEach((entry) => {
      severityCounts[entry.k] = entry.v;
    });
    return {
      date: row._id,
      severity: severityCounts
    };
  });
};

export const getTopTypes = async (rangeKey = "30d", limit = 10) => {
  const startDate = buildStartDate(rangeKey);
  const pipeline = [
    { $match: { createdAt: { $gte: startDate }, detectedTypes: { $exists: true, $ne: [] } } },
    { $unwind: "$detectedTypes" },
    {
      $group: {
        _id: "$detectedTypes",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ];

  const rows = await DlpEvent.aggregate(pipeline);
  return rows.map((row) => ({ type: row._id, count: row.count }));
};

export const getWorkspaceHeatmap = async (rangeDays = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - rangeDays);
  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { workspaceId: "$workspaceId", severity: "$severity" },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.workspaceId",
        severities: {
          $push: { severity: "$_id.severity", count: "$count" }
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const rows = await DlpEvent.aggregate(pipeline);
  return rows.map((row) => {
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    row.severities.forEach((entry) => {
      severityCounts[entry.severity] = entry.count;
    });
    return {
      workspaceId: row._id instanceof mongoose.Types.ObjectId ? row._id.toString() : row._id,
      severity: severityCounts
    };
  });
};
