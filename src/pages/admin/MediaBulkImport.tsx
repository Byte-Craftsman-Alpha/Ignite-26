import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Link2, CheckCircle2 } from 'lucide-react';
import { authHeaders } from '../../lib/auth';
import { generateImagePreviewDataUrl, generateVideoPosterDataUrl, readFileAsDataUrl } from '../../lib/mediaUpload';

function extractDriveFileId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

async function uploadMedia(payload: Record<string, unknown>) {
  const res = await fetch('/api/media', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export default function MediaBulkImport() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileCategory, setFileCategory] = useState('general');
  const [fileCaption, setFileCaption] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileResult, setFileResult] = useState('');

  const [driveLinks, setDriveLinks] = useState('');
  const [driveCategory, setDriveCategory] = useState('general');
  const [driveType, setDriveType] = useState<'image' | 'video'>('image');
  const [driveCaption, setDriveCaption] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveResult, setDriveResult] = useState('');

  const handleBulkFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setFileResult('Select at least one file.');
      return;
    }

    setFileLoading(true);
    setFileResult('');
    let success = 0;

    for (const file of files) {
      try {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const original = await readFileAsDataUrl(file);
        const preview = type === 'image'
          ? await generateImagePreviewDataUrl(file)
          : await generateVideoPosterDataUrl(file);

        const ok = await uploadMedia({
          type,
          category: fileCategory,
          caption: fileCaption,
          file_data_url: original,
          preview_data_url: preview,
        });

        if (ok) success += 1;
      } catch {
        // Skip failures and continue with next file.
      }
    }

    setFileLoading(false);
    setFileResult(`Uploaded ${success}/${files.length} files.`);
  };

  const handleDriveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = driveLinks
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setDriveResult('Paste at least one public Google Drive link.');
      return;
    }

    setDriveLoading(true);
    setDriveResult('');
    let success = 0;

    for (const link of lines) {
      const id = extractDriveFileId(link);
      if (!id) continue;

      const url = `https://drive.google.com/uc?export=download&id=${id}`;
      const thumbUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
      const ok = await uploadMedia({
        type: driveType,
        category: driveCategory,
        caption: driveCaption,
        url,
        thumb_url: thumbUrl,
      });
      if (ok) success += 1;
    }

    setDriveLoading(false);
    setDriveResult(`Imported ${success}/${lines.length} Google Drive links.`);
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/upload" className="text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black">Bulk Media Import</h1>
            <p className="text-gray-400 text-sm">Upload many files or import from public Google Drive links</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleBulkFiles} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Upload size={18} className="text-purple-300" /> Bulk File Upload</h2>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={e => setFiles(Array.from(e.target.files || []))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600/30 file:px-3 file:py-2 file:text-purple-200"
            />
            <input value={fileCaption} onChange={e => setFileCaption(e.target.value)} placeholder="Caption (applies to all)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600" />
            <select value={fileCategory} onChange={e => setFileCategory(e.target.value)} className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white">
              <option value="general">General</option>
              <option value="winner">Winner</option>
            </select>
            <button type="submit" disabled={fileLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold disabled:opacity-50">
              {fileLoading ? 'Uploading...' : 'Upload Files'}
            </button>
            {fileResult && <p className="text-sm text-gray-300 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-300" /> {fileResult}</p>}
          </form>

          <form onSubmit={handleDriveImport} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Link2 size={18} className="text-amber-300" /> Google Drive Shared Links</h2>
            <textarea
              value={driveLinks}
              onChange={e => setDriveLinks(e.target.value)}
              placeholder="Paste one public Drive link per line"
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none"
            />
            <input value={driveCaption} onChange={e => setDriveCaption(e.target.value)} placeholder="Caption (applies to all)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600" />
            <div className="grid grid-cols-2 gap-3">
              <select value={driveCategory} onChange={e => setDriveCategory(e.target.value)} className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white">
                <option value="general">General</option>
                <option value="winner">Winner</option>
              </select>
              <select value={driveType} onChange={e => setDriveType(e.target.value as 'image' | 'video')} className="w-full bg-[#1a1530] border border-white/10 rounded-xl px-4 py-3 text-white">
                <option value="image">Image Links</option>
                <option value="video">Video Links</option>
              </select>
            </div>
            <button type="submit" disabled={driveLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold disabled:opacity-50">
              {driveLoading ? 'Importing...' : 'Import Links'}
            </button>
            {driveResult && <p className="text-sm text-gray-300 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-300" /> {driveResult}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
