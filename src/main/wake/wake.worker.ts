// Runs in a worker thread so local transcription never blocks the app.
// Receives 16 kHz mono audio, finds phrases with Silero VAD and transcribes
// the short ones with Whisper tiny (offline). Only the text and the phrase
// audio go back to the main thread; nothing leaves the PC from here.
import { join } from "path";
import { parentPort, workerData } from "worker_threads";
import sherpa from "sherpa-onnx-node";

type Input = { type: "audio"; samples: Float32Array } | { type: "reset" };

const SAMPLE_RATE = 16_000;
const WINDOW = 512;
/** Wake phrases are short; longer speech (a call, the TV) is skipped. */
const MAX_PHRASE_SECONDS = 8;

const models: string = (workerData as { modelsDir: string }).modelsDir;

const vadConfig = {
  sileroVad: {
    model: join(models, "silero_vad.onnx"),
    threshold: 0.5,
    minSpeechDuration: 0.25,
    minSilenceDuration: 0.6,
    windowSize: WINDOW,
  },
  sampleRate: SAMPLE_RATE,
  numThreads: 1,
  debug: 0,
};
let vad = new sherpa.Vad(vadConfig, 30);

const recognizer = new sherpa.OfflineRecognizer({
  featConfig: { sampleRate: SAMPLE_RATE, featureDim: 80 },
  modelConfig: {
    whisper: {
      encoder: join(models, "tiny-encoder.int8.onnx"),
      decoder: join(models, "tiny-decoder.int8.onnx"),
      language: "pt",
      task: "transcribe",
    },
    tokens: join(models, "tiny-tokens.txt"),
    numThreads: 2,
    provider: "cpu",
    debug: 0,
  },
});

let pending = new Float32Array(0);

// The last seconds of audio, to add a little before each phrase: the VAD
// starts a phrase slightly late and the name is its first word.
const PRE_ROLL = Math.round(1.2 * SAMPLE_RATE);
const HISTORY = (MAX_PHRASE_SECONDS + 4) * SAMPLE_RATE;
let history = new Float32Array(HISTORY);
/** Samples fed to the VAD since it was (re)created. */
let fed = 0;

function remember(window: Float32Array): void {
  for (let i = 0; i < window.length; i++) {
    history[(fed + i) % HISTORY] = window[i];
  }
  fed += window.length;
}

/** Samples [from, to) of the VAD timeline, when still in the history. */
function recall(from: number, to: number): Float32Array | null {
  if (from < 0 || to > fed || fed - from > HISTORY) return null;
  const out = new Float32Array(to - from);
  for (let i = from; i < to; i++) out[i - from] = history[i % HISTORY];
  return out;
}

function transcribe(samples: Float32Array): string {
  const stream = recognizer.createStream();
  stream.acceptWaveform({ sampleRate: SAMPLE_RATE, samples });
  recognizer.decode(stream);
  return recognizer.getResult(stream).text.trim();
}

parentPort?.on("message", (message: Input) => {
  if (message.type === "reset") {
    vad = new sherpa.Vad(vadConfig, 30);
    pending = new Float32Array(0);
    history = new Float32Array(HISTORY);
    fed = 0;
    return;
  }
  // The VAD takes fixed windows: keep the remainder for the next chunk.
  const joined = new Float32Array(pending.length + message.samples.length);
  joined.set(pending);
  joined.set(message.samples, pending.length);
  let offset = 0;
  for (; offset + WINDOW <= joined.length; offset += WINDOW) {
    const window = joined.subarray(offset, offset + WINDOW);
    remember(window);
    vad.acceptWaveform(window);
  }
  pending = joined.slice(offset);

  while (!vad.isEmpty()) {
    // false: a copy instead of an external buffer (Electron refuses those).
    const segment = vad.front(false);
    vad.pop();
    if (segment.samples.length > MAX_PHRASE_SECONDS * SAMPLE_RATE) continue;
    const start = Math.max(0, segment.start - PRE_ROLL);
    const samples =
      recall(start, segment.start + segment.samples.length) ??
      Float32Array.from(segment.samples);
    parentPort?.postMessage(
      { type: "phrase", text: transcribe(samples), samples },
      [samples.buffer as ArrayBuffer],
    );
  }
});

parentPort?.postMessage({ type: "ready" });
