import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

export const apiKeyAuth = (req, res, next) => {
  if (!env.apiKey) {
    return next();
  }

  const provided = req.header("x-api-key");
  if (!provided || provided !== env.apiKey) {
    return sendError(res, 401, "Invalid or missing API key");
  }

  return next();
};
