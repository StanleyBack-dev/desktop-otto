import { useEffect, useRef, useState } from "react";
import type { WakeEvent, WakeStatus } from "@shared/wake";
import { wakeClient } from "@/features/voice/api/wake.client";
import { preferredMicrophone } from "@/features/voice/model/microphone";
import { startWakeCapture } from "@/features/voice/model/wake-capture";

// Keeps the background name listener running while it is enabled: starts
// the local listener, streams the microphone to it and reports the name.
export function useWakeWord(options: {
  enabled: boolean;
  name: string;
  /** Recording, thinking or speaking: Otto must not hear itself. */
  paused: boolean;
  onHeard: (event: WakeEvent) => void;
}): WakeStatus {
  const { enabled, name, paused } = options;
  // Read once per mount: Ajustes is another screen, so a new choice is
  // picked up when the chat comes back.
  const [microphone] = useState(preferredMicrophone);
  const [status, setStatus] = useState<WakeStatus>({ state: "off" });
  const onHeard = useRef(options.onHeard);
  useEffect(() => {
    onHeard.current = options.onHeard;
  });

  useEffect(() => wakeClient.onStatus(setStatus), []);
  useEffect(() => wakeClient.onHeard((event) => onHeard.current(event)), []);
  useEffect(() => wakeClient.setPaused(paused), [paused]);

  useEffect(() => {
    if (!enabled) {
      void wakeClient.disable().then(setStatus);
      return;
    }
    let stop: (() => void) | null = null;
    let cancelled = false;
    void (async () => {
      const started = await wakeClient.enable(name);
      setStatus(started);
      if (started.state === "unavailable" || cancelled) return;
      try {
        const close = await startWakeCapture(wakeClient.sendAudio);
        if (cancelled) close();
        else stop = close;
      } catch {
        setStatus({
          state: "unavailable",
          message: "Sem acesso ao microfone. Confira as permissões do Windows.",
        });
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [enabled, name, microphone]);

  return status;
}
