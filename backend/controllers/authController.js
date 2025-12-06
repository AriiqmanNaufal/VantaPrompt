import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const user = await User.findOne({ username: username.trim() }).lean();

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: "Wrong username or password" });
  }

  return res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      role: user.role || "user"
    }
  });
});

export default { login };
