import { openMicrophone } from "@/features/voice/model/microphone";
import {
  DEFAULT_END_OF_SPEECH,
  EndOfSpeech,
} from "@/features/voice/model/end-of-speech";
import { downsample, encodeWav, rms, toBase64 } from "@shared/audio/wav";

export type Recording =
  | { status: "ok"; base64: string; mimeType: "audio/wav"; durationMs: number }
  | { status: "nothing" }
  | { status: "cancelled" }
  | { status: "no-microphone"; message: string };

export type ActiveRecording = {
  /** Resolves when the question is over (pause, limit or cancel). */
  result: Promise<Recording>;
  /** Ends now and keeps what was said. */
  stop(): void;
  cancel(): void;
};

// Records one spoken question from the microphone until the speaker pauses.
export function recordQuestion(
  onLevel?: (loudness: number) => void,
): ActiveRecording {
  let finish: (outcome: "done" | "nothing" | "cancelled") => void = () => {};
  const ended = new Promise<"done" | "nothing" | "cancelled">((resolve) => {
    finish = resolve;
  });

  const result = (async (): Promise<Recording> => {
    let stream: MediaStream;
    try {
      stream = await openMicrophone({
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    } catch {
      return {
        status: "no-microphone",
        message:
          "Não encontrei um microfone liberado. Confira o microfone e as permissões do Windows.",
      };
    }

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    // ScriptProcessor is enough for a few seconds of speech and needs no
    // separate worklet file.
    const processor = context.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    const detector = new EndOfSpeech(performance.now(), DEFAULT_END_OF_SPEECH);

    processor.onaudioprocess = (event) => {
      const block = new Float32Array(event.inputBuffer.getChannelData(0));
      chunks.push(block);
      const loudness = rms(block);
      onLevel?.(loudness);
      const phase = detector.feed(loudness, performance.now());
      if (phase === "done" || phase === "nothing") finish(phase);
    };
    source.connect(processor);
    processor.connect(context.destination);

    const outcome = await ended;
    processor.disconnect();
    source.disconnect();
    for (const track of stream.getTracks()) track.stop();
    const sampleRate = context.sampleRate;
    await context.close();

    if (outcome === "cancelled") return { status: "cancelled" };
    if (outcome === "nothing") return { status: "nothing" };
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    const pcm = downsample(samples, sampleRate);
    return {
      status: "ok",
      base64: toBase64(encodeWav(pcm)),
      mimeType: "audio/wav",
      durationMs: Math.round((total / sampleRate) * 1000),
    };
  })();

  return {
    result,
    stop: () => finish("done"),
    cancel: () => finish("cancelled"),
  };
}
