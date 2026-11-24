// The conversation on screen. Kept as a pure reducer so it is testable.
export type ChatMessage = {
  id: string;
  role: "user" | "otto" | "error";
  text: string;
  /** Shown above the text (e.g. "Resumo do dia"). */
  title?: string;
};

export type ChatState = {
  messages: ChatMessage[];
  /** The API conversation the next question continues (null: new one). */
  conversationId: string | null;
  pending: boolean;
};

export type ChatAction =
  | { type: "asked"; id: string; text: string }
  | {
      type: "answered";
      id: string;
      text: string;
      conversationId: string;
      /** What the API understood (the transcript of a spoken question). */
      question?: string;
    }
  | { type: "failed"; id: string; message: string }
  | { type: "announced"; id: string; title: string; text: string }
  | { type: "reset" };

export const INITIAL_CHAT: ChatState = {
  messages: [],
  conversationId: null,
  pending: false,
};

/** Shows the transcript in place of the "spoken question" placeholder. */
function withLastQuestion(
  messages: ChatMessage[],
  question: string | undefined,
): ChatMessage[] {
  if (!question) return messages;
  const index = messages.map((m) => m.role).lastIndexOf("user");
  if (index < 0) return messages;
  return messages.map((message, i) =>
    i === index ? { ...message, text: question } : message,
  );
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "asked":
      return {
        ...state,
        pending: true,
        messages: [
          ...state.messages,
          { id: action.id, role: "user", text: action.text },
        ],
      };
    case "answered":
      return {
        conversationId: action.conversationId,
        pending: false,
        messages: [
          ...withLastQuestion(state.messages, action.question),
          { id: action.id, role: "otto", text: action.text },
        ],
      };
    case "failed":
      return {
        ...state,
        pending: false,
        messages: [
          ...state.messages,
          { id: action.id, role: "error", text: action.message },
        ],
      };
    case "announced":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: "otto",
            title: action.title,
            text: action.text,
          },
        ],
      };
    case "reset":
      return INITIAL_CHAT;
  }
}
