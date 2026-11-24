import type { AccountResult } from "@shared/account";
import type { Headline, TodayAgenda, TodayWeather } from "@shared/today";

// The "Hoje" tab data through the preload bridge.
export const todayClient = {
  weather: (): Promise<AccountResult<TodayWeather>> =>
    window.otto.today.weather(),
  agenda: (): Promise<AccountResult<TodayAgenda>> => window.otto.today.agenda(),
  news: (): Promise<AccountResult<Headline[]>> => window.otto.today.news(),
};
