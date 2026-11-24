import {
  AUDIO_BASE64_MAX_LENGTH,
  DEFAULT_VOICE_SETTINGS,
  QUESTION_MAX_LENGTH,
  type AskRequest,
  type AskResult,
  type VoiceAskRequest,
  type VoiceSettings,
} from "@shared/assistant";
import type { ApiFailure } from "@shared/session";
import { ApiError } from "../api/graphql-client";
import type { SessionService } from "../session/session.service";

const ANSWER = `conversation { id } question { text } answer { text } toolsUsed`;
const ASK = `mutation Ask($input: AskInput!) { ask(input: $input) { ${ANSWER} } }`;
const ASK_BY_VOICE = `mutation AskByVoice($input: AskByVoiceInput!) { askByVoice(input: $input) { ${ANSWER} } }`;
const SETTINGS = `query VoiceSettings {
  mySettings { assistantName language speechRate autoSpeak }
}`;

type AnswerPayload = {
  conversation: { id: string };
  question: { text: string };
  answer: { text: string };
  toolsUsed: string[];
};

const invalid = (message: string): AskResult => ({
  ok: false,
  error: { code: "INVALID_INPUT", message },
});

// Questions to the assistant (typed or spoken) and the voice preferences,
// through the signed-in session.
export class AssistantService {
  constructor(private readonly session: SessionService) {}

  ask(request: AskRequest): Promise<AskResult> {
    const text = request.text.trim();
    if (!text || text.length > QUESTION_MAX_LENGTH) {
      return Promise.resolve(
        invalid(
          `Escreva uma pergunta de até ${QUESTION_MAX_LENGTH} caracteres.`,
        ),
      );
    }
    return this.send<{ ask: AnswerPayload }>(ASK, {
      input: { text, ...this.conversation(request.conversationId) },
    }).then((result) => (result.ok ? this.toResult(result.data.ask) : result));
  }

  askByVoice(request: VoiceAskRequest): Promise<AskResult> {
    if (
      request.mimeType !== "audio/wav" ||
      !request.audioBase64 ||
      request.audioBase64.length > AUDIO_BASE64_MAX_LENGTH
    ) {
      return Promise.resolve(invalid("Gravação inválida. Fale de novo."));
    }
    return this.send<{ askByVoice: AnswerPayload }>(ASK_BY_VOICE, {
      input: {
        audioBase64: request.audioBase64,
        mimeType: request.mimeType,
        ...this.conversation(request.conversationId),
      },
    }).then((result) =>
      result.ok ? this.toResult(result.data.askByVoice) : result,
    );
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

  private conversation(id: string | null) {
    return id ? { conversationId: id } : {};
  }

  private toResult(payload: AnswerPayload): AskResult {
    return {
      ok: true,
      answer: {
        conversationId: payload.conversation.id,
        question: payload.question.text,
        text: payload.answer.text,
        toolsUsed: payload.toolsUsed,
      },
    };
  }

  private async send<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<{ ok: true; data: T } | { ok: false; error: ApiFailure }> {
    try {
      return { ok: true, data: await this.session.call<T>(query, variables) };
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
}
