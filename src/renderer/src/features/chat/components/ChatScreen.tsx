import { useEffect, useRef } from "react";
import type { SessionUser } from "@shared/session";
import { Alert, Button, ListeningMark } from "@/design-system";
import { chatClient } from "@/features/chat/api/chat.client";
import { Composer } from "@/features/chat/components/Composer";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { useChat } from "@/features/chat/model/use-chat";

const EXAMPLES = [
  "Qual o clima agora?",
  "O que eu tenho hoje?",
  "Como se fala “prazo de entrega” em inglês?",
];

export function ChatScreen({
  user,
  offline,
  askShortcut,
  onOpenSettings,
}: {
  user: SessionUser;
  offline: boolean;
  askShortcut: string | null;
  onOpenSettings: () => void;
}) {
  const chat = useChat();
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => chatClient.onFocusQuestion(() => input.current?.focus()), []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length, chat.pending]);

  return (
    <main className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <ListeningMark size={28} active={chat.pending || chat.speaking} />
          <span className="font-semibold">{chat.voice.assistantName}</span>
        </div>
        <div className="flex gap-1">
          {chat.speaking && (
            <Button variant="ghost" onClick={chat.stop}>
              Parar
            </Button>
          )}
          {chat.messages.length > 0 && (
            <Button variant="ghost" onClick={chat.reset}>
              Nova conversa
            </Button>
          )}
          <Button variant="ghost" onClick={onOpenSettings}>
            Ajustes
          </Button>
        </div>
      </header>

      {offline && (
        <div className="px-4 pt-3">
          <Alert tone="warning">
            Sem conexão com o servidor do Otto. Tento de novo sozinho.
          </Alert>
        </div>
      )}

      <section
        aria-live="polite"
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {chat.messages.length === 0 ? (
          <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center">
            <p className="text-lg font-semibold">
              Oi, {user.name.split(" ")[0]}! Em que posso ajudar?
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => void chat.send(example)}
                  className="rounded-xl border border-line px-3 py-2 text-sm text-ink-muted hover:border-brand hover:text-ink"
                >
                  {example}
                </button>
              ))}
            </div>
            {askShortcut && (
              <p className="text-xs text-ink-muted">
                De qualquer lugar do Windows: {askShortcut}
              </p>
            )}
          </div>
        ) : (
          chat.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSpeak={chat.say}
            />
          ))
        )}
        {chat.pending && (
          <p className="self-start text-sm text-ink-muted">Pensando…</p>
        )}
        <div ref={bottom} />
      </section>

      <Composer ref={input} disabled={chat.pending} onSend={chat.send} />
    </main>
  );
}
