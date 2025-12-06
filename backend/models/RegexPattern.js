import mongoose from "mongoose";

const regexPatternSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    pattern: { type: String, required: true },
    flags: { type: String, default: "g" },
    severity: { type: String, default: "critical" },
    description: { type: String },
  },
  { timestamps: false }
);

export default mongoose.models.RegexPattern ||
  mongoose.model("RegexPattern", regexPatternSchema, "dlpschema");

