import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, User, Hash, BookOpen, Mail, Phone } from 'lucide-react';

type FieldState = 'idle' | 'valid' | 'invalid';

interface FormData {
  name: string;
  roll_no: string;
  branch: string;
  email: string;
  phone: string;
  food_pref: string;
}

const BRANCHES = ['CSE', 'ECE', 'ME', 'IT', 'Civil', 'EEE', 'Chemical', 'Other'];
const FOOD_PREFS = ['veg', 'non-veg', 'jain'];

function validateField(name: string, value: string): FieldState {
  if (!value) return 'idle';
  switch (name) {
    case 'name': return value.trim().length >= 2 ? 'valid' : 'invalid';
    case 'roll_no': return /^\d{2}-[A-Z]{2,4}-\d{2,3}$/i.test(value.trim()) ? 'valid' : 'invalid';
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'valid' : 'invalid';
    case 'phone': return /^[0-9]{10}$/.test(value) ? 'valid' : 'invalid';
    case 'branch': return value !== '' ? 'valid' : 'idle';
    case 'food_pref': return value !== '' ? 'valid' : 'idle';
    default: return 'idle';
  }
}

export default function Register() {
  const [form, setForm] = useState<FormData>({ name: '', roll_no: '', branch: '', email: '', phone: '', food_pref: '' });
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<FormData & { id?: number } | null>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFieldStates(s => ({ ...s, [name]: validateField(name, value) }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Final validation
    const states: Record<string, FieldState> = {};
    let allValid = true;
    for (const [k, v] of Object.entries(form)) {
      const state = validateField(k, v);
      states[k] = state;
      if (state !== 'valid') allValid = false;
    }
    setFieldStates(states);
    if (!allValid) { setError('Please fix the highlighted fields before submitting.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess({ ...form, id: data.id });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const borderClass = (field: string) => {
    const s = fieldStates[field];
    if (s === 'valid') return 'border-emerald-500 focus:border-emerald-400';
    if (s === 'invalid') return 'border-red-500 focus:border-red-400';
    return 'border-white/10 focus:border-purple-500';
  };

  const iconClass = (field: string) => {
    const s = fieldStates[field];
    if (s === 'valid') return 'text-emerald-400';
    if (s === 'invalid') return 'text-red-400';
    return 'text-gray-500';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0d0a1a] flex items-center justify-center px-4 pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">You're In! 🎉</h2>
          <p className="text-gray-400 mb-8">Your registration for Freshero 2025 is confirmed.</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3 mb-8">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Name</span>
              <span className="text-white font-medium">{success.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Roll No</span>
              <span className="text-white font-medium">{success.roll_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Branch</span>
              <span className="text-white font-medium">{success.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Food Preference</span>
              <span className="text-white font-medium capitalize">{success.food_pref}</span>
            </div>
          </div>
          <p className="text-purple-300 text-sm">Save your Roll Number and Phone to access your profile later.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium mb-4">Freshero 2025</span>
            <h1 className="text-4xl font-black mb-2">Register Now</h1>
            <p className="text-gray-400">Fill in your details to secure your spot at the biggest fresher night.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
              <AlertCircle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass('name')}`} />
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., Aarav Sharma"
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${borderClass('name')}`} />
              </div>
              {fieldStates.name === 'invalid' && <p className="text-red-400 text-xs mt-1">Name must be at least 2 characters</p>}
            </div>

            {/* Roll No */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Roll Number *</label>
              <div className="relative">
                <Hash size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass('roll_no')}`} />
                <input name="roll_no" value={form.roll_no} onChange={handleChange} placeholder="e.g., 24-CS-01"
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${borderClass('roll_no')}`} />
              </div>
              {fieldStates.roll_no === 'invalid' && <p className="text-red-400 text-xs mt-1">Format: YY-BRANCH-NN (e.g., 24-CS-01)</p>}
              {fieldStates.roll_no === 'valid' && <p className="text-emerald-400 text-xs mt-1">✓ Valid format</p>}
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Branch *</label>
              <div className="relative">
                <BookOpen size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass('branch')}`} />
                <select name="branch" value={form.branch} onChange={handleChange}
                  className={`w-full bg-[#1a1530] border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors appearance-none ${borderClass('branch')}`}>
                  <option value="" className="text-gray-600">Select your branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">College Email *</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass('email')}`} />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="yourname@freshero.edu.in"
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${borderClass('email')}`} />
              </div>
              {fieldStates.email === 'invalid' && <p className="text-red-400 text-xs mt-1">Enter a valid email address</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass('phone')}`} />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10}
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${borderClass('phone')}`} />
              </div>
              {fieldStates.phone === 'invalid' && <p className="text-red-400 text-xs mt-1">Must be exactly 10 digits</p>}
              {fieldStates.phone === 'valid' && <p className="text-emerald-400 text-xs mt-1">✓ Valid phone number</p>}
            </div>

            {/* Food Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Food Preference *</label>
              <div className="flex gap-3">
                {FOOD_PREFS.map(f => (
                  <button key={f} type="button" onClick={() => { setForm(fd => ({ ...fd, food_pref: f })); setFieldStates(s => ({ ...s, food_pref: 'valid' })); }}
                    className={`flex-1 py-3 rounded-xl border font-medium text-sm capitalize transition-all ${
                      form.food_pref === f
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}>
                    {f === 'veg' ? '🥦' : f === 'non-veg' ? '🍗' : '🌿'} {f}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Registering...' : 'Complete Registration 🎉'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            Already registered? <a href="/my-profile" className="text-purple-400 hover:underline">View your profile</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
