import type { ChatMessage } from "@/features/chat/model/chat-state";

const STYLES: Record<ChatMessage["role"], string> = {
  user: "ml-10 self-end bg-brand text-white",
  otto: "mr-10 self-start bg-surface-muted",
  error:
    "mr-10 self-start border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300",
};

export function MessageBubble({
  message,
  onSpeak,
}: {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
}) {
  return (
    <div
      className={`group flex max-w-[85%] flex-col gap-1 rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${STYLES[message.role]}`}
    >
      {message.text}
      {message.role === "otto" && onSpeak && (
        <button
          type="button"
          onClick={() => onSpeak(message.text)}
          className="self-end text-xs text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          Ouvir
        </button>
      )}
    </div>
  );
}
