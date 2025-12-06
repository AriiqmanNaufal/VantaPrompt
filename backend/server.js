import express from "express";
import dlpRoute from "./routes/dlpRoute.js";
import llmRoute from "./routes/llmRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logEvent } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ service: "VantaPrompt backend", status: "ok" });
});

app.use("/dlp", dlpRoute);
app.use("/llm", llmRoute);
app.use("/dashboard", dashboardRoute);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectDatabase();
  app.listen(env.port, () => {
    logEvent(`VantaPrompt backend listening on port ${env.port}`);
  });
};

start().catch((error) => {
  logEvent("Failed to start backend", { message: error.message });
  process.exit(1);
});

export default app;
