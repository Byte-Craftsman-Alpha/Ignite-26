import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Users, ArrowRight, Calendar, MapPin, Clock } from 'lucide-react';
import Countdown from '../components/Countdown';

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0a1a]/60 via-[#0d0a1a]/40 to-[#0d0a1a]" />
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-medium mb-8">
            <Sparkles size={14} />
            Institute of Engineering & Technology &bull; Batch 2024
          </motion.div>

          <motion.h1 initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-4">
            <span className="text-white">Ignite</span>
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">'26</span>
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-light text-purple-300 tracking-widest">2026</span>
          </motion.h1>

          <motion.p initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Welcome to the grandest fresher of the year. An event of music, dance, fashion, and unforgettable memories.
          </motion.p>

          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12">
            <p className="text-purple-300 text-sm font-medium tracking-widest uppercase mb-6">Event Countdown</p>
            <Countdown />
          </motion.div>

          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2">
              Register Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/gallery"
              className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all">
              View Gallery
            </Link>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-purple-400/50 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-purple-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, label: 'Date', value: 'March 15, 2026', color: 'purple' },
              { icon: Clock, label: 'Time', value: '11:00 AM Onwards', color: 'amber' },
              { icon: MapPin, label: 'Venue', value: 'Top secret', color: 'pink' },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  item.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-pink-500/20 text-pink-400'
                }`}>
                  <item.icon size={22} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-white font-semibold">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">What Awaits You</h2>
            <p className="text-gray-400">An evening packed with talent, glamour, and celebration</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎤', title: 'Live Performances', desc: 'Singing, dancing, and stand-up comedy by your batchmates' },
              { icon: '👑', title: 'Crown Ceremony', desc: 'Mr. & Ms. Fresher crowned on stage with full fanfare' },
              { icon: '📸', title: 'Photo Booth', desc: 'Capture memories with themed props and backdrops' },
              { icon: '🍽️', title: 'Grand Dinner', desc: 'Delicious spread with veg, non-veg, and Jain options' },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/40 transition-all hover:-translate-y-1 group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-amber-600" />
            <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover opacity-10" />
            <div className="relative p-10 sm:p-16 text-center">
              <Users size={40} className="mx-auto mb-4 text-white/80" />
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Secure Your Spot</h2>
              <p className="text-white/80 mb-8 text-lg">Limited seats available. Register before they run out!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="px-8 py-4 bg-white text-purple-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                  Register Now
                </Link>
                <Link to="/my-profile" className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                  Already Registered?
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center">
        <p className="text-gray-500 text-sm">
          &copy; 2026 Ignite'26 &mdash; Organized by the IGNITE Team &bull; Institute of Engineering & Technology
        </p>
      </footer>
    </div>
  );
}
