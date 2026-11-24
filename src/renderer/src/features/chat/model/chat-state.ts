// The conversation on screen. Kept as a pure reducer so it is testable.
export type ChatMessage = {
  id: string;
  role: "user" | "otto" | "error";
  text: string;
};

export type ChatState = {
  messages: ChatMessage[];
  /** The API conversation the next question continues (null: new one). */
  conversationId: string | null;
  pending: boolean;
};

export type ChatAction =
  | { type: "asked"; id: string; text: string }
  | { type: "answered"; id: string; text: string; conversationId: string }
  | { type: "failed"; id: string; message: string }
  | { type: "reset" };

export const INITIAL_CHAT: ChatState = {
  messages: [],
  conversationId: null,
  pending: false,
};

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
          ...state.messages,
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
    case "reset":
      return INITIAL_CHAT;
  }
}
