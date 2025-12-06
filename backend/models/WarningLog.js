import mongoose from "mongoose";

const warningLogSchema = new mongoose.Schema(
  {
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
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

export default mongoose.models.WarningLog || mongoose.model("WarningLog", warningLogSchema);
