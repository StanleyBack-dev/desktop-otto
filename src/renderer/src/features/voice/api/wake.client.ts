import type { WakeEvent, WakeStatus } from "@shared/wake";

// The background name listener, through the preload bridge.
export const wakeClient = {
  enable: (name: string): Promise<WakeStatus> => window.otto.wake.enable(name),
  disable: (): Promise<WakeStatus> => window.otto.wake.disable(),
  status: (): Promise<WakeStatus> => window.otto.wake.status(),
  sendAudio: (samples: Float32Array): void =>
    window.otto.wake.sendAudio(samples),
  setPaused: (paused: boolean): void => window.otto.wake.setPaused(paused),
  onHeard: (listener: (event: WakeEvent) => void): (() => void) =>
    window.otto.wake.onHeard(listener),
  onStatus: (listener: (status: WakeStatus) => void): (() => void) =>
    window.otto.wake.onStatus(listener),
  /** Saves the setting in the account. */
  saveSetting: (enabled: boolean): Promise<boolean> =>
    window.otto.assistant.setWakeWord(enabled),
};
