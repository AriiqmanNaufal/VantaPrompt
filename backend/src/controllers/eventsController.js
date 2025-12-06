import { asyncHandler } from "../middlewares/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  listEvents,
  getEventById,
  resolveEvent,
  reclassifyEvent,
  redactEvent,
  dismissEvent
} from "../services/dlpEventService.js";
import { exportEvents } from "../services/exportService.js";

export const getEvents = asyncHandler(async (req, res) => {
  const { events, nextCursor } = await listEvents({
    query: req.query,
    limit: req.query.limit,
    cursor: req.query.cursor
  });
  return sendSuccess(res, events, { nextCursor });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ ok: false, error: "Event not found" });
  }
  return sendSuccess(res, event);
});

export const resolveEventController = asyncHandler(async (req, res) => {
  const updated = await resolveEvent(req.params.id, req.body.adminId, req.body.note);
  return sendSuccess(res, updated);
});

export const reclassifyEventController = asyncHandler(async (req, res) => {
  const updated = await reclassifyEvent(req.params.id, req.body, req.body.adminId, req.body.note);
  return sendSuccess(res, updated);
});

export const redactEventController = asyncHandler(async (req, res) => {
  const updated = await redactEvent(req.params.id, req.body.adminId, req.body.note);
  return sendSuccess(res, updated);
});

export const dismissEventController = asyncHandler(async (req, res) => {
  const updated = await dismissEvent(req.params.id, req.body.adminId, req.body.note);
  return sendSuccess(res, updated);
});

export const exportEventsController = asyncHandler(async (req, res) => {
  const format = req.query.format || "csv";
  if (format === "json") {
    await exportEvents(res, { query: req.query, format: "json" });
    return;
  }
  await exportEvents(res, { query: req.query, format: "csv" });
});
