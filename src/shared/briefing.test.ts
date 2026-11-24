import { describe, expect, it } from "vitest";
import { localDateTime, shouldPresentBriefing } from "./briefing";

const SCHEDULE = {
  briefingEnabled: true,
  briefingTime: "07:00",
  timeZone: "America/Sao_Paulo",
};

describe("shouldPresentBriefing", () => {
  it("presents from the chosen time on, once per local date", () => {
    const before = new Date("2026-11-24T09:59:00Z"); // 06:59 in Brasília
    const at = new Date("2026-11-24T10:00:00Z"); // 07:00
    const later = new Date("2026-11-24T15:30:00Z"); // PC turned on at 12:30
    expect(shouldPresentBriefing(SCHEDULE, before, null)).toBe(false);
    expect(shouldPresentBriefing(SCHEDULE, at, null)).toBe(true);
    expect(shouldPresentBriefing(SCHEDULE, later, "2026-11-23")).toBe(true);
    expect(shouldPresentBriefing(SCHEDULE, later, "2026-11-24")).toBe(false);
  });

  it("follows the owner's time zone and the switch", () => {
    // 02:30 UTC on the 25th is still the 24th, 23:30, in Brasília.
    expect(
      localDateTime(new Date("2026-11-25T02:30:00Z"), "America/Sao_Paulo"),
    ).toEqual({ date: "2026-11-24", time: "23:30" });
    expect(
      shouldPresentBriefing(
        { ...SCHEDULE, timeZone: "Europe/Lisbon" },
        new Date("2026-11-24T07:05:00Z"),
        null,
      ),
    ).toBe(true);
    expect(
      shouldPresentBriefing(
        { ...SCHEDULE, briefingEnabled: false },
        new Date("2026-11-24T12:00:00Z"),
        null,
      ),
    ).toBe(false);
  });
});
