import { env } from "../config/env.js";
import { exportEventsCursor, listEvents } from "./dlpEventService.js";
import { streamEventsToCsv } from "../utils/csv.js";

export const exportEvents = async (res, { query, format }) => {
  const maxRows = env.exportMaxRows;
  if (format === "json") {
    const { events } = await listEvents({ query, limit: maxRows });
    res.setHeader("Content-Type", "application/json");
    return res.json({ ok: true, data: events, meta: { count: events.length } });
  }

  const cursor = exportEventsCursor({ query, limit: maxRows });
  await streamEventsToCsv(res, cursor);
};
