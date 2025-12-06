import { logEvent } from "../utils/logger.js";

export const notFoundHandler = (_req, res) => {
  res.status(404).json({
    error: "Resource not found"
  });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isServerError = status >= 500;
  const response = {
    error: isServerError ? "Internal server error" : err.message || "Unexpected error"
  };

  logEvent("API error", {
    status,
    message: err.message,
    stack: err.stack
  });

  res.status(status).json(response);
};
