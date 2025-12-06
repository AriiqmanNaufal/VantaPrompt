import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// When storing real email addresses, hash or encrypt them via utils/crypto.js before persistence.

export const User = mongoose.model("User", UserSchema);
