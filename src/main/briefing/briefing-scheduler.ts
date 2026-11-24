import { existsSync, readFileSync, writeFileSync } from "fs";
import {
  localDateTime,
  shouldPresentBriefing,
  type Briefing,
} from "@shared/briefing";
import type { BriefingService } from "./briefing.service";

const CHECK_EVERY_MS = 60_000;

// Checks every minute (while signed in) whether today's briefing is due on
// this PC and presents it once per local date. The last presented date is
// kept in a small file, so restarting Otto does not repeat it.
export class BriefingScheduler {
  private timer: NodeJS.Timeout | null = null;
  private busy = false;

  constructor(
    private readonly briefings: BriefingService,
    private readonly stateFile: string,
    private readonly present: (briefing: Briefing) => void,
    private readonly signedIn: () => boolean,
  ) {}

  start(): void {
    if (this.timer) return;
    void this.check();
    this.timer = setInterval(() => void this.check(), CHECK_EVERY_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async check(now = new Date()): Promise<void> {
    if (this.busy || !this.signedIn()) return;
    this.busy = true;
    try {
      const schedule = await this.briefings.schedule();
      if (!shouldPresentBriefing(schedule, now, this.lastPresented())) return;
      const briefing = await this.briefings.today();
      this.remember(localDateTime(now, schedule.timeZone).date);
      this.present(briefing);
    } catch {
      // Offline or the API is down: try again on the next check.
    } finally {
      this.busy = false;
    }
  }

  private lastPresented(): string | null {
    try {
      return existsSync(this.stateFile)
        ? readFileSync(this.stateFile, "utf8").trim() || null
        : null;
    } catch {
      return null;
    }
  }

  private remember(date: string): void {
    try {
      writeFileSync(this.stateFile, date);
    } catch {
      // Worst case the briefing is presented again after a restart.
    }
  }
}
