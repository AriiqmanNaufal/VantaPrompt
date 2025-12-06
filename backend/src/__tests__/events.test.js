import { jest } from "@jest/globals";
import { resolveEvent, reclassifyEvent } from "../services/dlpEventService.js";
import { DlpEvent } from "../models/DlpEvent.js";

describe("dlpEventService", () => {
  it("resolves events and appends admin notes", async () => {
    jest.spyOn(DlpEvent, "findByIdAndUpdate").mockReturnValue({
      lean: () =>
        Promise.resolve({
          _id: "evt1",
          resolved: true,
          adminNotes: [{ note: "Reviewed" }]
        })
    });

    const updated = await resolveEvent("evt1", "507f1f77bcf86cd799439011", "Reviewed");
    expect(updated.resolved).toBe(true);
    expect(updated.adminNotes).toHaveLength(1);
  });

  it("reclassifies severity", async () => {
    jest.spyOn(DlpEvent, "findByIdAndUpdate").mockReturnValue({
      lean: () =>
        Promise.resolve({
          _id: "evt1",
          severity: "medium"
        })
    });

    const updated = await reclassifyEvent("evt1", { severity: "medium" }, null, "Lowered severity");
    expect(updated.severity).toBe("medium");
  });
});
