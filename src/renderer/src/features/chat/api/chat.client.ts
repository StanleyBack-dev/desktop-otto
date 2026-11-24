import type { AskRequest, AskResult, VoiceSettings } from "@shared/assistant";

// Questions to the assistant through the preload bridge.
export const chatClient = {
  ask: (request: AskRequest): Promise<AskResult> =>
    window.otto.assistant.ask(request),
  voiceSettings: (): Promise<VoiceSettings> =>
    window.otto.assistant.voiceSettings(),
  onFocusQuestion: (listener: () => void): (() => void) =>
    window.otto.app.onFocusQuestion(listener),
};
