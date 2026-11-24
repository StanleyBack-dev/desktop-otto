import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  DEFAULT_VOICE_SETTINGS,
  type AskResult,
  type VoiceSettings,
} from "@shared/assistant";
import { chatClient } from "@/features/chat/api/chat.client";
import { chatReducer, INITIAL_CHAT } from "@/features/chat/model/chat-state";
import { speak, stopSpeaking } from "@/features/chat/model/speech";

const newId = () => crypto.randomUUID();

// The conversation with Otto: send a question, show and speak the answer.
export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_CHAT);
  const [voice, setVoice] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [speaking, setSpeaking] = useState(false);
  // Read by `send` without re-creating it on every answer.
  const conversationId = useRef<string | null>(null);
  useEffect(() => {
    conversationId.current = state.conversationId;
  }, [state.conversationId]);

  useEffect(() => {
    void chatClient.voiceSettings().then(setVoice);
    return stopSpeaking;
  }, []);

  const say = useCallback(
    (text: string) => {
      setSpeaking(true);
      void speak(text, {
        language: voice.language,
        rate: voice.speechRate,
        onEnd: () => setSpeaking(false),
      });
    },
    [voice],
  );

  const finish = useCallback(
    (result: AskResult) => {
      if (!result.ok) {
        dispatch({
          type: "failed",
          id: newId(),
          message: result.error.message,
        });
        return;
      }
      dispatch({
        type: "answered",
        id: newId(),
        text: result.answer.text,
        conversationId: result.answer.conversationId,
        question: result.answer.question,
      });
      if (voice.autoSpeak) say(result.answer.text);
    },
    [voice.autoSpeak, say],
  );

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) return;
      stopSpeaking();
      dispatch({ type: "asked", id: newId(), text: question });
      finish(
        await chatClient.ask({
          text: question,
          conversationId: conversationId.current,
        }),
      );
    },
    [finish],
  );

  /** A recorded question (WAV base64); the transcript replaces the placeholder. */
  const sendVoice = useCallback(
    async (audioBase64: string) => {
      stopSpeaking();
      dispatch({ type: "asked", id: newId(), text: "🎤 …" });
      finish(
        await chatClient.askByVoice({
          audioBase64,
          mimeType: "audio/wav",
          conversationId: conversationId.current,
        }),
      );
    },
    [finish],
  );

  /** Shows Otto's own message (the briefing) and reads it as an answer. */
  const announce = useCallback(
    (title: string, text: string) => {
      dispatch({ type: "announced", id: newId(), title, text });
      if (voice.autoSpeak) say(text);
    },
    [voice.autoSpeak, say],
  );

  return {
    ...state,
    voice,
    speaking,
    send,
    sendVoice,
    announce,
    say,
    stop: () => {
      stopSpeaking();
      setSpeaking(false);
    },
    reset: () => {
      stopSpeaking();
      setSpeaking(false);
      dispatch({ type: "reset" });
    },
  };
}
