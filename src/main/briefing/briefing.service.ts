import type { Briefing, BriefingSchedule } from "@shared/briefing";
import type { SessionService } from "../session/session.service";

const FIELDS = `date text unavailable`;
const TODAY = `query TodayBriefing { todayBriefing { ${FIELDS} } }`;
const REGENERATE = `mutation RegenerateBriefing { regenerateBriefing { ${FIELDS} } }`;
const SCHEDULE = `query BriefingSchedule { mySettings { briefingEnabled briefingTime timeZone } }`;

// Today's briefing from the API (generated there when the routine has not
// run yet) and the owner's schedule for it.
export class BriefingService {
  constructor(private readonly session: SessionService) {}

  async today(): Promise<Briefing> {
    const { todayBriefing } = await this.session.call<{
      todayBriefing: Briefing;
    }>(TODAY);
    return todayBriefing;
  }

  async regenerate(): Promise<Briefing> {
    const { regenerateBriefing } = await this.session.call<{
      regenerateBriefing: Briefing;
    }>(REGENERATE);
    return regenerateBriefing;
  }

  async schedule(): Promise<BriefingSchedule> {
    const { mySettings } = await this.session.call<{
      mySettings: BriefingSchedule;
    }>(SCHEDULE);
    return mySettings;
  }
}
