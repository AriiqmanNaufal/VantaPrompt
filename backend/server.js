import express from "express";
import dlpRoute from "./routes/dlpRoute.js";
import llmRoute from "./routes/llmRoute.js";
import { logEvent } from "./utils/logger.js";

const app = express();

// Enable JSON payload parsing for all incoming requests
app.use(express.json());

// Route groups keep DLP checks and LLM forwarding logic isolated
app.use("/dlp", dlpRoute);
app.use("/llm", llmRoute);

// Minimal health endpoint for ops checks
app.get("/health", (_req, res) => {
  res.json({ service: "VantaPrompt backend", status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logEvent(`VantaPrompt backend listening on port ${PORT}`);
});

export default app;
