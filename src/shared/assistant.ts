import type { ApiFailure } from "./session";

export const QUESTION_MAX_LENGTH = 2000;

export type AskRequest = { text: string; conversationId: string | null };

/** A spoken question: 16 kHz mono WAV in base64. */
export type VoiceAskRequest = {
  audioBase64: string;
  mimeType: "audio/wav";
  conversationId: string | null;
};

/** Base64 of the largest recording the API accepts (2 MB of audio). */
export const AUDIO_BASE64_MAX_LENGTH = 2_700_000;

export type AskAnswer = {
  conversationId: string;
  /** The question as the API understood it (the transcript, for voice). */
  question: string;
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
  /** Listen for the assistant name in the background. */
  wakeWordEnabled: boolean;
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  assistantName: "Otto",
  language: "pt-BR",
  speechRate: 1,
  autoSpeak: true,
  wakeWordEnabled: true,
};
