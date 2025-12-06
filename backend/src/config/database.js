import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export const connectDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== "production"
  });
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState > 0) {
    await mongoose.disconnect();
  }
};
