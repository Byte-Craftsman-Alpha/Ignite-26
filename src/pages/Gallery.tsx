import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { readJsonSafe } from '../lib/http';

interface MediaItem {
  id: number;
  url: string;
  caption: string;
  type: string;
  category: string;
  uploaded_at: string;
}

export default function Gallery() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`/api/media${filter !== 'all' ? `?category=${filter}` : ''}`);
      const data = await readJsonSafe<MediaItem[]>(res);
      setMedia(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); fetchMedia(); }, [filter]);

  const filters = [
    { value: 'all', label: 'All Media' },
    { value: 'general', label: 'Event Moments' },
    { value: 'winner', label: 'Winners' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium mb-4">
            <Image size={14} /> Media Hub
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">Gallery</h1>
          <p className="text-gray-400">Relive the magic of Ignite'26</p>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Filter size={16} className="text-gray-500" />
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner text="Loading gallery..." /> : media.length === 0 ? (
          <div className="text-center py-20">
            <Image size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500">No media uploaded yet. Check back after the event!</p>
          </div>
        ) : (
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {media.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="break-inside-avoid mb-4 group cursor-pointer relative overflow-hidden rounded-2xl"
                onClick={() => setLightbox(item)}>
                <img src={item.url} alt={item.caption}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium">{item.caption}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      item.category === 'winner' ? 'bg-amber-500/30 text-amber-300' : 'bg-purple-500/30 text-purple-300'
                    }`}>{item.category}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <img src={lightbox.url} alt={lightbox.caption} className="max-h-[80vh] rounded-2xl object-contain" />
              <button onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
                <X size={18} />
              </button>
              {lightbox.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 rounded-b-2xl">
                  <p className="text-white font-medium">{lightbox.caption}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
