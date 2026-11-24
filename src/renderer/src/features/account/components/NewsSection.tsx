import { useEffect, useState, type FormEvent } from "react";
import type { NewsSource, SuggestedNewsSource } from "@shared/account";
import { Alert, Button, Card, Switch, TextField } from "@/design-system";
import { accountClient } from "@/features/account/api/account.client";

// The feeds the owner follows: suggestions to start, any RSS/Atom link,
// pause and remove.
export function NewsSection() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [suggested, setSuggested] = useState<SuggestedNewsSource[]>([]);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("geral");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void accountClient.newsSources().then((r) => r.ok && setSources(r.data));
    void accountClient
      .suggestedNewsSources()
      .then((r) => r.ok && setSuggested(r.data));
  }, []);

  async function add(source: { url: string; category: string }) {
    setBusy(source.url);
    setError(null);
    const result = await accountClient.addNewsSource(source);
    setBusy(null);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    setSources((current) => [...current, result.data]);
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await add({ url, category })) setUrl("");
  }

  const followed = new Set(sources.map((source) => source.url));
  const toSuggest = suggested.filter((source) => !followed.has(source.url));

  return (
    <Card title="Notícias">
      <div className="flex flex-col gap-4">
        {sources.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Você ainda não segue nenhuma fonte. Comece por uma sugestão ou cole
            o link de um feed RSS.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sources.map((source) => (
              <li key={source.id} className="flex flex-col gap-1">
                <Switch
                  label={`${source.name} · ${source.category}`}
                  hint={
                    source.lastError
                      ? `Última leitura falhou: ${source.lastError}`
                      : undefined
                  }
                  checked={source.active}
                  onChange={(active) => {
                    void accountClient
                      .updateNewsSource({ id: source.id, active })
                      .then((r) => {
                        if (r.ok) {
                          setSources((current) =>
                            current.map((s) =>
                              s.id === r.data.id ? r.data : s,
                            ),
                          );
                        } else {
                          setError(r.error.message);
                        }
                      });
                  }}
                />
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void accountClient
                        .removeNewsSource(source.id)
                        .then((r) => {
                          if (r.ok) {
                            setSources((current) =>
                              current.filter((s) => s.id !== source.id),
                            );
                          } else {
                            setError(r.error.message);
                          }
                        });
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {toSuggest.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-ink-muted">Sugestões</p>
            <div className="flex flex-wrap gap-2">
              {toSuggest.map((source) => (
                <Button
                  key={source.url}
                  variant="ghost"
                  loading={busy === source.url}
                  onClick={() =>
                    void add({ url: source.url, category: source.category })
                  }
                  className="border border-line"
                >
                  + {source.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form className="flex flex-col gap-3" onSubmit={submit}>
          <TextField
            label="Link de um feed RSS ou Atom"
            placeholder="https://…/rss"
            value={url}
            maxLength={1000}
            onChange={(event) => setUrl(event.target.value)}
          />
          <TextField
            label="Categoria"
            placeholder="geral, tecnologia, Goiânia…"
            value={category}
            maxLength={40}
            onChange={(event) => setCategory(event.target.value)}
          />
          <div>
            <Button
              type="submit"
              loading={busy === url && Boolean(url)}
              disabled={!url.trim() || category.trim().length < 2}
            >
              Seguir feed
            </Button>
          </div>
        </form>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Card>
  );
}
