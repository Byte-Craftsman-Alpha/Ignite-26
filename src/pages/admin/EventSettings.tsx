import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, CalendarClock } from 'lucide-react';
import { authHeaders } from '../../lib/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getErrorMessage, readJsonSafe } from '../../lib/http';
import { defaultEventSettings, fetchEventSettings } from '../../lib/eventSettings';
import type { EventFlowItem } from '../../lib/eventSettings';

interface FormState {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  dressCodeMale: string;
  dressCodeFemale: string;
  countdownLocal: string;
  flow: EventFlowItem[];
  supportNote: string;
  updatedAt: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

const toInputValue = (value: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const fromInputValue = (value: string) => {
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
};

export default function EventSettings() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const settings = await fetchEventSettings();
      setForm({
        title: settings.title,
        dateLabel: settings.dateLabel,
        timeLabel: settings.timeLabel,
        venue: settings.venue,
        dressCodeMale: settings.dressCodeMale,
        dressCodeFemale: settings.dressCodeFemale,
        countdownLocal: toInputValue(settings.countdownIso),
        flow: settings.flow,
        supportNote: settings.supportNote,
        updatedAt: settings.updatedAt,
      });
    } catch (err) {
      setForm({
        title: defaultEventSettings.title,
        dateLabel: defaultEventSettings.dateLabel,
        timeLabel: defaultEventSettings.timeLabel,
        venue: defaultEventSettings.venue,
        dressCodeMale: defaultEventSettings.dressCodeMale,
        dressCodeFemale: defaultEventSettings.dressCodeFemale,
        countdownLocal: toInputValue(defaultEventSettings.countdownIso),
        flow: defaultEventSettings.flow,
        supportNote: defaultEventSettings.supportNote,
        updatedAt: null,
      });
      setError(err instanceof Error ? err.message : 'Failed to load event settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateFlow = (index: number, key: keyof EventFlowItem, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const nextFlow = prev.flow.map((item, idx) => idx === index ? { ...item, [key]: value } : item);
      return { ...prev, flow: nextFlow };
    });
  };

  const addFlowRow = () => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, flow: [...prev.flow, { time: '', title: '', desc: '' }] };
    });
  };

  const removeFlowRow = (index: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const nextFlow = prev.flow.filter((_, idx) => idx !== index);
      return { ...prev, flow: nextFlow.length ? nextFlow : [{ time: '', title: '', desc: '' }] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        title: form.title,
        date_label: form.dateLabel,
        time_label: form.timeLabel,
        venue: form.venue,
        dress_code_male: form.dressCodeMale,
        dress_code_female: form.dressCodeFemale,
        countdown_iso: fromInputValue(form.countdownLocal),
        flow: form.flow,
        support_note: form.supportNote,
      };
      const res = await fetch('/api/event-settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await readJsonSafe<any>(res);
      if (!res.ok) throw new Error(getErrorMessage(data, 'Failed to save event settings'));
      setForm((prev) => prev ? { ...prev, updatedAt: data?.updated_at || new Date().toISOString() } : prev);
      setMessage('Event settings updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] grid-bg text-white pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-3xl font-black flex items-center gap-2"><CalendarClock size={24} className="text-amber-300" /> Event Settings</h1>
              <p className="text-gray-400 text-sm">Update venue, timing, countdown, dress code and day flow</p>
            </div>
          </div>
          <button
            onClick={loadSettings}
            className="px-4 py-2 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {loading || !form ? (
          <LoadingSpinner text="Loading event settings..." />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Core Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Event Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Venue</label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, venue: e.target.value } : prev)}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Display Date</label>
                  <input
                    value={form.dateLabel}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, dateLabel: e.target.value } : prev)}
                    placeholder="e.g., 25 March 2026"
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Display Time</label>
                  <input
                    value={form.timeLabel}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, timeLabel: e.target.value } : prev)}
                    placeholder="e.g., 11:00 AM Onwards"
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Countdown Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.countdownLocal}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, countdownLocal: e.target.value } : prev)}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Last Updated</label>
                  <div className="w-full rounded-xl border border-[#1e1e3f] px-4 py-3 text-sm text-gray-300 bg-[#0d0d1f]/70">
                    {form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'Not yet updated'}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Dress Code & Support Note</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Dress Code (Boys)</label>
                  <input
                    value={form.dressCodeMale}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, dressCodeMale: e.target.value } : prev)}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Dress Code (Girls)</label>
                  <input
                    value={form.dressCodeFemale}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, dressCodeFemale: e.target.value } : prev)}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1.5">Support Note (Pending Payment)</label>
                  <textarea
                    value={form.supportNote}
                    onChange={(e) => setForm((prev) => prev ? { ...prev, supportNote: e.target.value } : prev)}
                    rows={2}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Day Flow</h2>
                <button
                  type="button"
                  onClick={addFlowRow}
                  className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2 hover:bg-emerald-500/20"
                >
                  <Plus size={14} /> Add Slot
                </button>
              </div>
              <div className="space-y-3">
                {form.flow.map((item, idx) => (
                  <div key={`${idx}-${item.time}-${item.title}`} className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_40px] gap-3 items-center">
                    <input
                      value={item.time}
                      onChange={(e) => updateFlow(idx, 'time', e.target.value)}
                      placeholder="11:00"
                      className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      value={item.title}
                      onChange={(e) => updateFlow(idx, 'title', e.target.value)}
                      placeholder="Session title"
                      className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      value={item.desc}
                      onChange={(e) => updateFlow(idx, 'desc', e.target.value)}
                      placeholder="Short description"
                      className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeFlowRow(idx)}
                      className="w-10 h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 flex items-center justify-center hover:bg-red-500/20"
                      aria-label="Remove slot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {(error || message) && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {error && <p className="text-red-300">{error}</p>}
                {message && <p className="text-emerald-300">{message}</p>}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
