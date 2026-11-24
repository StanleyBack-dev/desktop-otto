import { useCallback, useEffect, useRef, useState } from "react";
import {
  recordQuestion,
  type ActiveRecording,
} from "@/features/voice/model/recorder";

export type VoiceInputState =
  | { status: "idle" }
  | { status: "listening"; level: number }
  | { status: "error"; message: string };

// Push to talk: start listening, stop at the pause (or on a second click)
// and hand the recording over.
export function useVoiceInput(onRecorded: (audioBase64: string) => void) {
  const [state, setState] = useState<VoiceInputState>({ status: "idle" });
  const active = useRef<ActiveRecording | null>(null);

  const start = useCallback(async () => {
    if (active.current) return;
    setState({ status: "listening", level: 0 });
    const recording = recordQuestion((level) =>
      setState((current) =>
        current.status === "listening"
          ? { status: "listening", level }
          : current,
      ),
    );
    active.current = recording;
    const result = await recording.result;
    active.current = null;
    switch (result.status) {
      case "ok":
        setState({ status: "idle" });
        onRecorded(result.base64);
        break;
      case "nothing":
        setState({ status: "error", message: "Não ouvi nada. Tente de novo." });
        break;
      case "no-microphone":
        setState({ status: "error", message: result.message });
        break;
      default:
        setState({ status: "idle" });
    }
  }, [onRecorded]);

  /** A click while listening ends the question now. */
  const toggle = useCallback(() => {
    if (active.current) active.current.stop();
    else void start();
  }, [start]);

  useEffect(() => () => active.current?.cancel(), []);

  return {
    state,
    start,
    toggle,
    cancel: () => active.current?.cancel(),
    clearError: () => setState({ status: "idle" }),
  };
}
