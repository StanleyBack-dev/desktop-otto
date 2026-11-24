// The owner's account settings, edited in Ajustes and kept by the API (so
// they follow the owner to any PC).
import type { ApiFailure } from "./session";

export type AccountSettings = {
  assistantName: string;
  language: string;
  timeZone: string;
  location: { name: string | null; latitude: number; longitude: number } | null;
  speechRate: number;
  autoSpeak: boolean;
  wakeWordEnabled: boolean;
  briefingEnabled: boolean;
  /** HH:mm */
  briefingTime: string;
};

export type SettingsChange = Partial<
  Pick<
    AccountSettings,
    | "assistantName"
    | "speechRate"
    | "autoSpeak"
    | "briefingEnabled"
    | "briefingTime"
  >
>;

export type Place = {
  name: string;
  region: string | null;
  latitude: number;
  longitude: number;
  timeZone: string | null;
};

export type NewsSource = {
  id: string;
  name: string;
  url: string;
  category: string;
  active: boolean;
  lastError: string | null;
};

export type SuggestedNewsSource = {
  name: string;
  url: string;
  category: string;
};

/** Every account call answers with the data or the API message. */
export type AccountResult<T> =
  { ok: true; data: T } | { ok: false; error: ApiFailure };

export function placeLabel(place: Pick<Place, "name" | "region">): string {
  return place.region ? `${place.name}, ${place.region}` : place.name;
}
