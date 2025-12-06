import express from "express";
import helmet from "helmet";
import cors from "cors";
import dashboardRouter from "./routes/dashboardRoutes.js";
import { apiKeyAuth } from "./middlewares/apiKeyAuth.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/response.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  return sendSuccess(res, { service: "VantaPrompt dashboard", status: "ok" });
});

app.use(apiKeyAuth);
app.use("/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
