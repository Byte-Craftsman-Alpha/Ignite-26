import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Trash2, Image, ArrowLeft, Plus, X } from 'lucide-react';
import { authHeaders } from '../../lib/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

interface MediaItem {
  id: number;
  url: string;
  caption: string;
  type: string;
  category: string;
  uploaded_at: string;
}

export default function MediaUpload() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', caption: '', type: 'image', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media', { headers: authHeaders() });
      const data = await res.json();
      setMedia(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url) { setError('URL is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ url: '', caption: '', type: 'image', category: 'general' });
      setShowForm(false);
      fetchMedia();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch('/api/media', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id }) });
      fetchMedia();
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black">Media Manager</h1>
              <p className="text-gray-400 text-sm">Upload and manage gallery images</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Media'}
          </button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Upload size={18} className="text-purple-400" /> Add New Media</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Image/Video URL *</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Caption</label>
                <input value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                  placeholder="Optional caption"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="general">General</option>
                    <option value="winner">Winner</option>
                  </select>
                </div>
              </div>
              {error && <p className="md:col-span-2 text-red-400 text-sm">{error}</p>}
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? <LoadingSpinner text="Loading media..." /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="group relative rounded-xl overflow-hidden aspect-square bg-white/5">
                <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-end">
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                      {deleting === item.id ? '...' : <Trash2 size={14} />}
                    </button>
                  </div>
                  <div>
                    {item.caption && <p className="text-white text-xs font-medium truncate">{item.caption}</p>}
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/50 text-purple-200">{item.type}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/50 text-amber-200">{item.category}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {media.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Image size={40} className="mx-auto text-gray-700 mb-3" />
                <p className="text-gray-500">No media yet. Add some above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
