import { downsample } from "@shared/audio/wav";
import { openMicrophone } from "@/features/voice/model/microphone";

// Streams the microphone (16 kHz mono) to the local name listener in the
// main process. The audio never leaves the PC from here.
export async function startWakeCapture(
  send: (samples: Float32Array) => void,
): Promise<() => void> {
  const stream = await openMicrophone({
    // Noise suppression and echo cancellation dull the first word (the
    // name), so they stay off; Otto pauses this listener while it speaks.
    // Automatic gain stays on: quiet laptop microphones need it.
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
  });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (event) => {
    const block = new Float32Array(event.inputBuffer.getChannelData(0));
    send(downsample(block, context.sampleRate));
  };
  source.connect(processor);
  processor.connect(context.destination);

  return () => {
    processor.disconnect();
    source.disconnect();
    for (const track of stream.getTracks()) track.stop();
    void context.close();
  };
}
