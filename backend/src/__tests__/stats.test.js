import { jest } from "@jest/globals";
import { getSummaryStats } from "../services/aggregationService.js";
import { DlpEvent } from "../models/DlpEvent.js";

describe("aggregationService", () => {
  it("returns counts grouped by severity", async () => {
    jest
      .spyOn(DlpEvent, "aggregate")
      .mockResolvedValueOnce([
        { total: 3, blocked: 2, allowed: 1, low: 0, medium: 1, high: 2, critical: 0 }
      ])
      .mockResolvedValueOnce([
        { total: 3, blocked: 2, allowed: 1, low: 0, medium: 1, high: 2, critical: 0 }
      ])
      .mockResolvedValueOnce([
        { total: 3, blocked: 2, allowed: 1, low: 0, medium: 1, high: 2, critical: 0 }
      ])
      .mockResolvedValueOnce([
        {
          _id: "workspace-1",
          severities: [{ severity: "high", count: 2 }]
        }
      ]);

    const summary = await getSummaryStats();
    expect(summary.last24h.total).toBe(3);
    expect(summary.last24h.severity.high).toBe(2);
    expect(summary.workspaceHeatmap).toHaveLength(1);
  });
});
