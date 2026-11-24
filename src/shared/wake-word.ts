// Finds the assistant's name at the start of a locally transcribed phrase.
// The name comes from the settings (nothing fixed); the small offline
// model often mishears it ("Otto" → "auto", "oto", "otu"), so words are
// compared by a rough Portuguese sound key instead of their spelling.

const GREETINGS = new Set(["ei", "hey", "oi", "ok", "ola", "e", "o", "hei"]);

export function normalizeWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** A rough sound key: "Otto", "oto", "otu", "auto", "hoto" → "oto". */
export function soundKey(word: string): string {
  return word
    .toLowerCase()
    .replace(/^h/, "")
    .replace(/au/g, "o")
    .replace(/ou/g, "o")
    .replace(/([a-z])\1+/g, "$1")
    .replace(/u$/, "o")
    .replace(/e$/, "i");
}

const VOWELS = /[aeiou]/;

/**
 * The word sounds like the name: the same key, or the key with one extra
 * consonant inside it ("opto" for "oto"). Not at the start ("foto") and
 * never an extra vowel ("oito") or a swapped letter ("ato").
 */
export function soundsLike(word: string, nameKey: string): boolean {
  const key = soundKey(word);
  if (key === nameKey) return true;
  if (key.length !== nameKey.length + 1) return false;
  for (let i = 1; i < key.length - 1; i++) {
    if (
      !VOWELS.test(key[i]) &&
      key.slice(0, i) + key.slice(i + 1) === nameKey
    ) {
      return true;
    }
  }
  return false;
}

export type WakeMatch =
  | { wake: false }
  /** `rest`: what was said after the name (the question, if any). */
  | { wake: true; rest: string };

export function matchWakeWord(transcript: string, name: string): WakeMatch {
  const nameKey = soundKey(normalizeWords(name).join(""));
  if (!nameKey) return { wake: false };
  const words = normalizeWords(transcript);
  // The name first, or right after a greeting ("ei Otto", "ok Otto").
  for (const index of [0, 1]) {
    if (index === 1 && !GREETINGS.has(words[0] ?? "")) break;
    const word = words[index];
    if (word && soundsLike(word, nameKey)) {
      // "auto auto": the small model may repeat the name.
      const rest = words
        .slice(index + 1)
        .filter((w, i) => !(i === 0 && soundsLike(w, nameKey)));
      return { wake: true, rest: rest.join(" ") };
    }
  }
  return { wake: false };
}

/** Enough words after the name to be a question on its own. */
export function isQuestion(rest: string): boolean {
  return rest.split(" ").filter(Boolean).length >= 2;
}
