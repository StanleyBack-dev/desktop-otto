import { describe, expect, it } from "vitest";
import { EndOfSpeech } from "./end-of-speech";
import { downsample, encodeWav, rms, toBase64 } from "@shared/audio/wav";

const OPTIONS = { threshold: 0.02, silenceMs: 1000, waitMs: 3000, maxMs: 8000 };

describe("EndOfSpeech", () => {
  it("ends after a pause once something was said", () => {
    const d = new EndOfSpeech(0, OPTIONS);
    expect(d.feed(0.001, 100)).toBe("waiting");
    expect(d.feed(0.1, 500)).toBe("speaking");
    expect(d.feed(0.001, 1200)).toBe("speaking");
    expect(d.feed(0.001, 1600)).toBe("done");
    expect(d.feed(0.5, 1700)).toBe("done");
  });

  it("gives up when nobody speaks and caps long questions", () => {
    const quiet = new EndOfSpeech(0, OPTIONS);
    expect(quiet.feed(0.001, 3100)).toBe("nothing");
    const long = new EndOfSpeech(0, OPTIONS);
    long.feed(0.1, 100);
    expect(long.feed(0.1, 8100)).toBe("done");
  });
});

describe("wav", () => {
  it("downsamples by averaging", () => {
    const input = Float32Array.from([0, 1, 0, 1, 0.5, 0.5]);
    expect(Array.from(downsample(input, 48_000, 16_000))).toEqual(
      [1 / 3, 2 / 3].map((v) => Math.fround(v)),
    );
    expect(downsample(input, 16_000, 16_000)).toBe(input);
  });

  it("writes a 16 kHz mono 16-bit PCM header and clamps samples", () => {
    const bytes = encodeWav(Float32Array.from([0, 1, -1, 2]));
    const view = new DataView(bytes.buffer);
    const text = (offset: number) =>
      String.fromCharCode(...bytes.subarray(offset, offset + 4));
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint32(40, true)).toBe(8);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
    expect(view.getInt16(50, true)).toBe(32767);
    expect(bytes.length).toBe(52);
  });

  it("measures loudness and encodes base64", () => {
    expect(rms(Float32Array.from([0.5, -0.5]))).toBeCloseTo(0.5);
    expect(rms(new Float32Array())).toBe(0);
    expect(toBase64(Uint8Array.from([104, 105]))).toBe("aGk=");
  });
});
