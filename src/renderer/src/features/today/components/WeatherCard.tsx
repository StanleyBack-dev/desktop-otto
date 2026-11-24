import { weatherLabel, type TodayWeather } from "@shared/today";
import { Card } from "@/design-system";

export function WeatherCard({ weather }: { weather: TodayWeather }) {
  const now = weatherLabel(weather.current.weatherCode, weather.current.isDay);
  const [today, tomorrow] = weather.days;
  return (
    <Card title={`Clima · ${weather.place}`}>
      <div className="flex items-center gap-4">
        <span className="text-4xl" aria-hidden>
          {now.symbol}
        </span>
        <div>
          <p className="text-3xl font-semibold">
            {Math.round(weather.current.temperatureC)}°
          </p>
          <p className="text-sm text-ink-muted">
            {now.label} · sensação {Math.round(weather.current.feelsLikeC)}°
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {today && <ForecastDay label="Hoje" day={today} />}
        {tomorrow && <ForecastDay label="Amanhã" day={tomorrow} />}
      </dl>
      <p className="mt-2 text-xs text-ink-muted">
        Umidade {Math.round(weather.current.humidityPercent)}% · vento{" "}
        {Math.round(weather.current.windKmh)} km/h
      </p>
    </Card>
  );
}

function ForecastDay({
  label,
  day,
}: {
  label: string;
  day: TodayWeather["days"][number];
}) {
  const sky = weatherLabel(day.weatherCode);
  return (
    <div className="rounded-xl bg-surface px-3 py-2">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd>
        {sky.symbol} {Math.round(day.minC)}° / {Math.round(day.maxC)}°
        {day.precipitationChancePercent != null && (
          <span className="block text-xs text-ink-muted">
            Chuva {Math.round(day.precipitationChancePercent)}%
          </span>
        )}
      </dd>
    </div>
  );
}
