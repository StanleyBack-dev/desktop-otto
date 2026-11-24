// The part of sherpa-onnx-node Otto uses (the package ships no types).
declare module "sherpa-onnx-node" {
  type Wave = { sampleRate: number; samples: Float32Array };

  export class Vad {
    constructor(config: Record<string, unknown>, bufferSizeInSeconds: number);
    acceptWaveform(samples: Float32Array): void;
    isEmpty(): boolean;
    /** enableExternalBuffer must be false in Electron. */
    front(enableExternalBuffer?: boolean): {
      samples: Float32Array;
      start: number;
    };
    pop(): void;
  }

  export class OfflineStream {
    acceptWaveform(wave: Wave): void;
  }

  export class OfflineRecognizer {
    constructor(config: Record<string, unknown>);
    createStream(): OfflineStream;
    decode(stream: OfflineStream): void;
    getResult(stream: OfflineStream): { text: string };
  }

  const sherpa: {
    Vad: typeof Vad;
    OfflineRecognizer: typeof OfflineRecognizer;
  };
  export default sherpa;
}
