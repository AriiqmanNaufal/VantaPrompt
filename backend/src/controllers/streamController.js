import { asyncHandler } from "../middlewares/asyncHandler.js";
import { subscribeToStream } from "../services/streamService.js";

export const streamHighSeverity = asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write("retry: 10000\n\n");

  const unsubscribe = subscribeToStream((payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
  });
});
