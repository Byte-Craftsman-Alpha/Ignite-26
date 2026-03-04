import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Menu, X, LogOut, Shield } from 'lucide-react';
import { getToken, removeToken } from '../lib/auth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsAdmin(!!getToken());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location]);

  const handleSignout = async () => {
    const token = getToken();
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    removeToken();
    setIsAdmin(false);
    navigate('/');
  };

  const links = [
    { to: '/', label: 'Home' },
    { to: '/register', label: 'Register' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/hall-of-fame', label: 'Hall of Fame' },
    { to: '/management-team', label: 'Management Team' },
    { to: '/my-profile', label: 'My Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0d0a1a]/95 backdrop-blur-md shadow-lg shadow-purple-900/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center">
              <Crown size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              <span className="text-white">Ignite</span>
              <span className="text-amber-400">'26</span>
              <span className="text-purple-400 text-sm ml-1">2026</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(l.to)
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}>
                {l.label}
              </Link>
            ))}
            {isAdmin ? (
              <>
                <Link to="/admin" className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                  location.pathname.startsWith('/admin') ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400 hover:bg-amber-500/10'
                }`}>
                  <Shield size={14} /> Admin
                </Link>
                <button onClick={handleSignout} className="ml-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-1">
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="ml-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:opacity-90 transition-opacity">
                Admin
              </Link>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300 hover:text-white">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#0d0a1a]/98 backdrop-blur-md border-t border-purple-900/30">
          <div className="px-4 py-3 space-y-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(l.to) ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'
                }`}>
                {l.label}
              </Link>
            ))}
            {isAdmin ? (
              <>
                <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-amber-400 text-sm">Admin Dashboard</Link>
                <button onClick={handleSignout} className="block w-full text-left px-3 py-2 text-red-400 text-sm">Sign Out</button>
              </>
            ) : (
              <Link to="/admin/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-purple-400 text-sm">Admin Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
