import mongoose from "mongoose";

/**
 * DlpEvent stores redacted prompt metadata. If enterprise policy allows storing full prompt text,
 * replace `redactedText` with an encrypted field using utils/crypto.js helpers and ensure
 * the encryption key is rotated regularly. Never persist raw prompts without explicit consent.
 */
const { Schema } = mongoose;

const AdminNoteSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
    note: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const SensitiveFragmentSchema = new Schema(
  {
    type: String,
    fragmentHash: String
  },
  { _id: false }
);

const DlpEventSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sourceApp: { type: String, required: true },
    originalHash: { type: String, required: true },
    redactedText: { type: String, required: true },
    sensitiveFragments: { type: [SensitiveFragmentSchema], default: [] },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ["PII", "CREDENTIALS", "FINANCIAL", "SOURCE_CODE", "OTHER"],
      required: true,
      index: true
    },
    detectedTypes: { type: [String], default: [] },
    blocked: { type: Boolean, required: true },
    actionTaken: {
      type: String,
      enum: ["blocked", "sanitized", "allowed", "user_overrode"],
      required: true
    },
    resolved: { type: Boolean, default: false },
    adminNotes: { type: [AdminNoteSchema], default: [] }
  },
  { timestamps: true }
);

DlpEventSchema.index({ workspaceId: 1, severity: 1, createdAt: -1 });
DlpEventSchema.index({ category: 1, createdAt: -1 });
DlpEventSchema.index({ detectedTypes: 1 });
DlpEventSchema.index({ blocked: 1, createdAt: -1 });
DlpEventSchema.index({ originalHash: 1 });
DlpEventSchema.index({ createdAt: -1 });
DlpEventSchema.index({ redactedText: "text" }, { name: "redacted_text_idx", default_language: "english" });

export const DlpEvent = mongoose.model("DlpEvent", DlpEventSchema);
