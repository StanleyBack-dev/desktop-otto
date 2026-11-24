import { useCallback, useEffect, useState } from "react";
import type { AccountResult } from "@shared/account";
import type { Headline, TodayAgenda, TodayWeather } from "@shared/today";
import { Alert, Button } from "@/design-system";
import { todayClient } from "@/features/today/api/today.client";
import { AgendaCard } from "@/features/today/components/AgendaCard";
import { BriefingCard } from "@/features/today/components/BriefingCard";
import { NewsCard } from "@/features/today/components/NewsCard";
import { WeatherCard } from "@/features/today/components/WeatherCard";

type Part<T> = AccountResult<T> | null;

// "Hoje": the briefing, the weather, the agenda and the headlines. Each
// card loads and fails on its own; the agenda highlights what is on now.
export function TodayScreen({ onBack }: { onBack: () => void }) {
  const [weather, setWeather] = useState<Part<TodayWeather>>(null);
  const [agenda, setAgenda] = useState<Part<TodayAgenda>>(null);
  const [news, setNews] = useState<Part<Headline[]>>(null);
  const [now, setNow] = useState(() => new Date());

  const fetchAll = useCallback(() => {
    void todayClient.weather().then(setWeather);
    void todayClient.agenda().then(setAgenda);
    void todayClient.news().then(setNews);
  }, []);

  /** "Atualizar": back to loading, then fetch again. */
  const refresh = () => {
    setWeather(null);
    setAgenda(null);
    setNews(null);
    fetchAll();
  };

  useEffect(() => {
    fetchAll();
    const clock = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(clock);
  }, [fetchAll]);

  return (
    <main className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h1 className="font-semibold">Hoje</h1>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={refresh}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={onBack}>
            Voltar
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <BriefingCard />
        <Section part={weather} loading="Buscando o clima…">
          {(data) => <WeatherCard weather={data} />}
        </Section>
        <Section part={agenda} loading="Lendo a agenda…">
          {(data) => <AgendaCard agenda={data} now={now} />}
        </Section>
        <Section part={news} loading="Buscando as manchetes…">
          {(data) => <NewsCard items={data} />}
        </Section>
      </div>
    </main>
  );
}

function Section<T>({
  part,
  loading,
  children,
}: {
  part: Part<T>;
  loading: string;
  children: (data: T) => React.ReactNode;
}) {
  if (!part) return <p className="text-sm text-ink-muted">{loading}</p>;
  if (!part.ok) return <Alert tone="warning">{part.error.message}</Alert>;
  return <>{children(part.data)}</>;
}
