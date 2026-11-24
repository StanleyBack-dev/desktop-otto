// Decides when a spoken question is over, from the loudness of each block of
// audio: the recording stops after a pause once something was said, or
// gives up when nothing is said.
export type SpeechPhase = "waiting" | "speaking" | "done" | "nothing";

export type EndOfSpeechOptions = {
  /** Loudness (RMS 0–1) that counts as voice. */
  threshold: number;
  /** Pause that ends the question. */
  silenceMs: number;
  /** Give up when nobody speaks for this long. */
  waitMs: number;
  /** Hard limit of a question. */
  maxMs: number;
};

export const DEFAULT_END_OF_SPEECH: EndOfSpeechOptions = {
  threshold: 0.02,
  silenceMs: 1200,
  waitMs: 6000,
  maxMs: 15_000,
};

export class EndOfSpeech {
  private phase: SpeechPhase = "waiting";
  private lastVoiceAt = 0;

  constructor(
    private readonly startedAt: number,
    private readonly options: EndOfSpeechOptions = DEFAULT_END_OF_SPEECH,
  ) {}

  /** Feed the loudness of each block; returns the phase after it. */
  feed(loudness: number, now: number): SpeechPhase {
    if (this.phase === "done" || this.phase === "nothing") return this.phase;
    const elapsed = now - this.startedAt;
    if (loudness >= this.options.threshold) {
      this.phase = "speaking";
      this.lastVoiceAt = now;
    }
    if (this.phase === "waiting" && elapsed >= this.options.waitMs) {
      this.phase = "nothing";
    } else if (
      this.phase === "speaking" &&
      (now - this.lastVoiceAt >= this.options.silenceMs ||
        elapsed >= this.options.maxMs)
    ) {
      this.phase = "done";
    }
    return this.phase;
  }
}
