import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Hash, Phone, Mail, CheckCircle, XCircle, Search, QrCode, Download, Share2, FileDown, AlertCircle, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
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

const EVENT_INFO = {
  title: "Ignite'26 Fresher Event",
  date: 'March 15, 2026',
  time: '11:00 AM onwards',
  venue: 'Top secret (to be announced to verified participants)',
  dressCodeMale: 'Formals',
  dressCodeFemale: 'Western Wear',
  supportNote: 'Payment verification may take 2-3 days. Please wait for confirmation from the support team.',
};

const EVENT_FLOW = [
  '11:00 - Kickoff and Entry Flow',
  '12:30 - Open Stage Rounds',
  '15:00 - Spotlight Challenges',
  '18:30 - Crown Ceremony',
];

function fileNameSafe(text: string) {
  return text.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-$/g, '').toLowerCase();
}

async function dataUrlToFile(dataUrl: string, name: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || 'image/png' });
}

export default function MyProfile() {
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState('');
  const [qrBusy, setQrBusy] = useState<'download' | 'share' | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const qrPayload = useMemo(() => {
    if (!participant) return '';
    return JSON.stringify({
      id: participant.id,
      full_name: participant.full_name,
      roll_number: participant.roll_number,
      payment_id: participant.payment_id,
      email: participant.email,
      whatsapp_number: participant.whatsapp_number,
    });
  }, [participant]);

  const qrImageUrl = useMemo(() => {
    if (!qrPayload) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrPayload)}`;
  }, [qrPayload]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setParticipant(null);
    setActionMessage('');
    try {
      const res = await fetch('/api/participant-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          roll_number: rollNumber.trim(),
          whatsapp_number: whatsappNumber.trim(),
        }),
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

  const downloadQr = async () => {
    if (!participant || !qrImageUrl) return;
    setQrBusy('download');
    setActionMessage('');
    try {
      const response = await fetch(qrImageUrl);
      if (!response.ok) throw new Error('Failed to load QR image');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNameSafe(participant.full_name || 'participant')}-ignite26-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to download QR');
    } finally {
      setQrBusy(null);
    }
  };

  const shareQr = async () => {
    if (!participant || !qrPayload) return;
    setQrBusy('share');
    setActionMessage('');
    try {
      const file = await dataUrlToFile(await QRCode.toDataURL(qrPayload), `${fileNameSafe(participant.full_name || 'participant')}-ignite26-qr.png`);
      const shareText = `${participant.full_name} | ${participant.roll_number} | Ignite'26`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Ignite'26 Registration QR",
          text: shareText,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Ignite'26 Registration QR",
          text: `${shareText}\n${qrPayload}`,
        });
      } else {
        await navigator.clipboard.writeText(qrPayload);
        setActionMessage('QR payload copied to clipboard.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setQrBusy(null);
        return;
      }
      setActionMessage(err instanceof Error ? err.message : 'Failed to share QR');
    } finally {
      setQrBusy(null);
    }
  };

  const downloadTicketPdf = async () => {
    if (!participant || !participant.payment_verified) return;

    setPdfBusy(true);
    setActionMessage('');
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 34;
      const contentW = pageW - margin * 2;
      const qrDataUrl = await QRCode.toDataURL(qrPayload);

      doc.setFillColor(5, 5, 16);
      doc.rect(0, 0, pageW, pageH, 'F');

      doc.setFillColor(13, 13, 31);
      doc.roundedRect(margin, margin, contentW, pageH - margin * 2, 14, 14, 'F');

      doc.setFillColor(34, 18, 58);
      doc.roundedRect(margin, margin, contentW, 104, 14, 14, 'F');
      doc.setTextColor(197, 179, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('IGNITE 26 | VERIFIED EVENT PASS', margin + 20, margin + 28);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(23);
      doc.text("Ignite'26 Identity Pass", margin + 20, margin + 58);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(EVENT_INFO.title, margin + 20, margin + 78);

      let y = margin + 124;
      doc.setTextColor(133, 168, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('PARTICIPANT', margin + 18, y);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(participant.full_name, margin + 18, y + 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(169, 176, 202);
      doc.text(`${participant.roll_number} | ${participant.branch} | ${participant.year}`, margin + 18, y + 42);

      y += 62;
      doc.setDrawColor(41, 45, 74);
      doc.line(margin + 18, y, pageW - margin - 18, y);
      y += 22;

      const col1X = margin + 18;
      const col2X = margin + 248;
      const valueOffset = 78;
      const rowGap = 20;
      const rows = [
        ['Email', participant.email, 'WhatsApp', participant.whatsapp_number],
        ['Payment ID', participant.payment_id, 'Registered On', new Date(participant.registered_at).toLocaleString()],
        ['Skills', participant.skills.join(', ') || '-', 'Status', 'Payment Verified'],
      ];

      doc.setFontSize(10);
      rows.forEach((item, idx) => {
        const top = y + idx * rowGap;
        doc.setTextColor(138, 153, 193);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item[0]}:`, col1X, top);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(233, 237, 248);
        doc.text(doc.splitTextToSize(item[1], 150), col1X + valueOffset, top);

        doc.setTextColor(138, 153, 193);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item[2]}:`, col2X, top);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(233, 237, 248);
        doc.text(doc.splitTextToSize(item[3], 180), col2X + valueOffset, top);
      });

      y += rows.length * rowGap + 18;
      doc.setDrawColor(41, 45, 74);
      doc.line(margin + 18, y, pageW - margin - 18, y);

      y += 20;
      const qrBoxW = 152;
      const qrBoxH = 172;
      const qrCardX = margin + (contentW - qrBoxW) / 2;
      const qrCardY = y;
      const qrImageSize = 116;
      const qrImageX = qrCardX + (qrBoxW - qrImageSize) / 2;
      const qrImageY = qrCardY + 14;

      doc.setFillColor(22, 22, 44);
      doc.roundedRect(qrCardX, qrCardY, qrBoxW, qrBoxH, 10, 10, 'F');
      doc.addImage(qrDataUrl, 'PNG', qrImageX, qrImageY, qrImageSize, qrImageSize);
      doc.setFontSize(8.5);
      doc.setTextColor(170, 184, 220);
      doc.text('Mandatory for check-in validation', qrCardX + qrBoxW / 2, qrCardY + qrBoxH - 16, { align: 'center' });

      y += qrBoxH + 24;
      doc.setTextColor(133, 168, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EVENT DETAILS', margin + 18, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(233, 237, 248);

      const leftBlock = [
        `Date: ${EVENT_INFO.date}`,
        `Time: ${EVENT_INFO.time}`,
        `Venue: ${EVENT_INFO.venue}`,
      ];
      const rightBlock = [
        `Dress Code (Boys): ${EVENT_INFO.dressCodeMale}`,
        `Dress Code (Girls): ${EVENT_INFO.dressCodeFemale}`,
      ];

      leftBlock.forEach((line, idx) => doc.text(line, margin + 18, y + 22 + idx * 16));
      rightBlock.forEach((line, idx) => doc.text(line, margin + 302, y + 22 + idx * 16));

      y += 78;
      doc.setTextColor(133, 168, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRAM FLOW', margin + 18, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(233, 237, 248);
      doc.setFontSize(10);
      EVENT_FLOW.forEach((line, idx) => doc.text(`- ${line}`, margin + 18, y + 18 + idx * 15));

      y += 90;
      doc.setDrawColor(41, 45, 74);
      doc.line(margin + 18, y, pageW - margin - 18, y);
      doc.setTextColor(160, 171, 198);
      doc.setFontSize(9);
      doc.text('Carry this pass (digital/printed) with college ID at entry.', margin + 18, y + 16);
      doc.text('Need help? Open Management Team page and contact the undersigned coordinators.', margin + 18, y + 30);

      const fileName = `ignite26-pass-${fileNameSafe(participant.full_name || participant.roll_number)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setPdfBusy(false);
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
            <p className="text-gray-400">Enter your email, roll number, and WhatsApp number to view your registration.</p>
          </div>

          <form onSubmit={handleLookup} className="bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-2xl p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@example.com"
                    className="w-full bg-[#0d0d1f]/90 border border-[#1e1e3f] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2d78]"
                  />
                </div>
              </div>
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
                  <span className="text-gray-400 text-sm">Payment Status</span>
                  <div className="flex items-center gap-2">
                    {participant.payment_verified ? (
                      <><CheckCircle size={18} className="text-emerald-400" /><span className="text-emerald-400 font-semibold">Verified</span></>
                    ) : (
                      <><AlertCircle size={18} className="text-amber-300" /><span className="text-amber-300 font-semibold">Pending Verification</span></>
                    )}
                  </div>
                </div>

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
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Registered On</span>
                  <span className="text-white text-sm">{new Date(participant.registered_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-2 pt-4 border-t border-white/10">
                  <p className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2"><QrCode size={15} /> Registration QR</p>
                  <div className="rounded-2xl border border-white/10 bg-[#111128] p-4">
                    <img src={qrImageUrl} alt="Registration QR" className="w-52 h-52 mx-auto rounded-lg bg-white p-2" />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={downloadQr}
                        disabled={qrBusy !== null}
                        className="flex-1 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm hover:bg-cyan-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                      >
                        <Download size={14} /> {qrBusy === 'download' ? 'Downloading...' : 'Download QR'}
                      </button>
                      <button
                        type="button"
                        onClick={shareQr}
                        disabled={qrBusy !== null}
                        className="flex-1 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm hover:bg-violet-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                      >
                        <Share2 size={14} /> {qrBusy === 'share' ? 'Sharing...' : 'Share QR'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-4 border-t border-white/10">
                  {participant.payment_verified ? (
                    <button
                      type="button"
                      onClick={downloadTicketPdf}
                      disabled={pdfBusy}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#7c3aed] text-white font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      <FileDown size={16} /> {pdfBusy ? 'Generating PDF...' : 'Download Event PDF Pass'}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <p className="text-amber-200 text-sm leading-relaxed">
                        {EVENT_INFO.supportNote}
                      </p>
                      <Link
                        to="/management-team"
                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm hover:bg-emerald-500/20"
                      >
                        <Users size={14} /> Contact Management Team
                      </Link>
                    </div>
                  )}
                </div>

                {actionMessage && <p className="text-xs text-gray-300">{actionMessage}</p>}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

