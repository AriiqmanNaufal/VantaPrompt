import mongoose from "mongoose";

const warningLogSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, index: true },
    userId: { type: String },
    workstation: { type: String },
    source: { type: String },
    matches: [{ type: String }],
    detectedTypes: [{ type: String }],
    fragments: [{ type: mongoose.Schema.Types.Mixed }],
    severity: { type: mongoose.Schema.Types.Mixed, index: true },
    normalizedSeverity: { type: String, enum: ["low", "medium", "high", "critical"] },
    allowed: { type: Boolean, default: false },
    actionTaken: {
      type: String,
      default: "masked",
      enum: ["allowed", "blocked", "masked", "manual_review", "rewrite", "manual_review_pending"]
    },
    originalJson: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

warningLogSchema.index({ timestamp: -1 });

export default mongoose.models.WarningLog || mongoose.model("WarningLog", warningLogSchema);

