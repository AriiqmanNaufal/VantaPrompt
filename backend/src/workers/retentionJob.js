import { env } from "../config/env.js";
import { DlpEvent } from "../models/DlpEvent.js";

let retentionTimer;

const retentionTask = async () => {
  if (!env.dashboardRetentionDays) return;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - env.dashboardRetentionDays);
  await DlpEvent.deleteMany({ createdAt: { $lt: cutoff } });
};

export const registerRetentionJob = () => {
  if (env.nodeEnv === "test" || env.dashboardRetentionDays <= 0) {
    return;
  }

  retentionTask().catch((err) => console.error("Retention job failed", err));
  retentionTimer = setInterval(() => {
    retentionTask().catch((err) => console.error("Retention job failed", err));
  }, 6 * 60 * 60 * 1000);
};

export const stopRetentionJob = () => {
  if (retentionTimer) {
    clearInterval(retentionTimer);
  }
};
