import mongoose from "mongoose";

const { Schema } = mongoose;

const submittedRedFlagSchema = new Schema(
  {
    warningLogId: { type: Schema.Types.ObjectId, ref: "WarningLog" },
    prompt: { type: String, required: true },
    detectedTypes: [{ type: String }],
    matches: [{ type: String }],
    severity: { type: String, default: "high" },
    source: { type: String, default: "unknown" },
    url: { type: String },
    workstation: { type: String },
    submittedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

submittedRedFlagSchema.index({ createdAt: -1 });
submittedRedFlagSchema.index({ severity: 1, createdAt: -1 });
submittedRedFlagSchema.index({ warningLogId: 1 }, { unique: false });

export default mongoose.models.SubmittedRedFlag ||
  mongoose.model("SubmittedRedFlag", submittedRedFlagSchema);
