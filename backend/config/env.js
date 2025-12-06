import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vantaprompt",
  eventTtlDays: toNumber(process.env.EVENT_TTL_DAYS, 90),
  defaultTimeframe: process.env.DEFAULT_TIMEFRAME || "24h",
  timezone: process.env.DASHBOARD_TZ || "UTC"
};

export default env;
