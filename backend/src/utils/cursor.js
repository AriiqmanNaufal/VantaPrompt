import mongoose from "mongoose";

export const encodeCursor = (doc) => {
  if (!doc) return null;
  const payload = JSON.stringify({ createdAt: doc.createdAt, id: doc._id });
  return Buffer.from(payload).toString("base64");
};

export const decodeCursor = (cursor) => {
  if (!cursor) return null;
  const json = Buffer.from(cursor, "base64").toString("utf8");
  const { createdAt, id } = JSON.parse(json);
  return { createdAt: new Date(createdAt), id: new mongoose.Types.ObjectId(id) };
};

export const buildCursorQuery = (cursor) => {
  if (!cursor) return {};
  const decoded = decodeCursor(cursor);
  return {
    $or: [
      { createdAt: { $lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, _id: { $lt: decoded.id } }
    ]
  };
};
