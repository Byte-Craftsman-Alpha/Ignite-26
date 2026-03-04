import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Hash, Phone, CheckCircle, XCircle, Search } from 'lucide-react';

interface Participant {
  id: number;
  name: string;
  roll_no: string;
  branch: string;
  email: string;
  phone: string;
  food_pref: string;
  check_in_status: boolean;
  check_in_time: string | null;
  registered_at: string;
}

export default function MyProfile() {
  const [rollNo, setRollNo] = useState('');
  const [phone, setPhone] = useState('');
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
        body: JSON.stringify({ roll_no: rollNo.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParticipant(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <User size={28} className="text-purple-400" />
            </div>
            <h1 className="text-4xl font-black mb-2">My Profile</h1>
            <p className="text-gray-400">Enter your credentials to view your registration details.</p>
          </div>

          <form onSubmit={handleLookup} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Roll Number</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g., 24-CS-01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" maxLength={10}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
                </div>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              <Search size={18} /> {loading ? 'Searching...' : 'Find My Profile'}
            </button>
          </form>

          {participant && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-700 to-amber-600 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                    {participant.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{participant.name}</h2>
                    <p className="text-white/80 text-sm">{participant.roll_no} &bull; {participant.branch}</p>
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
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Email</span>
                  <span className="text-white text-sm">{participant.email}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Food Preference</span>
                  <span className="text-white text-sm capitalize">{participant.food_pref}</span>
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
