import { asyncHandler } from "../middlewares/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getSummaryStats, getTrendStats, getTopTypes } from "../services/aggregationService.js";

export const fetchSummaryStats = asyncHandler(async (_req, res) => {
  const data = await getSummaryStats();
  return sendSuccess(res, data);
});

export const fetchTrendStats = asyncHandler(async (req, res) => {
  const range = req.query.range || "7d";
  const data = await getTrendStats(range);
  return sendSuccess(res, data, { range });
});

export const fetchTopTypes = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const limit = Number(req.query.limit) || 10;
  const data = await getTopTypes(range, limit);
  return sendSuccess(res, data, { range, limit });
});
