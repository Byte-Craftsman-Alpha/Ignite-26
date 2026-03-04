import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, Search, CheckCircle, XCircle, Upload, Trophy, RefreshCw, ChevronDown } from 'lucide-react';
import { authHeaders } from '../../lib/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { readJsonSafe } from '../../lib/http';

interface Participant {
  id: number;
  full_name: string;
  roll_number: string;
  branch: string;
  email: string;
  year: string;
  whatsapp_number: string;
  skills: string[];
  check_in_status: boolean;
  check_in_time: string | null;
  registered_at: string;
}

interface Stats {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  branchCounts: Record<string, number>;
  yearCounts: Record<string, number>;
}

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('all');
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [branches, setBranches] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (branch !== 'all') params.set('branch', branch);
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/participants?${params}`, { headers: authHeaders() }),
        fetch('/api/stats', { headers: authHeaders() }),
      ]);
      const pData = await readJsonSafe<Participant[]>(pRes);
      const sData = await readJsonSafe<Stats>(sRes);
      setParticipants(Array.isArray(pData) ? pData : []);
      setStats(sData ?? null);
      if (!branches.length && sData?.branchCounts) setBranches(Object.keys(sData.branchCounts));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, branch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async (id: number, currentStatus: boolean) => {
    setCheckingIn(id);
    try {
      const res = await fetch('/api/checkin', {
        method: 'PUT',
        headers: { ...authHeaders() },
        body: JSON.stringify({ id, check_in_status: !currentStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
    finally { setCheckingIn(null); }
  };

  const checkinPct = stats ? Math.round((stats.checkedIn / (stats.total || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Ignite'26 &mdash; Check-in Management</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/upload" className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm flex items-center gap-2 hover:bg-purple-600/30 transition-colors">
              <Upload size={16} /> Media
            </Link>
            <Link to="/admin/winners" className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2 hover:bg-amber-500/30 transition-colors">
              <Trophy size={16} /> Winners
            </Link>
            <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users size={18} className="text-purple-400" />
                </div>
                <span className="text-gray-400 text-sm">Total Registered</span>
              </div>
              <p className="text-3xl font-black">{stats.total}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <UserCheck size={18} className="text-emerald-400" />
                </div>
                <span className="text-gray-400 text-sm">Checked In</span>
              </div>
              <p className="text-3xl font-black text-emerald-400">{stats.checkedIn}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle size={18} className="text-red-400" />
                </div>
                <span className="text-gray-400 text-sm">Pending</span>
              </div>
              <p className="text-3xl font-black text-red-400">{stats.notCheckedIn}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle size={18} className="text-amber-400" />
                </div>
                <span className="text-gray-400 text-sm">Arrival Rate</span>
              </div>
              <p className="text-3xl font-black text-amber-400">{checkinPct}%</p>
            </motion.div>
          </div>
        )}

        {/* Progress Bar */}
        {stats && (
          <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-400">Check-in Progress</span>
              <span className="text-white font-semibold">{stats.checkedIn} / {stats.total} students arrived</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${checkinPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full" />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, roll no, or email..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
          </div>
          <div className="relative">
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-purple-500 appearance-none">
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        {loading ? <LoadingSpinner text="Loading participants..." /> : (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Participant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Roll No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Branch</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Year</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {participants.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {p.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{p.full_name}</p>
                            <p className="text-gray-500 text-xs">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-sm text-gray-300">{p.roll_number}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-medium">{p.branch}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-400 text-sm">{p.year}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.check_in_status ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-emerald-400 text-xs font-medium">Checked In</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                            <span className="text-gray-500 text-xs">Pending</span>
                          </div>
                        )}
                        {p.check_in_time && (
                          <p className="text-gray-600 text-xs">{new Date(p.check_in_time).toLocaleTimeString()}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleCheckIn(p.id, p.check_in_status)}
                          disabled={checkingIn === p.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                            p.check_in_status
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}>
                          {checkingIn === p.id ? '...' : p.check_in_status ? 'Undo' : 'Check In'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {participants.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users size={32} className="mx-auto mb-3 opacity-40" />
                  <p>No participants found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
