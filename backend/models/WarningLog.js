import mongoose from "mongoose";

const warningLogSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, index: true },
    userId: { type: String },
    workstation: { type: String },
    source: { type: String },
    promptHash: { type: String },
    sanitizedPrompt: { type: String },
    severity: { type: String },
    allowed: { type: Boolean, default: false },
    actionTaken: { type: String, default: "masked" },
    detectedTypes: [{ type: String }],
    fragments: [{ type: mongoose.Schema.Types.Mixed }],
    ipAddress: { type: String },
    originalJsonHash: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

warningLogSchema.index({ timestamp: -1 });

export default mongoose.models.WarningLog || mongoose.model("WarningLog", warningLogSchema);
