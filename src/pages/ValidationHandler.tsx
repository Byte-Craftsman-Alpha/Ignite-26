import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Camera, Search, CheckCircle2, XCircle, QrCode, X } from 'lucide-react';
import jsQR from 'jsqr';
import LoadingSpinner from '../components/LoadingSpinner';
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
  payment_verified: boolean;
  check_in_status: boolean;
  check_in_time: string | null;
  registered_at: string;
}

export default function ValidationHandler() {
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [query, setQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [results, setResults] = useState<Participant[]>([]);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [updating, setUpdating] = useState<'payment' | 'checkin' | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanLockRef = useRef(false);

  const canScan = useMemo(() => unlocked && !selected, [unlocked, selected]);

  const apiCall = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/validation-handler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, ...payload }),
    });
    return { res, data: await readJsonSafe<Record<string, unknown>>(res) };
  };

  const verifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { res, data } = await apiCall({ action: 'verify' });
      if (!res.ok) throw new Error(getErrorMessage(data, 'Access denied'));
      setUnlocked(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Access denied');
    } finally {
      setAuthLoading(false);
    }
  };

  const runLookup = async (payload: { query?: string; qr_text?: string }) => {
    setLookupLoading(true);
    setLookupError('');
    try {
      const { res, data } = await apiCall({ action: 'lookup', ...payload });
      if (!res.ok) throw new Error(getErrorMessage(data, 'Lookup failed'));
      const rows = Array.isArray(data?.rows) ? (data.rows as Participant[]) : [];
      setResults(rows);
      if (rows.length === 1) setSelected(rows[0]);
      if (rows.length === 0) setLookupError('No matching registration found.');
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const startCamera = async () => {
    if (!canScan) return;
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || scanLockRef.current || !canScan) return;
        if (videoRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;
        try {
          scanLockRef.current = true;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const width = video.videoWidth;
          const height = video.videoHeight;
          if (!width || !height) return;

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, width, height, { inversionAttempts: 'dontInvert' });
          const rawValue = String(code?.data || '').trim();
          if (rawValue) {
            await runLookup({ qr_text: rawValue });
          }
        } finally {
          scanLockRef.current = false;
        }
      }, 500);
    } catch (err: unknown) {
      setCameraError(err instanceof Error ? err.message : 'Failed to start camera');
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    if (canScan) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, canScan]);

  const handleUpdate = async (kind: 'payment' | 'checkin', nextValue: boolean) => {
    if (!selected) return;
    setUpdating(kind);
    setLookupError('');
    try {
      const payload =
        kind === 'payment'
          ? { action: 'update', participant_id: selected.id, payment_verified: nextValue }
          : { action: 'update', participant_id: selected.id, check_in_status: nextValue };

      const { res, data } = await apiCall(payload);
      if (!res.ok) throw new Error(getErrorMessage(data, 'Failed to update'));
      const updated = data?.participant as Participant | undefined;
      if (updated) {
        setSelected(updated);
        setResults((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#050510] grid-bg text-white pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-[#0d0d1f]/95 p-6">
          <h1 className="text-2xl font-black flex items-center gap-2"><Shield size={20} /> Validation Handler</h1>
          <p className="text-sm text-gray-400 mt-2">Enter password to access this hidden verification page.</p>
          <form onSubmit={verifyPassword} className="mt-5 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Access password"
              className="w-full bg-[#15152a] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400/50"
            />
            {authError && <p className="text-sm text-red-300">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading || !password.trim()}
              className="w-full rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 py-2.5 font-semibold hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {authLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] grid-bg text-white pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-3xl font-black">Payment / Check-in Handler</h1>
          <p className="text-sm text-gray-400 mt-1">QR scan auto-runs when camera is active. Camera pauses while popup is open.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d1f]/95 p-4">
            <p className="text-sm text-gray-300 mb-2 flex items-center gap-2"><Camera size={15} /> QR Scanner</p>
            <div className="aspect-video rounded-xl bg-black/40 border border-white/10 overflow-hidden relative">
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 grid place-items-center">
                  <LoadingSpinner text="Starting camera..." />
                </div>
              )}
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {cameraError && <p className="mt-2 text-sm text-amber-300">{cameraError}</p>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d0d1f]/95 p-4">
            <p className="text-sm text-gray-300 mb-2 flex items-center gap-2"><Search size={15} /> Quick Search</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runLookup({ query });
              }}
              className="flex gap-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by roll, payment id, email, phone, name"
                className="flex-1 bg-[#15152a] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400/50"
              />
              <button
                type="submit"
                disabled={lookupLoading || !query.trim()}
                className="px-4 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {lookupLoading ? '...' : 'Find'}
              </button>
            </form>
            {lookupError && <p className="text-sm text-red-300 mt-2">{lookupError}</p>}

            <div className="mt-4 max-h-80 overflow-auto divide-y divide-white/5">
              {results.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full text-left px-1 py-2 hover:bg-white/[0.03] rounded-lg"
                >
                  <p className="text-sm text-white font-medium">{p.full_name}</p>
                  <p className="text-xs text-gray-400">{p.roll_number} | {p.payment_id}</p>
                </button>
              ))}
              {!results.length && !lookupLoading && (
                <p className="text-sm text-gray-500 py-3">No results yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 grid place-items-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0c1d]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold">{selected.full_name}</h2>
                <p className="text-xs text-gray-400">{selected.roll_number}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <p><span className="text-gray-400">Branch:</span> {selected.branch}</p>
              <p><span className="text-gray-400">Year:</span> {selected.year}</p>
              <p><span className="text-gray-400">Email:</span> {selected.email}</p>
              <p><span className="text-gray-400">WhatsApp:</span> {selected.whatsapp_number}</p>
              <p><span className="text-gray-400">Payment ID:</span> {selected.payment_id}</p>
              <p><span className="text-gray-400">Skills:</span> {selected.skills.join(', ') || '-'}</p>

              <div className="pt-2 flex items-center gap-2">
                {selected.payment_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300"><CheckCircle2 size={14} /> Payment Verified</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300"><XCircle size={14} /> Payment Pending</span>
                )}
                {selected.check_in_status ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300"><CheckCircle2 size={14} /> Checked In</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-500/15 text-gray-300"><QrCode size={14} /> Not Checked In</span>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex flex-wrap gap-2">
              <button
                onClick={() => handleUpdate('payment', !selected.payment_verified)}
                disabled={updating !== null}
                className="px-3 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 text-sm hover:bg-cyan-500/20 disabled:opacity-50"
              >
                {updating === 'payment' ? 'Updating...' : selected.payment_verified ? 'Mark Payment Pending' : 'Mark Payment Verified'}
              </button>
              <button
                onClick={() => handleUpdate('checkin', !selected.check_in_status)}
                disabled={updating !== null}
                className="px-3 py-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-sm hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {updating === 'checkin' ? 'Updating...' : selected.check_in_status ? 'Undo Check-in' : 'Mark Checked In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
