import {
  DEFAULT_VOICE_SETTINGS,
  QUESTION_MAX_LENGTH,
  type AskRequest,
  type AskResult,
  type VoiceSettings,
} from "@shared/assistant";
import { ApiError } from "../api/graphql-client";
import type { SessionService } from "../session/session.service";

const ASK = `mutation Ask($input: AskInput!) {
  ask(input: $input) { conversation { id } answer { text } toolsUsed }
}`;
const SETTINGS = `query VoiceSettings {
  mySettings { assistantName language speechRate autoSpeak }
}`;

// Questions to the assistant and the voice preferences, through the
// signed-in session.
export class AssistantService {
  constructor(private readonly session: SessionService) {}

  async ask(request: AskRequest): Promise<AskResult> {
    const text = request.text.trim();
    if (!text || text.length > QUESTION_MAX_LENGTH) {
      return {
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: `Escreva uma pergunta de até ${QUESTION_MAX_LENGTH} caracteres.`,
        },
      };
    }
    try {
      const { ask } = await this.session.call<{
        ask: {
          conversation: { id: string };
          answer: { text: string };
          toolsUsed: string[];
        };
      }>(ASK, {
        input: {
          text,
          ...(request.conversationId
            ? { conversationId: request.conversationId }
            : {}),
        },
      });
      return {
        ok: true,
        answer: {
          conversationId: ask.conversation.id,
          text: ask.answer.text,
          toolsUsed: ask.toolsUsed,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof ApiError
            ? error.toFailure()
            : {
                code: "UNKNOWN",
                message: "Não consegui perguntar agora. Tente de novo.",
              },
      };
    }
  }

  /** The voice preferences; the defaults when the API is unreachable. */
  async voiceSettings(): Promise<VoiceSettings> {
    try {
      const { mySettings } = await this.session.call<{
        mySettings: VoiceSettings;
      }>(SETTINGS);
      return mySettings;
    } catch {
      return DEFAULT_VOICE_SETTINGS;
    }
  }
}
