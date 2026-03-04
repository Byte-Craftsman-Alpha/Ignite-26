import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Pencil, ShieldCheck, X, ImageUp } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { authHeaders } from '../../lib/auth';
import { getErrorMessage, readJsonSafe } from '../../lib/http';

interface TeamMember {
  id: number;
  name: string;
  branch: string;
  year: string;
  roles: string[];
  fields: string;
  profile_image: string;
  whatsapp_number: string;
}

interface MemberForm {
  name: string;
  branch: string;
  year: string;
  roles: string;
  fields: string;
  whatsapp_number: string;
}

const BRANCHES = ['CSE Core', 'CSE AI/ML', 'IT', 'ECE', 'ME'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const PREVIEW_SIZE = 176;

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function toForm(member?: TeamMember): MemberForm {
  if (!member) {
    return {
      name: '',
      branch: BRANCHES[0],
      year: YEARS[0],
      roles: '',
      fields: '',
      whatsapp_number: '',
    };
  }

  return {
    name: member.name,
    branch: member.branch,
    year: member.year,
    roles: member.roles.join(', '),
    fields: member.fields,
    whatsapp_number: member.whatsapp_number,
  };
}

function parseRoles(raw: string): string[] {
  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function getOffsetBounds(imageWidth: number, imageHeight: number, zoom: number, frameSize: number) {
  const baseScale = Math.max(frameSize / imageWidth, frameSize / imageHeight);
  const scale = baseScale * zoom;
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  return {
    maxX: Math.max((drawWidth - frameSize) / 2, 0),
    maxY: Math.max((drawHeight - frameSize) / 2, 0),
  };
}

function clampOffsets(offsetX: number, offsetY: number, imageWidth: number, imageHeight: number, zoom: number, frameSize: number) {
  const { maxX, maxY } = getOffsetBounds(imageWidth, imageHeight, zoom, frameSize);
  return {
    x: Math.min(Math.max(offsetX, -maxX), maxX),
    y: Math.min(Math.max(offsetY, -maxY), maxY),
  };
}

async function renderSquareCrop(src: string, zoom: number, offsetX: number, offsetY: number): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to create canvas context');

  const baseScale = Math.max(size / img.width, size / img.height);
  const scale = baseScale * zoom;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = (size - drawWidth) / 2 + offsetX;
  const dy = (size - drawHeight) / 2 + offsetY;

  context.fillStyle = '#111827';
  context.fillRect(0, 0, size, size);
  context.drawImage(img, dx, dy, drawWidth, drawHeight);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ManagementTeamAdmin() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberForm>(toForm());
  const [profileImage, setProfileImage] = useState('');
  const [imageSource, setImageSource] = useState('');
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [imageDirty, setImageDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; baseX: number; baseY: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/management-team');
      const data = await readJsonSafe<TeamMember[]>(res);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetCropState = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setDragStart(null);
    setImageDirty(false);
    setImageSize(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(toForm());
    setProfileImage('');
    setImageSource('');
    resetCropState();
    setShowForm(true);
    setError('');
  };

  const openEdit = async (member: TeamMember) => {
    setEditing(member);
    setForm(toForm(member));
    setProfileImage(member.profile_image || '');
    setImageSource(member.profile_image || '');
    resetCropState();
    setShowForm(true);
    setError('');

    if (member.profile_image) {
      try {
        const img = await loadImage(member.profile_image);
        setImageSize({ width: img.width, height: img.height });
      } catch {
        setImageSize(null);
      }
    }
  };

  const closeForm = () => {
    setEditing(null);
    setForm(toForm());
    setProfileImage('');
    setImageSource('');
    resetCropState();
    setShowForm(false);
    setError('');
  };

  const handleImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file');
      return;
    }

    try {
      setError('');
      const source = await readFileAsDataUrl(file);
      const img = await loadImage(source);
      setImageSource(source);
      setImageSize({ width: img.width, height: img.height });
      setProfileImage('');
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setDragStart(null);
      setImageDirty(true);
    } catch {
      setError('Failed to read image file');
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(nextZoom);
    if (imageSize) {
      const clamped = clampOffsets(offsetX, offsetY, imageSize.width, imageSize.height, nextZoom, PREVIEW_SIZE);
      setOffsetX(clamped.x);
      setOffsetY(clamped.y);
    }
    if (imageSource) setImageDirty(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSource || !imageSize) return;
    setDragStart({ x: event.clientX, y: event.clientY, baseX: offsetX, baseY: offsetY });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart || !imageSource || !imageSize) return;

    const rawX = dragStart.baseX + (event.clientX - dragStart.x);
    const rawY = dragStart.baseY + (event.clientY - dragStart.y);
    const clamped = clampOffsets(rawX, rawY, imageSize.width, imageSize.height, zoom, PREVIEW_SIZE);

    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
    setImageDirty(true);
  };

  const handlePointerUp = () => {
    setDragStart(null);
  };

  const clearPhoto = () => {
    setImageSource('');
    setProfileImage('');
    resetCropState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let finalProfile = profileImage;

      if (imageSource && (imageDirty || !profileImage)) {
        setProcessingImage(true);
        finalProfile = await renderSquareCrop(imageSource, zoom, offsetX, offsetY);
        setProcessingImage(false);
      }

      const payload = {
        ...form,
        roles: parseRoles(form.roles),
        profile_image: finalProfile,
      };

      const res = await fetch('/api/management-team', {
        method: editing ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(getErrorMessage(data, 'Failed to save member'));

      closeForm();
      fetchMembers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save member');
    } finally {
      setProcessingImage(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    const ok = window.confirm(`Delete ${member.name} from management team?`);
    if (!ok) return;

    setDeleting(member.id);
    try {
      await fetch('/api/management-team', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ id: member.id }),
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black">Management Team</h1>
              <p className="text-gray-400 text-sm">Admin-only control for team listing</p>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors">
            <Plus size={16} /> Add Member
          </button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-400" />
                {editing ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex flex-col items-center">
                  <div
                    className="w-44 h-44 rounded-2xl border border-white/20 overflow-hidden bg-[#0e0a1f] relative cursor-move select-none touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {imageSource ? (
                      <img
                        src={imageSource}
                        alt="Crop preview"
                        draggable={false}
                        className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                        style={{
                          transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${zoom})`,
                          transformOrigin: 'center center',
                        }}
                      />
                    ) : profileImage ? (
                      <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-200 bg-gradient-to-br from-indigo-600/50 to-purple-600/40">
                        {getInitials(form.name || 'TM')}
                      </div>
                    )}
                    <div className="absolute inset-0 border border-white/30 pointer-events-none" />
                  </div>
                  <label className="mt-3 w-full">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                    <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/30 cursor-pointer">
                      <ImageUp size={14} /> Upload Photo
                    </span>
                  </label>
                  <button type="button" onClick={clearPhoto} className="mt-2 text-xs text-gray-400 hover:text-white">Remove photo</button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-300">Drag photo to reposition inside the 1:1 frame.</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={e => handleZoomChange(Number(e.target.value))}
                      className="w-full"
                      disabled={!imageSource}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setOffsetX(0);
                        setOffsetY(0);
                        if (imageSource) setImageDirty(true);
                      }}
                      disabled={!imageSource}
                      className="px-4 py-2 rounded-xl text-sm bg-white/10 border border-white/20 text-gray-200 hover:bg-white/15 disabled:opacity-50"
                    >
                      Reset Frame
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Crop is applied automatically when you save.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Branch *</label>
                <select value={form.branch} onChange={e => setForm(prev => ({ ...prev, branch: e.target.value }))} className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Year *</label>
                <select value={form.year} onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))} className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">WhatsApp Number *</label>
                <input value={form.whatsapp_number} maxLength={10} onChange={e => setForm(prev => ({ ...prev, whatsapp_number: e.target.value }))} placeholder="10 digit number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Roles * (comma-separated)</label>
                <input value={form.roles} onChange={e => setForm(prev => ({ ...prev, roles: e.target.value }))} placeholder="Lead Coordinator, Sponsorship" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Fields Dealt *</label>
                <input value={form.fields} onChange={e => setForm(prev => ({ ...prev, fields: e.target.value }))} placeholder="Registrations, Stage ops, Hospitality" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              </div>

              {error && <p className="md:col-span-2 text-red-400 text-sm">{error}</p>}

              <div className="md:col-span-2">
                <button type="submit" disabled={submitting || processingImage} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {processingImage ? 'Processing Photo...' : submitting ? 'Saving...' : editing ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? (
          <LoadingSpinner text="Loading management team..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {members.map(member => (
              <div key={member.id} className="bg-gradient-to-br from-white/[0.07] to-white/[0.03] border border-white/15 rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-indigo-300/30 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center">
                      {member.profile_image ? (
                        <img src={member.profile_image} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate">{member.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{member.branch} | {member.year}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(member)} className="w-8 h-8 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 flex items-center justify-center" title="Edit member">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(member)} disabled={deleting === member.id} className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center" title="Delete member">
                      {deleting === member.id ? '...' : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 uppercase tracking-[0.12em] mb-2">Roles</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(member.roles.length ? member.roles : ['Unassigned']).map(role => (
                    <span key={role} className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{role}</span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 uppercase tracking-[0.12em] mb-2">Fields</p>
                <p className="text-sm text-gray-200 leading-relaxed">{member.fields || 'Not specified'}</p>
              </div>
            ))}

            {members.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500">No team members added yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
