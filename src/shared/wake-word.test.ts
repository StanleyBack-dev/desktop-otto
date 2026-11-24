import { describe, expect, it } from "vitest";
import { isQuestion, matchWakeWord, soundKey } from "./wake-word";

describe("matchWakeWord", () => {
  it("hears the name as the small model writes it", () => {
    for (const transcript of [
      "Otto",
      "Otto.",
      "auto auto",
      "Oto, tudo bem?",
      "Ótu",
      "Ei Otto",
      "OK Otto, que horas são?",
    ]) {
      expect(matchWakeWord(transcript, "Otto").wake).toBe(true);
    }
  });

  it("returns the question said after the name", () => {
    expect(matchWakeWord("Otto, que hora são agora?", "Otto")).toEqual({
      wake: true,
      rest: "que hora sao agora",
    });
    expect(matchWakeWord("auto auto", "Otto")).toEqual({
      wake: true,
      rest: "",
    });
  });

  it("ignores the name in the middle and similar words", () => {
    for (const transcript of [
      "O carro é automático e o porto fica perto",
      "Às 8 horas eu tenho reunião",
      "E o outro, como está o tempo",
      "eu falei com o Otto ontem",
      "Arro",
      "",
    ]) {
      expect(matchWakeWord(transcript, "Otto").wake).toBe(false);
    }
  });

  it("accepts an extra consonant inside the name, nothing looser", () => {
    expect(matchWakeWord("Ópto, que horas são agora.", "Otto")).toEqual({
      wake: true,
      rest: "que horas sao agora",
    });
    for (const transcript of [
      "Foto da viagem ficou boa",
      "Oito da manhã eu acordo",
      "Ato contínuo ele saiu",
      "Ovo frito no almoço",
    ]) {
      expect(matchWakeWord(transcript, "Otto").wake).toBe(false);
    }
  });

  it("follows the configured name", () => {
    expect(matchWakeWord("Jarvis, abre a agenda", "Jarvis").wake).toBe(true);
    expect(matchWakeWord("Otto", "Jarvis").wake).toBe(false);
  });

  it("tells a question from the name alone", () => {
    expect(isQuestion("que horas sao")).toBe(true);
    expect(isQuestion("")).toBe(false);
    expect(isQuestion("oi")).toBe(false);
    expect(soundKey("Otto")).toBe(soundKey("auto"));
  });
});
