import mongoose from "mongoose";
import { env } from "../config/env.js";

const { Schema } = mongoose;

const FindingSchema = new Schema(
  {
    type: { type: String, required: true },
    fragmentHash: { type: String, required: true }
  },
  { _id: false }
);

const DlpEventSchema = new Schema(
  {
    workspaceId: { type: String, required: true, trim: true, index: true },
    userId: { type: String, required: true, trim: true },
    originalHash: { type: String, required: true },
    redactedText: { type: String, required: true },
    detectedTypes: { type: [String], default: [] },
    findings: { type: [FindingSchema], default: [] },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true, index: true },
    allowed: { type: Boolean, required: true },
    actionTaken: {
      type: String,
      enum: ["allowed", "blocked", "rewrite", "manual_review"],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    source: { type: String, default: "web" },
    modelUsed: { type: String },
    latencyMs: { type: Number, min: 0 }
  },
  {
    versionKey: false
  }
);

DlpEventSchema.index({ workspaceId: 1, timestamp: -1 });
DlpEventSchema.index({ severity: 1, timestamp: -1 });
DlpEventSchema.index({ detectedTypes: 1 });

const ttlDays = Number(env.eventTtlDays);
if (ttlDays && ttlDays > 0) {
  const seconds = ttlDays * 24 * 60 * 60;
  DlpEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: seconds, name: "event_ttl_idx" });
}

export const DlpEvent = mongoose.models.DlpEvent || mongoose.model("DlpEvent", DlpEventSchema);

export default DlpEvent;
