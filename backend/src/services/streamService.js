import EventEmitter from "events";

/**
 * Replace this in-memory emitter with Redis Pub/Sub, Kafka, or Convex actions
 * when deploying across multiple instances.
 */
const streamEmitter = new EventEmitter();

export const subscribeToStream = (listener) => {
  streamEmitter.on("event", listener);
  return () => streamEmitter.off("event", listener);
};

export const publishHighSeverityEvent = (eventDoc) => {
  if (!eventDoc) return;
  if (["high", "critical"].includes(eventDoc.severity)) {
    streamEmitter.emit("event", {
      id: eventDoc._id?.toString(),
      severity: eventDoc.severity,
      workspaceId: eventDoc.workspaceId?.toString(),
      category: eventDoc.category,
      createdAt: eventDoc.createdAt,
      sourceApp: eventDoc.sourceApp
    });
  }
};

export const getStreamEmitter = () => streamEmitter;
