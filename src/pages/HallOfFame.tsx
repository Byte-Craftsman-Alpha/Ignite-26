import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { readJsonSafe } from '../lib/http';

interface Winner {
  id: number;
  name: string;
  roll_no: string;
  branch: string;
  award_title: string;
  image_url: string;
  description: string;
}

const AWARD_ICONS: Record<string, string> = {
  'Mr. Fresher': 'ðŸ‘‘',
  'Ms. Fresher': 'ðŸ‘¸',
  'Best Dancer': 'ðŸ’ƒ',
  'Best Singer': 'ðŸŽ¤',
  'Most Talented': 'â­',
  'Mr. Personality': 'ðŸŒŸ',
};

const AWARD_COLORS: Record<string, string> = {
  'Mr. Fresher': 'from-amber-500 to-yellow-300',
  'Ms. Fresher': 'from-pink-500 to-rose-300',
  'Best Dancer': 'from-purple-500 to-violet-300',
  'Best Singer': 'from-blue-500 to-cyan-300',
  'Most Talented': 'from-emerald-500 to-teal-300',
  'Mr. Personality': 'from-orange-500 to-amber-300',
};

export default function HallOfFame() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch('/api/winners');
        const data = await readJsonSafe<Winner[]>(res);
        setWinners(Array.isArray(data) ? data : []);
      } catch {
        setWinners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, []);

  const topTwo = winners.filter(w => w.award_title === 'Mr. Fresher' || w.award_title === 'Ms. Fresher');
  const rest = winners.filter(w => w.award_title !== 'Mr. Fresher' && w.award_title !== 'Ms. Fresher');

  return (
    <div className="min-h-screen bg-[#050510] grid-bg text-white pt-20 pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="text-amber-400" size={32} />
              <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">Hall of Fame</h1>
              <Trophy className="text-amber-400" size={32} />
            </div>
            <p className="text-gray-400 text-lg">The stars of Ignite'26</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {loading ? <LoadingSpinner text="Loading winners..." /> : winners.length === 0 ? (
          <div className="text-center py-20">
            <Crown size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500">Winners will be announced soon. Stay tuned!</p>
          </div>
        ) : (
          <>
            {/* Top 2 - Featured */}
            {topTwo.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {topTwo.map((winner, i) => (
                  <motion.div key={winner.id}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                    className="relative group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${AWARD_COLORS[winner.award_title] || 'from-purple-500 to-amber-500'} rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />
                    <div className="relative bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-3xl p-8 text-center overflow-hidden">
                      <div className="absolute top-4 right-4">
                        <Star className="text-amber-400" size={20} fill="currentColor" />
                      </div>
                      <div className="text-7xl mb-4">{AWARD_ICONS[winner.award_title] || 'ðŸ†'}</div>
                      <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4 bg-gradient-to-r ${AWARD_COLORS[winner.award_title] || 'from-purple-500 to-amber-500'} text-white`}>
                        {winner.award_title}
                      </div>
                      {winner.image_url ? (
                        <img src={winner.image_url} alt={winner.name}
                          className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-amber-400/30" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ff2d78] to-[#7c3aed] flex items-center justify-center mx-auto mb-4 text-4xl font-black">
                          {winner.name.charAt(0)}
                        </div>
                      )}
                      <h2 className="text-2xl font-black text-white mb-1">{winner.name}</h2>
                      <p className="text-gray-400 text-sm mb-3">{winner.roll_no} &bull; {winner.branch}</p>
                      {winner.description && <p className="text-gray-300 text-sm leading-relaxed">{winner.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-300">Other Award Winners</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((winner, i) => (
                    <motion.div key={winner.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl p-6 hover:border-purple-500/40 transition-all hover:-translate-y-1">
                      <div className="flex items-center gap-4 mb-4">
                        {winner.image_url ? (
                          <img src={winner.image_url} alt={winner.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff2d78] to-[#7c3aed] flex items-center justify-center text-2xl font-black">
                            {winner.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-white">{winner.name}</h3>
                          <p className="text-gray-400 text-xs">{winner.roll_no} &bull; {winner.branch}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{AWARD_ICONS[winner.award_title] || 'ðŸ†'}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${AWARD_COLORS[winner.award_title] || 'from-purple-500 to-amber-500'} text-white`}>
                          {winner.award_title}
                        </span>
                      </div>
                      {winner.description && <p className="text-gray-400 text-sm leading-relaxed">{winner.description}</p>}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

