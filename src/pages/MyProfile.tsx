import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Hash, Phone, CheckCircle, XCircle, Search } from 'lucide-react';
import { getErrorMessage, readJsonSafe } from '../lib/http';

interface Participant {
  id: number;
  email: string;
  full_name: string;
  roll_number: string;
  branch: string;
  year: string;
  skills: string[];
  payment_id: string;
  whatsapp_number: string;
  check_in_status: boolean;
  check_in_time: string | null;
  registered_at: string;
}

export default function MyProfile() {
  const [rollNumber, setRollNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setParticipant(null);
    try {
      const res = await fetch('/api/participant-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_number: rollNumber.trim(), whatsapp_number: whatsappNumber.trim() }),
      });
      const data = await readJsonSafe<Participant & { error?: string }>(res);
      if (!res.ok) throw new Error(getErrorMessage(data, 'Unable to find profile'));
      if (!data) throw new Error('Empty response from server');
      setParticipant(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lookup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] grid-bg text-white pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <User size={28} className="text-purple-400" />
            </div>
            <h1 className="text-4xl font-black mb-2">My Profile</h1>
            <p className="text-gray-400">Enter your roll number and WhatsApp number to view your registration.</p>
          </div>

          <form onSubmit={handleLookup} className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Complete Roll Number</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="13-digit numerical roll number" maxLength={13}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2d78]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">WhatsApp Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="10-digit WhatsApp number" maxLength={10}
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2d78]" />
                </div>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#7c3aed] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              <Search size={18} /> {loading ? 'Searching...' : 'Find My Profile'}
            </button>
          </form>

          {participant && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#ff2d78] to-[#7c3aed] p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                    {participant.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{participant.full_name}</h2>
                    <p className="text-white/80 text-sm">{participant.roll_number} | {participant.branch}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Check-in Status</span>
                  <div className="flex items-center gap-2">
                    {participant.check_in_status ? (
                      <><CheckCircle size={18} className="text-emerald-400" /><span className="text-emerald-400 font-semibold">Checked In</span></>
                    ) : (
                      <><XCircle size={18} className="text-gray-500" /><span className="text-gray-400">Not Yet</span></>
                    )}
                  </div>
                </div>
                {participant.check_in_time && (
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Check-in Time</span>
                    <span className="text-white text-sm">{new Date(participant.check_in_time).toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-white/10 gap-3">
                  <span className="text-gray-400 text-sm">Email</span>
                  <span className="text-white text-sm text-right">{participant.email}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10 gap-3">
                  <span className="text-gray-400 text-sm">Year</span>
                  <span className="text-white text-sm text-right">{participant.year}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10 gap-3">
                  <span className="text-gray-400 text-sm">Skills</span>
                  <span className="text-white text-sm text-right">{Array.isArray(participant.skills) ? participant.skills.join(', ') : ''}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10 gap-3">
                  <span className="text-gray-400 text-sm">Payment ID</span>
                  <span className="text-white text-sm text-right">{participant.payment_id}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10 gap-3">
                  <span className="text-gray-400 text-sm">WhatsApp</span>
                  <span className="text-white text-sm text-right">{participant.whatsapp_number}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400 text-sm">Registered On</span>
                  <span className="text-white text-sm">{new Date(participant.registered_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

