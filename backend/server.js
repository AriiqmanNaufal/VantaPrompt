import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dlpRoute from "./routes/dlpRoute.js";
import llmRoute from "./routes/llmRoute.js";
import { logEvent } from "./utils/logger.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI is required in .env for MongoDB connection");
}

mongoose
  .connect(mongoUri)
  .then(() => logEvent("Connected to MongoDB"))
  .catch((error) => {
    logEvent("MongoDB connection failed: " + error.message);
    process.exit(1);
  });

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
