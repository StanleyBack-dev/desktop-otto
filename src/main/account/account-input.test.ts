import { describe, expect, it } from "vitest";
import { pickPlace, pickSettingsChange } from "./account-input";

describe("pickSettingsChange", () => {
  it("keeps only known fields with the right types", () => {
    expect(
      pickSettingsChange({
        assistantName: "Otto",
        speechRate: 1.2,
        autoSpeak: "yes",
        briefingTime: "06:30:00",
        timeZone: "Mars/Base",
        role: "admin",
      }),
    ).toEqual({
      assistantName: "Otto",
      speechRate: 1.2,
      briefingTime: "06:30",
    });
  });

  it("refuses empty or wrong input", () => {
    expect(pickSettingsChange({})).toBeNull();
    expect(pickSettingsChange("autoSpeak")).toBeNull();
    expect(pickSettingsChange({ speechRate: Number.NaN })).toBeNull();
  });
});

describe("pickPlace", () => {
  it("accepts a found city and refuses bad coordinates", () => {
    expect(
      pickPlace({
        name: "Goiânia",
        region: "Goiás, Brasil",
        latitude: -16.68,
        longitude: -49.25,
        timeZone: "America/Sao_Paulo",
        extra: 1,
      }),
    ).toEqual({
      name: "Goiânia",
      region: "Goiás, Brasil",
      latitude: -16.68,
      longitude: -49.25,
      timeZone: "America/Sao_Paulo",
    });
    expect(pickPlace({ name: "X", latitude: "1", longitude: 2 })).toBeNull();
    expect(pickPlace(null)).toBeNull();
  });
});
