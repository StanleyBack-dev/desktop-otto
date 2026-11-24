import { useEffect, useState } from "react";
import {
  placeLabel,
  type AccountResult,
  type AccountSettings,
  type Place,
} from "@shared/account";
import { Alert, Card, TextField } from "@/design-system";
import { accountClient } from "@/features/account/api/account.client";

// The city used for the weather and the briefing. Found by name, so moving
// or travelling is just searching again.
export function LocationSection({
  settings,
  onSaved,
}: {
  settings: AccountSettings;
  onSaved: (result: AccountResult<AccountSettings>) => void;
}) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Searches after a short pause in typing.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      void accountClient.searchPlaces(query).then((result) => {
        if (result.ok) setPlaces(result.data);
        else setError(result.error.message);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  async function choose(place: Place) {
    setSaving(true);
    const result = await accountClient.setLocation(place);
    setSaving(false);
    onSaved(result);
    if (result.ok) {
      setQuery("");
      setPlaces([]);
      setError(null);
    } else {
      setError(result.error.message);
    }
  }

  return (
    <Card title="Cidade (clima e resumo do dia)">
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          {settings.location?.name ? (
            <>
              Agora: <strong>{settings.location.name}</strong> ·{" "}
              <span className="text-ink-muted">{settings.timeZone}</span>
            </>
          ) : (
            <span className="text-ink-muted">Nenhuma cidade escolhida.</span>
          )}
        </p>
        <TextField
          label="Buscar cidade"
          placeholder="Ex.: Goiânia"
          value={query}
          maxLength={100}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length < 2) setPlaces([]);
          }}
        />
        {places.length > 0 && (
          <ul className="flex flex-col gap-1">
            {places.map((place) => (
              <li key={`${place.latitude},${place.longitude}`}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void choose(place)}
                  className="w-full rounded-xl border border-line px-3 py-2 text-left text-sm hover:border-brand disabled:opacity-50"
                >
                  {placeLabel(place)}
                  {place.timeZone && (
                    <span className="block text-xs text-ink-muted">
                      {place.timeZone}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && places.length === 0 && !error && (
          <p className="text-xs text-ink-muted">Nenhuma cidade encontrada.</p>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Card>
  );
}
