// Listening for the assistant's name ("Otto") in the background.
export type WakeStatus =
  | { state: "off" }
  | { state: "starting" }
  | { state: "listening" }
  | { state: "unavailable"; message: string };

export type WakeEvent =
  /** Only the name: start listening for the question. */
  | { kind: "name" }
  /** The name and a question in one phrase (16 kHz WAV, base64). */
  | { kind: "question"; audioBase64: string };
