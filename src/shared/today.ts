// What the "Hoje" tab shows: weather, agenda and headlines, from the API.
export type TodayWeather = {
  place: string;
  timeZone: string;
  current: {
    temperatureC: number;
    feelsLikeC: number;
    humidityPercent: number;
    windKmh: number;
    isDay: boolean;
    weatherCode: number;
  };
  days: {
    date: string;
    minC: number;
    maxC: number;
    precipitationChancePercent: number | null;
    weatherCode: number;
  }[];
};

export type AgendaEvent = {
  id: string;
  title: string;
  /** ISO instants. */
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  calendar: string;
};

export type TodayAgenda = { timeZone: string; events: AgendaEvent[] };

export type Headline = {
  id: string;
  title: string;
  link: string;
  sourceName: string;
  category: string;
  publishedAt: string;
};

/** WMO weather code → Portuguese label and a simple symbol. */
export function weatherLabel(
  code: number,
  isDay = true,
): { label: string; symbol: string } {
  if (code === 0) return { label: "Céu limpo", symbol: isDay ? "☀️" : "🌙" };
  if (code === 1 || code === 2) {
    return { label: "Parcialmente nublado", symbol: isDay ? "⛅" : "☁️" };
  }
  if (code === 3) return { label: "Nublado", symbol: "☁️" };
  if (code === 45 || code === 48) return { label: "Neblina", symbol: "🌫️" };
  if (code >= 51 && code <= 57) return { label: "Garoa", symbol: "🌦️" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: code === 65 || code === 82 ? "Chuva forte" : "Chuva",
      symbol: "🌧️",
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: "Neve", symbol: "🌨️" };
  }
  if (code === 95 || code === 96 || code === 99) {
    return { label: "Tempestade", symbol: "⛈️" };
  }
  return { label: "Tempo instável", symbol: "🌡️" };
}

/** Timed events going on at `now`, and the first one after it. */
export function agendaNow(
  events: AgendaEvent[],
  now: Date,
): { current: AgendaEvent[]; next: AgendaEvent | null } {
  const timed = events
    .filter((event) => !event.allDay)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const t = now.getTime();
  return {
    current: timed.filter(
      (event) => Date.parse(event.start) <= t && t < Date.parse(event.end),
    ),
    next: timed.find((event) => Date.parse(event.start) > t) ?? null,
  };
}

/** HH:mm of an ISO instant in a time zone. */
export function timeIn(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
