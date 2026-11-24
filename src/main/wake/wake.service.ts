import { existsSync } from "fs";
import { join } from "path";
import { Worker } from "worker_threads";
import { encodeWav, toBase64 } from "@shared/audio/wav";
import { isQuestion, matchWakeWord } from "@shared/wake-word";
import type { WakeEvent, WakeStatus } from "@shared/wake";
import type { WakeDiagnostics } from "./wake-diagnostics";

const MODEL_FILES = [
  "silero_vad.onnx",
  "tiny-encoder.int8.onnx",
  "tiny-decoder.int8.onnx",
  "tiny-tokens.txt",
];

// Listens for the assistant's name in the microphone audio the screen
// streams while "Ouvir o nome" is on. The heavy work runs in a worker; when
// the name is heard with a question after it, that phrase goes on as a
// spoken question, otherwise Otto starts listening for the question.
export class WakeService {
  private worker: Worker | null = null;
  private name = "Otto";
  private paused = false;
  private status: WakeStatus = { state: "off" };

  constructor(
    private readonly modelsDir: string,
    private readonly onWake: (event: WakeEvent) => void,
    private readonly onStatus: (status: WakeStatus) => void,
    /** Development only: prints levels and what was heard. */
    private readonly diagnostics: WakeDiagnostics | null = null,
  ) {}

  current(): WakeStatus {
    return this.status;
  }

  enable(name: string): WakeStatus {
    this.name = name.trim() || "Otto";
    if (this.worker) return this.status;
    const missing = MODEL_FILES.filter(
      (file) => !existsSync(join(this.modelsDir, file)),
    );
    if (missing.length > 0) {
      return this.set({
        state: "unavailable",
        message:
          "Os modelos de voz não estão instalados (rode npm run models).",
      });
    }
    this.set({ state: "starting" });
    this.worker = new Worker(join(__dirname, "wake.worker.js"), {
      workerData: { modelsDir: this.modelsDir },
    });
    this.worker.on("message", (message: WorkerMessage) => this.handle(message));
    this.worker.on("error", (error) => {
      this.worker = null;
      this.set({
        state: "unavailable",
        message: `Falha ao ouvir: ${error.message}`,
      });
    });
    return this.status;
  }

  disable(): WakeStatus {
    void this.worker?.terminate();
    this.worker = null;
    return this.set({ state: "off" });
  }

  /** While Otto records, thinks or speaks it must not hear itself. */
  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.worker?.postMessage({ type: "reset" });
  }

  acceptAudio(samples: Float32Array): void {
    this.diagnostics?.audio(samples, this.paused, this.status.state);
    if (!this.worker || this.paused || this.status.state !== "listening")
      return;
    this.worker.postMessage({ type: "audio", samples }, [
      samples.buffer as ArrayBuffer,
    ]);
  }

  private handle(message: WorkerMessage): void {
    if (message.type === "ready") {
      this.set({ state: "listening" });
      return;
    }
    if (this.paused) return;
    const match = matchWakeWord(message.text, this.name);
    this.diagnostics?.phrase(message.text, match.wake);
    if (!match.wake) return;
    this.onWake(
      isQuestion(match.rest)
        ? {
            kind: "question",
            audioBase64: toBase64(encodeWav(message.samples)),
          }
        : { kind: "name" },
    );
  }

  private set(status: WakeStatus): WakeStatus {
    this.status = status;
    this.onStatus(status);
    return status;
  }
}

type WorkerMessage =
  { type: "ready" } | { type: "phrase"; text: string; samples: Float32Array };
