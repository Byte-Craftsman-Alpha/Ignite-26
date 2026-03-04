import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, ShieldAlert } from 'lucide-react';
import { getErrorMessage, readJsonSafe } from '../lib/http';
import LoadingSpinner from '../components/LoadingSpinner';

interface Participant {
  id: number;
  full_name: string;
  roll_number: string;
  branch: string;
  email: string;
  year: string;
  whatsapp_number: string;
  skills: string[];
  payment_id: string;
  payment_verified: boolean;
  check_in_status: boolean;
  check_in_time: string | null;
  registered_at: string;
}

export default function PublicRegistrationsView() {
  const { token = '' } = useParams();
  const [rows, setRows] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/public-participants?token=${encodeURIComponent(token)}`);
        const data = await readJsonSafe<Participant[] | { error?: string }>(res);
        if (!res.ok) throw new Error(getErrorMessage(data, 'Failed to load records'));
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load records');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] grid-bg text-white pt-24 px-4">
        <LoadingSpinner text="Loading shared registrations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050510] grid-bg text-white pt-24 px-4">
        <div className="max-w-3xl mx-auto p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200">
          <p className="font-semibold flex items-center gap-2"><ShieldAlert size={18} /> Access unavailable</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] grid-bg text-white pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black">Registration Records (View Only)</h1>
          <p className="text-gray-400 text-sm mt-1">Private shared page. No edit actions are available.</p>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Roll No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Year</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Skills</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{p.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{p.roll_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.branch}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.whatsapp_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.skills.join(', ') || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.payment_id}</td>
                    <td className="px-4 py-3 text-sm">{p.payment_verified ? <span className="text-emerald-300">Verified</span> : <span className="text-amber-300">Pending</span>}</td>
                    <td className="px-4 py-3 text-sm">{p.check_in_status ? <span className="text-emerald-300">Checked In</span> : <span className="text-gray-400">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p>No registrations found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

