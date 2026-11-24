import { useEffect, useState } from "react";
import type { Briefing } from "@shared/briefing";
import { Alert, Button, Card } from "@/design-system";
import { briefingClient } from "@/features/briefing/api/briefing.client";
import { chatClient } from "@/features/chat/api/chat.client";
import { speak, stopSpeaking } from "@/features/chat/model/speech";

// Today's briefing with "Ouvir" and "Refazer" (written again with the
// current agenda, weather and news).
export function BriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redoing, setRedoing] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    briefingClient
      .today()
      .then(setBriefing)
      .catch(() => setError("Não consegui buscar o resumo agora."));
    return stopSpeaking;
  }, []);

  async function redo() {
    setRedoing(true);
    setError(null);
    try {
      setBriefing(await briefingClient.regenerate());
    } catch {
      setError("Não consegui refazer o resumo agora. Tente de novo.");
    } finally {
      setRedoing(false);
    }
  }

  async function listen() {
    if (!briefing) return;
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    const voice = await chatClient.voiceSettings();
    setPlaying(true);
    void speak(briefing.text, {
      language: voice.language,
      rate: voice.speechRate,
      onEnd: () => setPlaying(false),
    });
  }

  return (
    <Card title="Resumo do dia">
      {error && <Alert tone="error">{error}</Alert>}
      {!briefing && !error && (
        <p className="text-sm text-ink-muted">Preparando o resumo…</p>
      )}
      {briefing && (
        <>
          <p className="text-sm whitespace-pre-wrap">{briefing.text}</p>
          {briefing.unavailable.length > 0 && (
            <p className="mt-2 text-xs text-ink-muted">
              Sem acesso agora a: {briefing.unavailable.map(label).join(", ")}.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={() => void listen()}>
              {playing ? "Parar" : "Ouvir"}
            </Button>
            <Button
              variant="ghost"
              loading={redoing}
              onClick={() => void redo()}
            >
              Refazer com os dados de agora
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function label(section: string): string {
  return (
    { weather: "clima", agenda: "agenda", news: "notícias" }[section] ?? section
  );
}
