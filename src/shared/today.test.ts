import { describe, expect, it } from "vitest";
import { agendaNow, timeIn, weatherLabel, type AgendaEvent } from "./today";

const event = (id: string, start: string, end: string, allDay = false) =>
  ({
    id,
    title: id,
    start,
    end,
    allDay,
    location: null,
    calendar: "Rotina",
  }) satisfies AgendaEvent;

describe("weatherLabel", () => {
  it("names the WMO codes in Portuguese", () => {
    expect(weatherLabel(0).label).toBe("Céu limpo");
    expect(weatherLabel(0, false).symbol).toBe("🌙");
    expect(weatherLabel(53).label).toBe("Garoa");
    expect(weatherLabel(63).label).toBe("Chuva");
    expect(weatherLabel(82).label).toBe("Chuva forte");
    expect(weatherLabel(95).label).toBe("Tempestade");
    expect(weatherLabel(1234).label).toBe("Tempo instável");
  });
});

describe("agendaNow", () => {
  const events = [
    event("dia todo", "2026-11-24T03:00:00Z", "2026-11-25T03:00:00Z", true),
    event("academia", "2026-11-24T15:00:00Z", "2026-11-24T16:30:00Z"),
    event("ingles", "2026-11-24T13:15:00Z", "2026-11-24T14:00:00Z"),
    event("projeto", "2026-11-24T17:30:00Z", "2026-11-24T19:00:00Z"),
  ];

  it("finds what is on now and what is next, ignoring all-day events", () => {
    const now = new Date("2026-11-24T15:30:00Z");
    const { current, next } = agendaNow(events, now);
    expect(current.map((e) => e.id)).toEqual(["academia"]);
    expect(next?.id).toBe("projeto");
    expect(agendaNow(events, new Date("2026-11-24T22:00:00Z")).next).toBeNull();
  });

  it("formats times in the owner's zone", () => {
    expect(timeIn("2026-11-24T15:00:00Z", "America/Sao_Paulo")).toBe("12:00");
  });
});
