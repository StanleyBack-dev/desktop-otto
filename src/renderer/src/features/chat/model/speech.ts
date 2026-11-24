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
  options: { language: string; rate: number; onEnd?: () => void },
): Promise<void> {
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(await loadVoices(), options.language);
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
