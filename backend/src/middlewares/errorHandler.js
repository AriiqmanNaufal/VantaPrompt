import { sendError } from "../utils/response.js";

export const notFoundHandler = (_req, res) => {
  return sendError(res, 404, "Route not found");
};

export const errorHandler = (err, _req, res, _next) => {
  console.error("[Dashboard Backend]", err);
  const status = err.statusCode || 500;
  const message = err.message || "Unexpected error";
  return sendError(res, status, message);
};
