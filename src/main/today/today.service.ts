import type { AccountResult } from "@shared/account";
import type { Headline, TodayAgenda, TodayWeather } from "@shared/today";
import { ApiError } from "../api/graphql-client";
import type { SessionService } from "../session/session.service";

const WEATHER = `query TodayWeather { weather(days: 2) {
  place timeZone
  current { temperatureC feelsLikeC humidityPercent windKmh isDay weatherCode }
  days { date minC maxC precipitationChancePercent weatherCode }
} }`;
const AGENDA = `query TodayAgenda { agenda { timeZone events { id title start end allDay location calendar } } }`;
const NEWS = `query TodayNews { news(period: RECENT, page: { page: 1, limit: 8 }) {
  items { id title link sourceName category publishedAt }
} }`;

// The "Hoje" tab data. Each part fails on its own (no city, calendar not
// connected, no feeds) with the API message.
export class TodayService {
  constructor(private readonly session: SessionService) {}

  weather(): Promise<AccountResult<TodayWeather>> {
    return this.run<{ weather: TodayWeather }, TodayWeather>(
      WEATHER,
      (d) => d.weather,
    );
  }

  agenda(): Promise<AccountResult<TodayAgenda>> {
    return this.run<{ agenda: TodayAgenda }, TodayAgenda>(
      AGENDA,
      (d) => d.agenda,
    );
  }

  news(): Promise<AccountResult<Headline[]>> {
    return this.run<{ news: { items: Headline[] } }, Headline[]>(
      NEWS,
      (d) => d.news.items,
    );
  }

  private async run<D, T>(
    query: string,
    pick: (data: D) => T,
  ): Promise<AccountResult<T>> {
    try {
      return { ok: true, data: pick(await this.session.call<D>(query)) };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof ApiError
            ? error.toFailure()
            : { code: "UNKNOWN", message: "Não consegui carregar agora." },
      };
    }
  }
}
