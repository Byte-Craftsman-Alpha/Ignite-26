import db from './_db.js';
import { requireAdmin } from './_auth.js';
import { writeActivity } from './_activity.js';

const DEFAULT_FLOW = [
  { time: '11:00', title: 'Kickoff and Entry Flow', desc: 'Wristbands, welcome desk, and opening drop.' },
  { time: '12:30', title: 'Open Stage Rounds', desc: 'Solo and group performances with live judges.' },
  { time: '15:00', title: 'Spotlight Challenges', desc: 'Interactive games and personality rounds.' },
  { time: '18:30', title: 'Crown Ceremony', desc: 'Final results, awards and celebration set.' },
];

const DEFAULT_SETTINGS = {
  title: "Ignite'26 Fresher Event",
  date_label: '25 March 2026',
  time_label: '11:00 AM Onwards',
  venue: 'Top secret',
  dress_code_male: 'Formals',
  dress_code_female: 'Western Wear',
  countdown_iso: '2026-03-25T11:00:00',
  flow: DEFAULT_FLOW,
  support_note: 'Payment verification may take 2-3 days. Please wait for confirmation from the support team.',
};

const safeText = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
};

const normalizeFlow = (value, fallback = DEFAULT_FLOW) => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({
      time: typeof item?.time === 'string' ? item.time.trim() : '',
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      desc: typeof item?.desc === 'string' ? item.desc.trim() : '',
    }))
    .filter((item) => item.time || item.title || item.desc);
  return cleaned.length ? cleaned : fallback;
};

const parseFlowJson = (value) => {
  if (!value) return DEFAULT_FLOW;
  try {
    return normalizeFlow(JSON.parse(value), DEFAULT_FLOW);
  } catch {
    return DEFAULT_FLOW;
  }
};

async function ensureRow() {
  let row = await db.prepare('SELECT * FROM event_settings WHERE id = 1').get();
  if (!row) {
    await db
      .prepare(
        `
          INSERT INTO event_settings (
            id, title, date_label, time_label, venue, dress_code_male, dress_code_female,
            countdown_iso, flow_json, support_note, updated_at
          )
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        DEFAULT_SETTINGS.title,
        DEFAULT_SETTINGS.date_label,
        DEFAULT_SETTINGS.time_label,
        DEFAULT_SETTINGS.venue,
        DEFAULT_SETTINGS.dress_code_male,
        DEFAULT_SETTINGS.dress_code_female,
        DEFAULT_SETTINGS.countdown_iso,
        JSON.stringify(DEFAULT_SETTINGS.flow),
        DEFAULT_SETTINGS.support_note,
        new Date().toISOString()
      );
    row = await db.prepare('SELECT * FROM event_settings WHERE id = 1').get();
  }
  return row;
}

function toEventSettings(row) {
  if (!row) return null;
  return {
    title: row.title,
    date_label: row.date_label,
    time_label: row.time_label,
    venue: row.venue,
    dress_code_male: row.dress_code_male,
    dress_code_female: row.dress_code_female,
    countdown_iso: row.countdown_iso,
    flow: parseFlowJson(row.flow_json),
    support_note: typeof row.support_note === 'string' ? row.support_note : DEFAULT_SETTINGS.support_note,
    updated_at: row.updated_at || null,
  };
}

function normalizeCountdown(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return trimmed;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const row = await ensureRow();
      return res.status(200).json(toEventSettings(row));
    }

    if (req.method === 'PUT') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const current = await ensureRow();
      const countdown = normalizeCountdown(req.body?.countdown_iso, current?.countdown_iso);
      if (!countdown) return res.status(400).json({ error: 'countdown_iso must be a valid date string' });

      const flow = normalizeFlow(req.body?.flow, parseFlowJson(current?.flow_json));
      const updated_at = new Date().toISOString();

      const payload = {
        title: safeText(req.body?.title, current?.title || DEFAULT_SETTINGS.title),
        date_label: safeText(req.body?.date_label, current?.date_label || DEFAULT_SETTINGS.date_label),
        time_label: safeText(req.body?.time_label, current?.time_label || DEFAULT_SETTINGS.time_label),
        venue: safeText(req.body?.venue, current?.venue || DEFAULT_SETTINGS.venue),
        dress_code_male: safeText(req.body?.dress_code_male, current?.dress_code_male || DEFAULT_SETTINGS.dress_code_male),
        dress_code_female: safeText(req.body?.dress_code_female, current?.dress_code_female || DEFAULT_SETTINGS.dress_code_female),
        countdown_iso: countdown,
        flow_json: JSON.stringify(flow),
        support_note: safeText(req.body?.support_note, current?.support_note || DEFAULT_SETTINGS.support_note),
        updated_at,
      };

      await db
        .prepare(
          `
            UPDATE event_settings
            SET title = ?, date_label = ?, time_label = ?, venue = ?, dress_code_male = ?, dress_code_female = ?,
                countdown_iso = ?, flow_json = ?, support_note = ?, updated_at = ?
            WHERE id = 1
          `
        )
        .run(
          payload.title,
          payload.date_label,
          payload.time_label,
          payload.venue,
          payload.dress_code_male,
          payload.dress_code_female,
          payload.countdown_iso,
          payload.flow_json,
          payload.support_note,
          payload.updated_at
        );

      await writeActivity({
        entity_type: 'event_settings',
        entity_id: 1,
        action: 'updated',
        actor_email: admin.email,
        details: {
          title: payload.title,
          date_label: payload.date_label,
          time_label: payload.time_label,
          venue: payload.venue,
        },
      });

      return res.status(200).json(toEventSettings({ ...payload }));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Event settings API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
