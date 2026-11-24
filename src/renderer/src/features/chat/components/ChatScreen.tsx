import { useEffect, useRef } from "react";
import type { SessionUser } from "@shared/session";
import type { WakeStatus } from "@shared/wake";
import { Alert, Button, ListeningMark } from "@/design-system";
import { chatClient } from "@/features/chat/api/chat.client";
import { Composer } from "@/features/chat/components/Composer";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { useChat } from "@/features/chat/model/use-chat";
import { briefingClient } from "@/features/briefing/api/briefing.client";
import { MicButton } from "@/features/voice/components/MicButton";
import { useVoiceInput } from "@/features/voice/model/use-voice-input";
import { useWakeWord } from "@/features/voice/model/use-wake-word";

const EXAMPLES = [
  "Qual o clima agora?",
  "O que eu tenho hoje?",
  "Como se fala “prazo de entrega” em inglês?",
];

export function ChatScreen({
  user,
  offline,
  askShortcut,
  talkShortcut,
  onOpenSettings,
  onOpenToday,
}: {
  user: SessionUser;
  offline: boolean;
  askShortcut: string | null;
  talkShortcut: string | null;
  onOpenSettings: () => void;
  onOpenToday: () => void;
}) {
  const chat = useChat();
  const voice = useVoiceInput(chat.sendVoice);
  const listening = voice.state.status === "listening";
  const announce = chat.announce;
  useEffect(
    () =>
      briefingClient.onPresented((briefing) =>
        announce("Resumo do dia", briefing.text),
      ),
    [announce],
  );
  const wake = useWakeWord({
    enabled: chat.voice.wakeWordEnabled,
    name: chat.voice.assistantName,
    paused: listening || chat.pending || chat.speaking,
    onHeard: (event) => {
      chat.stop();
      if (event.kind === "question") void chat.sendVoice(event.audioBase64);
      else void voice.start();
    },
  });
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => chatClient.onFocusQuestion(() => input.current?.focus()), []);
  const startListening = voice.start;
  useEffect(
    () => chatClient.onStartListening(() => void startListening()),
    [startListening],
  );
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length, chat.pending]);

  return (
    <main className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <ListeningMark size={28} active={chat.pending || chat.speaking} />
          <WakeIndicator status={wake} name={chat.voice.assistantName} />
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
          <Button variant="ghost" onClick={onOpenToday}>
            Hoje
          </Button>
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
            {(askShortcut || talkShortcut) && (
              <p className="text-xs text-ink-muted">
                De qualquer lugar do Windows:
                {talkShortcut && <> {talkShortcut} para falar</>}
                {askShortcut && talkShortcut && " ·"}
                {askShortcut && <> {askShortcut} para digitar</>}
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
        {listening && (
          <p className="self-center text-sm text-red-500" role="status">
            Ouvindo… fale agora. Eu paro quando você fizer uma pausa.
          </p>
        )}
        {voice.state.status === "error" && (
          <div className="self-stretch">
            <Alert tone="warning">{voice.state.message}</Alert>
          </div>
        )}
        {chat.pending && (
          <p className="self-start text-sm text-ink-muted">Pensando…</p>
        )}
        <div ref={bottom} />
      </section>

      <Composer
        ref={input}
        disabled={chat.pending || listening}
        onSend={chat.send}
        accessory={
          <MicButton
            listening={listening}
            level={voice.state.status === "listening" ? voice.state.level : 0}
            disabled={chat.pending}
            onClick={() => {
              voice.clearError();
              chat.stop();
              voice.toggle();
            }}
          />
        }
      />
    </main>
  );
}

// Shows whether Otto is listening for its name in the background.
function WakeIndicator({ status, name }: { status: WakeStatus; name: string }) {
  if (status.state === "off") return null;
  const text =
    status.state === "listening"
      ? `Diga “${name}”`
      : status.state === "starting"
        ? "Preparando…"
        : "Escuta indisponível";
  return (
    <span
      title={status.state === "unavailable" ? status.message : undefined}
      className={`rounded-full px-2 py-0.5 text-xs ${
        status.state === "listening"
          ? "bg-brand/15 text-brand"
          : "bg-surface-muted text-ink-muted"
      }`}
    >
      {text}
    </span>
  );
}
