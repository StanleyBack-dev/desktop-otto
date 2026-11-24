import type { Headline } from "@shared/today";
import { Card } from "@/design-system";

const time = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// The latest headlines; a click opens the article in the browser.
export function NewsCard({ items }: { items: Headline[] }) {
  return (
    <Card title="Manchetes (últimas 24 h)">
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nenhuma manchete ainda. Siga fontes de notícias em Ajustes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-sm hover:text-brand hover:underline"
              >
                {item.title}
              </a>
              <p className="text-xs text-ink-muted">
                {item.sourceName} · {item.category} · {time(item.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
