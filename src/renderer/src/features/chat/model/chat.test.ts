import { describe, expect, it } from "vitest";
import { chatReducer, INITIAL_CHAT } from "./chat-state";
import { chooseVoice, pickVoice } from "./speech";

describe("chatReducer", () => {
  it("keeps the conversation and its id across answers", () => {
    let state = chatReducer(INITIAL_CHAT, {
      type: "asked",
      id: "1",
      text: "Oi",
    });
    expect(state.pending).toBe(true);
    state = chatReducer(state, {
      type: "answered",
      id: "2",
      text: "Olá!",
      conversationId: "c1",
    });
    expect(state).toMatchObject({ pending: false, conversationId: "c1" });
    state = chatReducer(state, { type: "asked", id: "3", text: "E aí?" });
    state = chatReducer(state, {
      type: "failed",
      id: "4",
      message: "Sem rede",
    });
    expect(state.messages.map((m) => m.role)).toEqual([
      "user",
      "otto",
      "user",
      "error",
    ]);
    // A failure keeps the conversation going.
    expect(state.conversationId).toBe("c1");
    expect(chatReducer(state, { type: "reset" })).toEqual(INITIAL_CHAT);
  });
});

describe("pickVoice", () => {
  const voice = (
    name: string,
    lang: string,
    localService = true,
    isDefault = false,
  ) => ({ name, lang, localService, default: isDefault });

  it("prefers the exact language, local and natural voices", () => {
    const voices = [
      voice("Microsoft David - English", "en-US", true, true),
      voice("Google português do Brasil", "pt-BR", false),
      voice("Microsoft Maria - Portuguese (Brazil)", "pt-BR"),
      voice("Microsoft Francisca Online (Natural)", "pt-BR"),
      voice("Microsoft Helia - Portuguese (Portugal)", "pt-PT"),
    ];
    expect(pickVoice(voices, "pt-BR")?.name).toBe(
      "Microsoft Francisca Online (Natural)",
    );
    expect(pickVoice(voices, "pt-PT")?.name).toBe(
      "Microsoft Helia - Portuguese (Portugal)",
    );
    expect(pickVoice(voices, "en-GB")?.name).toBe("Microsoft David - English");
    expect(pickVoice(voices, "es-ES")).toBeNull();
  });
});

describe("chooseVoice", () => {
  const voices = [
    {
      name: "Maria",
      lang: "pt-BR",
      localService: true,
      default: false,
      voiceURI: "maria",
    },
    {
      name: "Francisca Natural",
      lang: "pt-BR",
      localService: true,
      default: false,
      voiceURI: "francisca",
    },
  ];

  it("uses the chosen voice, or the best one when it is gone", () => {
    expect(chooseVoice(voices, "pt-BR", "maria")?.name).toBe("Maria");
    expect(chooseVoice(voices, "pt-BR", "uninstalled")?.name).toBe(
      "Francisca Natural",
    );
    expect(chooseVoice(voices, "pt-BR", "")?.name).toBe("Francisca Natural");
  });
});
