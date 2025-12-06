import mongoose from "mongoose";
import { env } from "../config/env.js";

const { Schema } = mongoose;

const FindingSchema = new Schema(
  {
    type: { type: String },
    fragmentHash: { type: String }
  },
  { _id: false }
);

const FragmentSchema = new Schema(
  {
    type: { type: String },
    fragment: { type: String },
    severity: { type: String },
    fragmentHash: { type: String }
  },
  { _id: false }
);

const DlpEventSchema = new Schema(
  {
    workspaceId: { type: String, trim: true, index: true },
    userId: { type: String, trim: true },
    workstation: { type: String },
    source: { type: String, default: "web" },
    modelUsed: { type: String },
    matches: { type: [String], default: [] },
    fragments: { type: [FragmentSchema], default: [] },
    findings: { type: [FindingSchema], default: [] },
    detectedTypes: { type: [String], default: [] },
    originalHash: { type: String },
    redactedText: { type: String },
    severity: { type: Schema.Types.Mixed, index: true },
    allowed: { type: Boolean },
    actionTaken: {
      type: String,
      enum: ["allowed", "blocked", "rewrite", "manual_review", "masked", "manual_review_pending"]
    },
    timestamp: { type: Date, default: Date.now },
    originalJson: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    latencyMs: { type: Number, min: 0 }
  },
  {
    versionKey: false
  }
);

DlpEventSchema.index({ workspaceId: 1, timestamp: -1 });
DlpEventSchema.index({ severity: 1, timestamp: -1 });
DlpEventSchema.index({ detectedTypes: 1 });
DlpEventSchema.index({ "fragments.type": 1 });
DlpEventSchema.index({ actionTaken: 1, timestamp: -1 });

const ttlDays = Number(env.eventTtlDays);
if (ttlDays && ttlDays > 0) {
  const seconds = ttlDays * 24 * 60 * 60;
  DlpEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: seconds, name: "event_ttl_idx" });
}

export const DlpEvent = mongoose.models.DlpEvent || mongoose.model("DlpEvent", DlpEventSchema);

export default DlpEvent;
