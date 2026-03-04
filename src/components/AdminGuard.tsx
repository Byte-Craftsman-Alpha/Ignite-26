import { useState, useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAdminAuth } from '../lib/auth';
import LoadingSpinner from './LoadingSpinner';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    checkAdminAuth().then(user => setStatus(user ? 'ok' : 'denied'));
  }, []);

  if (status === 'loading') return <div className="min-h-screen bg-[#0d0a1a] flex items-center justify-center"><LoadingSpinner text="Verifying admin access..." /></div>;
  if (status === 'denied') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
