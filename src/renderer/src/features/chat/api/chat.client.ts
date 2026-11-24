import type {
  AskRequest,
  AskResult,
  VoiceAskRequest,
  VoiceSettings,
} from "@shared/assistant";

// Questions to the assistant through the preload bridge.
export const chatClient = {
  ask: (request: AskRequest): Promise<AskResult> =>
    window.otto.assistant.ask(request),
  askByVoice: (request: VoiceAskRequest): Promise<AskResult> =>
    window.otto.assistant.askByVoice(request),
  onStartListening: (listener: () => void): (() => void) =>
    window.otto.app.onStartListening(listener),
  voiceSettings: (): Promise<VoiceSettings> =>
    window.otto.assistant.voiceSettings(),
  onFocusQuestion: (listener: () => void): (() => void) =>
    window.otto.app.onFocusQuestion(listener),
};
