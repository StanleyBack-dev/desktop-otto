import { agendaNow, timeIn, type TodayAgenda } from "@shared/today";
import { Card } from "@/design-system";

export function AgendaCard({
  agenda,
  now,
}: {
  agenda: TodayAgenda;
  now: Date;
}) {
  const { current, next } = agendaNow(agenda.events, now);
  const ids = new Set(current.map((event) => event.id));
  const at = (iso: string) => timeIn(iso, agenda.timeZone);

  return (
    <Card title="Agenda de hoje">
      {agenda.events.length === 0 ? (
        <p className="text-sm text-ink-muted">Nada marcado para hoje.</p>
      ) : (
        <>
          {next && (
            <p className="mb-3 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand">
              Próximo: <strong>{next.title}</strong> às {at(next.start)}
            </p>
          )}
          <ol className="flex flex-col gap-1.5">
            {agenda.events.map((event) => {
              const past =
                !event.allDay && Date.parse(event.end) <= now.getTime();
              return (
                <li
                  key={event.id}
                  className={`flex gap-3 text-sm ${past ? "text-ink-muted line-through decoration-ink-muted/40" : ""}`}
                >
                  <span className="w-24 shrink-0 tabular-nums text-ink-muted">
                    {event.allDay
                      ? "Dia todo"
                      : `${at(event.start)}–${at(event.end)}`}
                  </span>
                  <span className={ids.has(event.id) ? "font-semibold" : ""}>
                    {ids.has(event.id) && "▶ "}
                    {event.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Card>
  );
}
