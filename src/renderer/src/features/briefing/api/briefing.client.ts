import type { Briefing } from "@shared/briefing";

// The daily briefing through the preload bridge.
export const briefingClient = {
  today: (): Promise<Briefing> => window.otto.briefing.today(),
  regenerate: (): Promise<Briefing> => window.otto.briefing.regenerate(),
  onPresented: (listener: (briefing: Briefing) => void): (() => void) =>
    window.otto.briefing.onPresented(listener),
};
