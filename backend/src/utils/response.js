export const sendSuccess = (res, data = {}, meta = {}) => {
  return res.json({ ok: true, data, meta });
};

export const sendError = (res, statusCode = 500, message = "Unexpected error", meta = {}) => {
  return res.status(statusCode).json({ ok: false, error: message, meta });
};
