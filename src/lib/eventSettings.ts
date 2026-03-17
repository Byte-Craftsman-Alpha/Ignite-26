import { readJsonSafe } from './http';

export interface EventFlowItem {
  time: string;
  title: string;
  desc: string;
}

export interface EventSettings {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  dressCodeMale: string;
  dressCodeFemale: string;
  countdownIso: string;
  flow: EventFlowItem[];
  supportNote: string;
  updatedAt: string | null;
}

export const defaultEventSettings: EventSettings = {
  title: "Ignite'26 Fresher Event",
  dateLabel: '23 March 2026',
  timeLabel: '11:00 AM Onwards',
  venue: 'BLACK HORSE Multi Cuisine Restaurant And Banquet Hall, Vijay Chowk, Golghar, Gorakhpur',
  dressCodeMale: 'Formals',
  dressCodeFemale: 'Western Wear',
  countdownIso: '2026-03-23T11:00:00',
  flow: [
    { time: '11:00', title: 'Kickoff and Entry Flow', desc: 'Wristbands, welcome desk, and opening drop.' },
    { time: '12:30', title: 'Open Stage Rounds', desc: 'Solo and group performances with live judges.' },
    { time: '15:00', title: 'Spotlight Challenges', desc: 'Interactive games and personality rounds.' },
    { time: '18:30', title: 'Crown Ceremony', desc: 'Final results, awards and celebration set.' },
  ],
  supportNote: 'Payment verification may take 2-3 days. Please wait for confirmation from the support team.',
  updatedAt: null,
};

const normalizeFlow = (value: unknown): EventFlowItem[] => {
  if (!Array.isArray(value)) return defaultEventSettings.flow;
  const cleaned = value
    .map((item) => ({
      time: typeof item?.time === 'string' ? item.time.trim() : '',
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      desc: typeof item?.desc === 'string' ? item.desc.trim() : '',
    }))
    .filter((item) => item.time || item.title || item.desc);
  return cleaned.length ? cleaned : defaultEventSettings.flow;
};

export function normalizeEventSettings(payload: any): EventSettings {
  return {
    title: typeof payload?.title === 'string' ? payload.title : defaultEventSettings.title,
    dateLabel: typeof payload?.date_label === 'string' ? payload.date_label : defaultEventSettings.dateLabel,
    timeLabel: typeof payload?.time_label === 'string' ? payload.time_label : defaultEventSettings.timeLabel,
    venue: typeof payload?.venue === 'string' ? payload.venue : defaultEventSettings.venue,
    dressCodeMale: typeof payload?.dress_code_male === 'string' ? payload.dress_code_male : defaultEventSettings.dressCodeMale,
    dressCodeFemale: typeof payload?.dress_code_female === 'string' ? payload.dress_code_female : defaultEventSettings.dressCodeFemale,
    countdownIso: typeof payload?.countdown_iso === 'string' ? payload.countdown_iso : defaultEventSettings.countdownIso,
    flow: normalizeFlow(payload?.flow),
    supportNote: typeof payload?.support_note === 'string' ? payload.support_note : defaultEventSettings.supportNote,
    updatedAt: typeof payload?.updated_at === 'string' ? payload.updated_at : null,
  };
}

export async function fetchEventSettings(): Promise<EventSettings> {
  const res = await fetch('/api/event-settings');
  const data = await readJsonSafe<any>(res);
  if (!res.ok || !data) {
    throw new Error('Failed to load event settings');
  }
  return normalizeEventSettings(data);
}
