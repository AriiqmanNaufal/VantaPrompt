import { Router } from "express";
import {
  fetchSummaryStats,
  fetchTrendStats,
  fetchTopTypes
} from "../controllers/statsController.js";
import {
  getEvents,
  getEvent,
  resolveEventController,
  reclassifyEventController,
  redactEventController,
  dismissEventController,
  exportEventsController
} from "../controllers/eventsController.js";
import { streamHighSeverity } from "../controllers/streamController.js";

const router = Router();

router.get("/stats/summary", fetchSummaryStats);
router.get("/stats/trends", fetchTrendStats);
router.get("/stats/top-types", fetchTopTypes);

router.get("/events", getEvents);
router.get("/events/:id", getEvent);
router.post("/events/:id/resolve", resolveEventController);
router.post("/events/:id/reclassify", reclassifyEventController);
router.post("/events/:id/redact", redactEventController);
router.post("/events/:id/dismiss", dismissEventController);
router.get("/export", exportEventsController);
router.get("/stream", streamHighSeverity);

export default router;
