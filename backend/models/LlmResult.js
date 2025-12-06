import mongoose from "mongoose";

const { Schema } = mongoose;

const llmResultSchema = new Schema(
  {
    warningLogId: { type: Schema.Types.ObjectId, ref: "WarningLog", unique: true, required: true },
    decision: { type: String, enum: ["ALLOW", "REWRITE", "BLOCK"], required: true },
    risk: { type: String, enum: ["low", "medium", "high"], required: true },
    reason: { type: String, required: true },
    safeText: { type: String },
    safeAlternative: { type: String },
    severity: { type: String },
    sanitizedPrompt: { type: String },
    detectedTypes: [{ type: String }],
    provider: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

llmResultSchema.index({ risk: 1, createdAt: -1 });

export default mongoose.models.LlmResult || mongoose.model("LlmResult", llmResultSchema);
