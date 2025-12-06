import mongoose from "mongoose";

const SensitiveTypeSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    label: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["PII", "CREDENTIALS", "FINANCIAL", "SOURCE_CODE", "OTHER"],
      default: "OTHER"
    }
  },
  { versionKey: false }
);

export const SensitiveType = mongoose.model("SensitiveType", SensitiveTypeSchema);
