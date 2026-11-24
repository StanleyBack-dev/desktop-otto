import { rms } from "@shared/audio/wav";

// Development aid (npm run dev only, never in the installed app): prints
// in the terminal how loud the microphone arrives and what the local model
// transcribed, to tune the name listener on a real microphone.
export class WakeDiagnostics {
  private chunks = 0;
  private peak = 0;
  private lastReport = Date.now();

  constructor(private readonly log: (line: string) => void = console.log) {}

  audio(samples: Float32Array, paused: boolean, state: string): void {
    this.chunks++;
    this.peak = Math.max(this.peak, rms(samples));
    const now = Date.now();
    if (now - this.lastReport < 5000) return;
    this.log(
      `[otto:escuta] ${this.chunks} blocos em 5 s · volume máx ${this.peak.toFixed(3)} (fala costuma passar de 0.02) · estado ${state}${paused ? " · pausada" : ""}`,
    );
    this.chunks = 0;
    this.peak = 0;
    this.lastReport = now;
  }

  phrase(text: string, wake: boolean): void {
    this.log(
      `[otto:escuta] ouvi: ${JSON.stringify(text)} → ${wake ? "NOME RECONHECIDO" : "ignorado"}`,
    );
  }
}
