import mongoose from "mongoose";
import { DlpEvent } from "../models/DlpEvent.js";
import { encodeCursor, buildCursorQuery } from "../utils/cursor.js";

const parseArray = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const buildFilters = (query = {}) => {
  const filter = {};
  if (query.workspaceId && mongoose.Types.ObjectId.isValid(query.workspaceId)) {
    filter.workspaceId = new mongoose.Types.ObjectId(query.workspaceId);
  }

  const severities = parseArray(query.severity);
  if (severities?.length) {
    filter.severity = { $in: severities };
  }

  const types = parseArray(query.type);
  if (types?.length) {
    filter.detectedTypes = { $in: types };
  }

  if (query.resolved === "true" || query.resolved === "false") {
    filter.resolved = query.resolved === "true";
  }

  if (query.sourceApp) {
    filter.sourceApp = query.sourceApp;
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  if (query.search) {
    filter.redactedText = { $regex: new RegExp(query.search, "i") };
  }

  return filter;
};

export const listEvents = async ({ query, limit = 25, cursor }) => {
  const cappedLimit = Math.min(Number(limit) || 25, 100);
  const filters = buildFilters(query);
  const clauses = [filters];
  const cursorQuery = buildCursorQuery(cursor);
  if (Object.keys(cursorQuery).length) {
    clauses.push(cursorQuery);
  }
  const finalQuery = clauses.length > 1 ? { $and: clauses } : filters;

  const docs = await DlpEvent.find(finalQuery)
    .sort({ createdAt: -1, _id: -1 })
    .limit(cappedLimit + 1)
    .lean();

  const hasNext = docs.length > cappedLimit;
  let nextCursor = null;
  if (hasNext) {
    const nextDoc = docs.pop();
    nextCursor = encodeCursor(nextDoc);
  }

  return {
    events: docs,
    nextCursor
  };
};

export const getEventById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return DlpEvent.findById(id).lean();
};

const buildAdminNote = (adminId, note) => {
  if (!note) return null;
  return {
    adminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
    note,
    createdAt: new Date()
  };
};

export const resolveEvent = async (id, adminId, note) => {
  const update = { $set: { resolved: true } };
  const adminNote = buildAdminNote(adminId, note);
  if (adminNote) {
    update.$push = { adminNotes: adminNote };
  }
  return DlpEvent.findByIdAndUpdate(id, update, { new: true }).lean();
};

export const reclassifyEvent = async (id, payload, adminId, note) => {
  const update = { $set: {} };
  if (payload.severity) {
    update.$set.severity = payload.severity;
  }
  if (payload.category) {
    update.$set.category = payload.category;
  }
  if (payload.detectedTypes?.length) {
    update.$set.detectedTypes = payload.detectedTypes;
  }
  const adminNote = buildAdminNote(adminId, note || `Reclassified to ${payload.severity || "unchanged"}`);
  if (adminNote) {
    update.$push = { adminNotes: adminNote };
  }
  return DlpEvent.findByIdAndUpdate(id, update, { new: true }).lean();
};

export const redactEvent = async (id, adminId, note) => {
  const update = {
    $set: { redactedText: "[REDACTED]" }
  };
  const adminNote = buildAdminNote(adminId, note || "Prompt body redacted");
  if (adminNote) {
    update.$push = { adminNotes: adminNote };
  }
  return DlpEvent.findByIdAndUpdate(id, update, { new: true }).lean();
};

export const dismissEvent = async (id, adminId, note) => {
  const update = {
    $set: { resolved: true, actionTaken: "allowed" }
  };
  const adminNote = buildAdminNote(adminId, note || "Dismissed as benign");
  if (adminNote) {
    update.$push = { adminNotes: adminNote };
  }
  return DlpEvent.findByIdAndUpdate(id, update, { new: true }).lean();
};

export const exportEventsCursor = ({ query, limit }) => {
  const filters = buildFilters(query);
  const capped = Math.min(limit || 1000, 50000);
  return DlpEvent.find(filters)
    .sort({ createdAt: -1 })
    .limit(capped)
    .cursor();
};
