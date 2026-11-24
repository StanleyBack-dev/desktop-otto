import type { ApiFailure } from "./session";

export const QUESTION_MAX_LENGTH = 2000;

export type AskRequest = { text: string; conversationId: string | null };

export type AskAnswer = {
  conversationId: string;
  text: string;
  /** Tools the assistant used (get_weather, get_agenda…). */
  toolsUsed: string[];
};

export type AskResult =
  { ok: true; answer: AskAnswer } | { ok: false; error: ApiFailure };

/** The owner's voice preferences (from the API settings). */
export type VoiceSettings = {
  assistantName: string;
  /** BCP 47, e.g. pt-BR. */
  language: string;
  /** 0.5–2 (1 = normal). */
  speechRate: number;
  /** Read the answers aloud without being asked. */
  autoSpeak: boolean;
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  assistantName: "Otto",
  language: "pt-BR",
  speechRate: 1,
  autoSpeak: true,
};
