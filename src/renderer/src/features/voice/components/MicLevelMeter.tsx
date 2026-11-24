import { useEffect, useState } from "react";
import { rms } from "@shared/audio/wav";
import { openMicrophone } from "@/features/voice/model/microphone";

/** Loudness where speech usually is (same scale as the name listener). */
const SPEECH_LEVEL = 0.02;

// Live level of the chosen microphone, to see which one hears you. Same
// audio settings as the name listener; restarts when the choice changes.
export function MicLevelMeter({ microphoneKey }: { microphoneKey: string }) {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const stream = await openMicrophone({
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(2048, 1, 1);
        processor.onaudioprocess = (event) => {
          const value = rms(event.inputBuffer.getChannelData(0));
          setLevel(value);
          setPeak((current) => Math.max(current * 0.995, value));
        };
        source.connect(processor);
        processor.connect(context.destination);
        stop = () => {
          processor.disconnect();
          source.disconnect();
          for (const track of stream.getTracks()) track.stop();
          void context.close();
        };
      } catch {
        setError("Não consegui abrir este microfone.");
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [microphoneKey]);

  if (error) return <p className="text-xs text-red-500">{error}</p>;
  // 0.1 RMS fills the bar: loud speech close to the microphone.
  const width = Math.min(100, (level / 0.1) * 100);
  const hears = peak >= SPEECH_LEVEL;
  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-[width] duration-75 ${
            hears ? "bg-brand" : "bg-ink-muted"
          }`}
          style={{ width: `${width}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-ink"
          style={{ left: `${(SPEECH_LEVEL / 0.1) * 100}%` }}
          title="Nível de fala"
        />
      </div>
      <p className="text-xs text-ink-muted">
        {hears
          ? "Estou ouvindo você por este microfone."
          : "Fale algo: a barra precisa passar da marca. Se não passar, escolha outro microfone ou confira se ele está mudo."}
      </p>
    </div>
  );
}
