// Reads the answers aloud with the voices installed on Windows (offline,
// free). The language and speed come from the owner's settings.

type VoiceLike = Pick<
  SpeechSynthesisVoice,
  "lang" | "name" | "localService" | "default"
>;

/**
 * The best installed voice for a language: exact tag first (pt-BR), then
 * the same language (pt-PT), preferring local voices (no network) and the
 * Windows "Natural" voices when present.
 */
export function pickVoice<T extends VoiceLike>(
  voices: readonly T[],
  language: string,
): T | null {
  const tag = language.toLowerCase();
  const base = tag.split("-")[0];
  const score = (voice: T) => {
    const lang = voice.lang.toLowerCase().replace("_", "-");
    let points = 0;
    if (lang === tag) points += 100;
    else if (lang.split("-")[0] === base) points += 50;
    else return -1;
    if (voice.localService) points += 10;
    if (/natural/i.test(voice.name)) points += 5;
    if (voice.default) points += 1;
    return points;
  };
  let best: T | null = null;
  let bestScore = -1;
  for (const voice of voices) {
    const points = score(voice);
    if (points > bestScore) {
      best = voice;
      bestScore = points;
    }
  }
  return best;
}

const VOICE_KEY = "otto.voice";

/** The voice chosen in Ajustes on this PC ("" = automatic). */
export function preferredVoice(): string {
  try {
    return localStorage.getItem(VOICE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setPreferredVoice(voiceURI: string): void {
  try {
    if (voiceURI) localStorage.setItem(VOICE_KEY, voiceURI);
    else localStorage.removeItem(VOICE_KEY);
  } catch {
    // Not saved: the automatic choice keeps being used.
  }
}

/**
 * The chosen voice when it is installed, otherwise the best one for the
 * language.
 */
export function chooseVoice<T extends VoiceLike & { voiceURI: string }>(
  voices: readonly T[],
  language: string,
  chosen: string,
): T | null {
  return (
    (chosen ? voices.find((voice) => voice.voiceURI === chosen) : undefined) ??
    pickVoice(voices, language)
  );
}

/** Installed voices of the language (pt-BR, then pt-PT…), best first. */
export async function voicesFor(
  language: string,
): Promise<SpeechSynthesisVoice[]> {
  const base = language.toLowerCase().split("-")[0];
  const voices = (await loadVoices()).filter(
    (voice) => voice.lang.toLowerCase().split(/[-_]/)[0] === base,
  );
  const exact = (voice: SpeechSynthesisVoice) =>
    voice.lang.toLowerCase().replace("_", "-") === language.toLowerCase();
  return voices.sort(
    (a, b) =>
      Number(exact(b)) - Number(exact(a)) || a.name.localeCompare(b.name),
  );
}

/** Voices load asynchronously in Chromium. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) return Promise.resolve(voices);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
}

export async function speak(
  text: string,
  options: {
    language: string;
    rate: number;
    /** A voiceURI to use instead of the saved choice (the preview). */
    voice?: string;
    onEnd?: () => void;
  },
): Promise<void> {
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice(
    await loadVoices(),
    options.language,
    options.voice ?? preferredVoice(),
  );
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? options.language;
  utterance.rate = Math.min(2, Math.max(0.5, options.rate));
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  speechSynthesis.cancel();
}
