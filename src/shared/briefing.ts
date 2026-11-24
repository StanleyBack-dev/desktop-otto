// The morning briefing on this PC: when to present it and what the screens
// receive. The text is written by the API (todayBriefing).
export type Briefing = {
  /** Local date (YYYY-MM-DD) in the owner's time zone. */
  date: string;
  text: string;
  /** Sections the API could not read (agenda, weather, news). */
  unavailable: string[];
};

export type BriefingSchedule = {
  briefingEnabled: boolean;
  /** HH:mm in the owner's time zone. */
  briefingTime: string;
  timeZone: string;
};

/** YYYY-MM-DD and HH:mm of `now` in `timeZone`. */
export function localDateTime(
  now: Date,
  timeZone: string,
): { date: string; time: string } {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return { date, time };
}

/**
 * Present today's briefing once per local date: from the chosen time on,
 * which also covers turning the PC on later in the day. Not before the
 * time, not twice.
 */
export function shouldPresentBriefing(
  schedule: BriefingSchedule,
  now: Date,
  lastPresentedDate: string | null,
): boolean {
  if (!schedule.briefingEnabled) return false;
  const { date, time } = localDateTime(now, schedule.timeZone);
  return lastPresentedDate !== date && time >= schedule.briefingTime;
}
