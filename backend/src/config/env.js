import dotenv from "dotenv";

dotenv.config();

const toNumber = (val, fallback) => {
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/vantaprompt",
  dashboardRetentionDays: toNumber(process.env.DASHBOARD_RETENTION_DAYS, 30),
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  exportMaxRows: toNumber(process.env.EXPORT_MAX_ROWS, 20000),
  apiKey: process.env.API_KEY || ""
};
