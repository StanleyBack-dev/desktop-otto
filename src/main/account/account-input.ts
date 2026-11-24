import type { Place, SettingsChange } from "@shared/account";

// Checks what the screens send before it reaches the API (which validates
// the values again). Pure, so it is tested without Electron.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Keeps only the known setting fields, with the right types. */
export function pickSettingsChange(value: unknown): SettingsChange | null {
  if (!isRecord(value)) return null;
  const change: SettingsChange = {};
  if (typeof value.assistantName === "string") {
    change.assistantName = value.assistantName.slice(0, 40);
  }
  if (
    typeof value.speechRate === "number" &&
    Number.isFinite(value.speechRate)
  ) {
    change.speechRate = value.speechRate;
  }
  if (typeof value.autoSpeak === "boolean") change.autoSpeak = value.autoSpeak;
  if (typeof value.briefingEnabled === "boolean") {
    change.briefingEnabled = value.briefingEnabled;
  }
  if (typeof value.briefingTime === "string") {
    change.briefingTime = value.briefingTime.slice(0, 5);
  }
  return Object.keys(change).length > 0 ? change : null;
}

export function pickPlace(value: unknown): Place | null {
  if (!isRecord(value)) return null;
  const { name, region, latitude, longitude, timeZone } = value;
  if (
    typeof name !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return {
    name: name.slice(0, 100),
    region: typeof region === "string" ? region.slice(0, 100) : null,
    latitude,
    longitude,
    timeZone: typeof timeZone === "string" ? timeZone.slice(0, 64) : null,
  };
}
