import { stringify } from "csv-stringify";

export const streamEventsToCsv = async (res, cursor) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=dlp-events.csv");

  const stringifier = stringify({ header: true });
  stringifier.pipe(res);

  for await (const evt of cursor) {
    stringifier.write({
      id: evt._id.toString(),
      workspaceId: evt.workspaceId?.toString(),
      severity: evt.severity,
      category: evt.category,
      blocked: evt.blocked,
      resolved: evt.resolved,
      sourceApp: evt.sourceApp,
      createdAt: evt.createdAt.toISOString(),
      redactedText: evt.redactedText
    });
  }

  stringifier.end();
};
