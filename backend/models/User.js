import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
