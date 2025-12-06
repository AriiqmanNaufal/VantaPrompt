import mongoose from "mongoose";

const warningLogSchema = new mongoose.Schema(
  {
    workstation: { type: String },
    source: { type: String },
    matches: [{ type: String }],
    fragments: [{ type: mongoose.Schema.Types.Mixed }],
    severity: { type: String },
    allowed: { type: Boolean, default: false },
    actionTaken: { type: String, default: "masked" },
    originalJson: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

export default mongoose.models.WarningLog || mongoose.model("WarningLog", warningLogSchema);
